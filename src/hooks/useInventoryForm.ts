/**
 * Hook para gerenciar o formulário de inventário
 * 
 * Este hook contém toda a lógica de manipulação do formulário de inventário,
 * incluindo validação, envio de dados e gerenciamento de fotos.
 * 
 * Relaciona-se com:
 * - InventoryForm.tsx
 * - InventoryModel
 */
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { InventoryItem, InventoryModel } from "@/models/inventory";
import { supabase } from "@/integrations/supabase/client";
import { uploadMultiplePhotos, deletePhoto } from "@/utils/photoUploadUtils";

// Tipo para fotos existentes vs. novas
export type PhotoItem = {
  file?: File;
  photo_url?: string;
  is_primary: boolean;
  id?: string;
  type: 'existing' | 'new';
};

// Esquema de validação do formulário
const formSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  sku: z.string().optional(),
  category_id: z.string().min(1, "Categoria é obrigatória"),
  supplier_id: z.string().optional(),
  barcode: z.string().optional(),
  quantity: z.number().int().min(0, "Quantidade não pode ser negativa"),
  min_stock: z.number().int().min(0, "Estoque mínimo não pode ser negativo"),
  unit_cost: z.number().min(0, "Custo não pode ser negativo"),
  raw_cost: z.number().min(0, "Preço do bruto não pode ser negativo"),
  price: z.number().min(0, "Preço não pode ser negativo"),
  width: z.number().optional(),
  height: z.number().optional(),
  depth: z.number().optional(),
  weight: z.number().optional(),
});

// Exportamos o tipo FormValues para uso em outros componentes
export type FormValues = z.infer<typeof formSchema>;

interface UseInventoryFormProps {
  item?: InventoryItem | null;
  onClose: () => void;
  onSuccess?: (item: InventoryItem) => void;
}

export function useInventoryForm({ item, onClose, onSuccess }: UseInventoryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [photosModified, setPhotosModified] = useState(false);
  const [originalPhotos, setOriginalPhotos] = useState<PhotoItem[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const originalUnitCostRef = useRef<number | undefined>(undefined);
  const originalRawCostRef = useRef<number | undefined>(undefined);
  const formInitializedRef = useRef(false);
  const userChangedUnitCostRef = useRef(false);
  const userChangedRawCostRef = useRef(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      sku: "",
      category_id: "",
      supplier_id: "",
      barcode: "",
      quantity: 0,
      min_stock: 0,
      unit_cost: 0,
      raw_cost: 0,
      price: 0,
      width: undefined,
      height: undefined,
      depth: undefined,
      weight: undefined,
    },
  });

  useEffect(() => {
    if (!formInitializedRef.current && item) {
      console.log("[useInventoryForm] Inicializando formulário com valores do item:", {
        id: item.id,
        nome: item.name,
        raw_cost: item.raw_cost,
        unit_cost: item.unit_cost,
        raw_cost_tipo: typeof item.raw_cost,
        unit_cost_tipo: typeof item.unit_cost
      });
      
      originalUnitCostRef.current = item.unit_cost;
      originalRawCostRef.current = item.raw_cost;
      
      const rawCost = typeof item.raw_cost === 'number' 
                     ? item.raw_cost 
                     : (typeof item.raw_cost === 'string' 
                        ? parseFloat(item.raw_cost) 
                        : 0);
                        
      const unitCost = typeof item.unit_cost === 'number'
                      ? item.unit_cost
                      : (typeof item.unit_cost === 'string'
                         ? parseFloat(item.unit_cost)
                         : 0);
      
      form.reset({
        name: item.name || "",
        sku: item.sku || "",
        category_id: item.category_id || "",
        supplier_id: item.supplier_id || "",
        barcode: item.barcode || "",
        quantity: item.quantity || 0,
        min_stock: item.min_stock || 0,
        unit_cost: unitCost,
        raw_cost: rawCost,
        price: item.price || 0,
        width: item.width || undefined,
        height: item.height || undefined,
        depth: item.depth || undefined,
        weight: item.weight || undefined,
      });
      
      console.log("[useInventoryForm] Valores definidos no formulário após reset:", {
        raw_cost: form.getValues("raw_cost"),
        unit_cost: form.getValues("unit_cost"),
        original_raw_cost: originalRawCostRef.current,
        original_unit_cost: originalUnitCostRef.current
      });
      
      formInitializedRef.current = true;
      setIsEditMode(true);
    } else if (!item) {
      form.reset();
      originalUnitCostRef.current = undefined;
      originalRawCostRef.current = undefined;
      formInitializedRef.current = false;
      userChangedUnitCostRef.current = false;
      userChangedRawCostRef.current = false;
      setIsEditMode(false);
    }
  }, [item, form]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'unit_cost' && formInitializedRef.current) {
        userChangedUnitCostRef.current = true;
        console.log("Usuário modificou o custo total para:", value.unit_cost);
      }
      if (name === 'raw_cost' && formInitializedRef.current) {
        userChangedRawCostRef.current = true;
        console.log("Usuário modificou o preço do bruto para:", value.raw_cost);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    if (item && item.photos && item.photos.length > 0) {
      console.log("Carregando fotos existentes do item:", item.id);
      
      try {
        const existingPhotos: PhotoItem[] = item.photos.map(photo => ({
          id: photo.id,
          photo_url: photo.photo_url,
          is_primary: photo.is_primary || false,
          type: 'existing'
        }));
        
        console.log(`${existingPhotos.length} fotos existentes carregadas com sucesso`);
        
        setPhotos(existingPhotos);
        setOriginalPhotos([...existingPhotos]);
        setPhotosModified(false);
      } catch (error) {
        console.error('Erro ao carregar fotos existentes:', error);
        toast.error("Não foi possível carregar as fotos existentes");
      }
    } else {
      setPhotosModified(false);
      setPhotos([]);
      setOriginalPhotos([]);
    }
  }, [item]);

  const addNewPhotos = (files: File[]) => {
    console.log(`Adicionando ${files.length} novas fotos`);
    
    const newPhotoItems: PhotoItem[] = files.map(file => ({
      file,
      is_primary: false,
      type: 'new'
    }));
    
    const updatedPhotos = [...photos, ...newPhotoItems];
    
    if (!updatedPhotos.some(p => p.is_primary) && updatedPhotos.length > 0) {
      updatedPhotos[0].is_primary = true;
    }
    
    setPhotos(updatedPhotos);
    setPhotosModified(true);
    
    console.log("Estado de fotos atualizado:", updatedPhotos);
  };

  const setPrimaryPhoto = (index: number) => {
    console.log(`Definindo foto ${index} como primária`);
    
    const updatedPhotos = photos.map((photo, i) => ({
      ...photo,
      is_primary: i === index
    }));
    
    setPhotos(updatedPhotos);
    setPhotosModified(true);
  };

  const removePhoto = (index: number) => {
    console.log(`Removendo foto no índice ${index}`);
    
    const isPrimary = photos[index].is_primary;
    
    const updatedPhotos = photos.filter((_, i) => i !== index);
    
    if (isPrimary && updatedPhotos.length > 0) {
      updatedPhotos[0].is_primary = true;
    }
    
    setPhotos(updatedPhotos);
    setPhotosModified(true);
    
    console.log("Estado de fotos após remoção:", updatedPhotos);
  };

  const handleSavePhotosOnly = async () => {
    try {
      if (!item) {
        toast.error("É necessário salvar o item primeiro para anexar fotos.");
        return;
      }
      
      if (!photosModified) {
        toast.info("Nenhuma alteração nas fotos para salvar.");
        return;
      }
      
      console.log("Iniciando salvamento de fotos para o item:", item.id);
      setIsSubmitting(true);
      
      const removedPhotos = originalPhotos.filter(originalPhoto => 
        !photos.some(currentPhoto => 
          currentPhoto.type === 'existing' && currentPhoto.photo_url === originalPhoto.photo_url
        )
      );
      
      console.log(`Detectadas ${removedPhotos.length} fotos removidas`);
      
      for (const photo of removedPhotos) {
        if (photo.photo_url) {
          console.log(`Excluindo foto removida: ${photo.photo_url}`);
          await deletePhoto(photo.photo_url, 'inventory_images');
        }
      }
      
      const photoUpdates = await processPhotoUpdates(item.id);
      
      if (photoUpdates) {
        setPhotosModified(false);
        setOriginalPhotos([...photos]);
        toast.success("Fotos atualizadas com sucesso!");
      }
    } catch (error) {
      console.error('Erro ao salvar fotos:', error);
      toast.error("Erro ao salvar fotos. Verifique as permissões e tente novamente.");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const processPhotoUpdates = async (itemId: string): Promise<boolean> => {
    try {
      console.log("Processando atualizações de fotos para o item:", itemId);
      
      const newPhotos = photos.filter(photo => photo.type === 'new' && photo.file);
      console.log(`${newPhotos.length} novas fotos para fazer upload`);
      
      const existingPhotos = photos.filter(photo => photo.type === 'existing' && photo.photo_url);
      console.log(`${existingPhotos.length} fotos existentes serão mantidas`);
      
      const removedPhotos = originalPhotos.filter(originalPhoto => 
        !photos.some(currentPhoto => 
          currentPhoto.type === 'existing' && currentPhoto.photo_url === originalPhoto.photo_url
        )
      );
      console.log(`${removedPhotos.length} fotos serão excluídas`);
      
      if (newPhotos.length === 0 && removedPhotos.length === 0 && !photos.some((p, i) => p.is_primary !== originalPhotos[i]?.is_primary)) {
        console.log("Nenhuma alteração nas fotos detectada");
        return false;
      }
      
      for (const photo of removedPhotos) {
        if (photo.photo_url) {
          console.log(`Excluindo foto removida: ${photo.photo_url}`);
          await deletePhoto(photo.photo_url, 'inventory_images');
        }
      }
      
      const filesToUpload: File[] = newPhotos
        .filter(photo => photo.file instanceof File)
        .map(photo => photo.file as File);
      
      let uploadResults: { photo_url: string; is_primary: boolean }[] = [];
      
      if (filesToUpload.length > 0) {
        console.log(`Iniciando upload de ${filesToUpload.length} novas fotos`);
        setUploadProgress(0);
        
        const results = await uploadMultiplePhotos(
          filesToUpload,
          'inventory_images',
          (progress) => setUploadProgress(progress),
          itemId
        );
        
        uploadResults = results
          .filter(r => r.success && r.url)
          .map((result, index) => ({
            photo_url: result.url as string,
            is_primary: newPhotos[index].is_primary
          }));
        
        console.log(`${uploadResults.length} novas fotos enviadas com sucesso`);
      }
      
      const allPhotoRecords = [
        ...existingPhotos.map(photo => ({
          inventory_id: itemId,
          photo_url: photo.photo_url as string,
          is_primary: photo.is_primary
        })),
        ...uploadResults.map(result => ({
          inventory_id: itemId,
          photo_url: result.photo_url,
          is_primary: result.is_primary
        }))
      ];
      
      let primaryFound = false;
      for (let i = 0; i < allPhotoRecords.length; i++) {
        if (allPhotoRecords[i].is_primary) {
          if (primaryFound) {
            allPhotoRecords[i].is_primary = false;
          } else {
            primaryFound = true;
          }
        }
      }
      
      if (!primaryFound && allPhotoRecords.length > 0) {
        allPhotoRecords[0].is_primary = true;
      }
      
      console.log(`Salvando ${allPhotoRecords.length} registros de fotos no banco`);
      
      const { error: deleteError } = await supabase
        .from('inventory_photos')
        .delete()
        .eq('inventory_id', itemId);
        
      if (deleteError) {
        console.error("Erro ao excluir fotos antigas do banco:", deleteError);
        throw new Error("Erro ao atualizar fotos antigas");
      }
      
      const { data, error } = await supabase
        .from('inventory_photos')
        .insert(allPhotoRecords)
        .select();
        
      if (error) {
        console.error("Erro ao salvar registros das fotos:", error);
        throw new Error("Erro ao salvar informações das fotos");
      }
      
      console.log(`${data.length} registros de fotos salvos com sucesso`);
      
      setPhotos(data.map(photo => ({
        id: photo.id,
        photo_url: photo.photo_url,
        is_primary: photo.is_primary,
        type: 'existing'
      })));
      
      setOriginalPhotos(data.map(photo => ({
        id: photo.id,
        photo_url: photo.photo_url,
        is_primary: photo.is_primary,
        type: 'existing'
      })));
      
      return true;
    } catch (error) {
      console.error("Erro ao processar atualizações de fotos:", error);
      throw error;
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      console.log("[useInventoryForm] Iniciando submissão do formulário", {
        raw_cost: values.raw_cost,
        unit_cost: values.unit_cost
      });
      setIsSubmitting(true);

      const itemData = {
        name: values.name,
        sku: values.sku || "",
        category_id: values.category_id,
        supplier_id: values.supplier_id || null,
        barcode: values.barcode || "",
        quantity: values.quantity,
        min_stock: values.min_stock,
        unit_cost: values.unit_cost,
        raw_cost: values.raw_cost,
        price: values.price,
        width: values.width || null,
        height: values.height || null,
        depth: values.depth || null,
        weight: values.weight || null,
      };

      console.log("[useInventoryForm] VALORES FINAIS QUE SERÃO ENVIADOS:", {
        preco_do_bruto: itemData.raw_cost,
        custo_total: itemData.unit_cost
      });

      let savedItem: InventoryItem | null = null;

      if (item) {
        console.log("[useInventoryForm] Atualizando item existente com raw_cost =", itemData.raw_cost, "e unit_cost =", itemData.unit_cost);
        savedItem = await InventoryModel.updateItem(item.id, itemData);
      } else {
        console.log("[useInventoryForm] Criando novo item com raw_cost =", itemData.raw_cost, "e unit_cost =", itemData.unit_cost);
        savedItem = await InventoryModel.createItem(itemData);
      }
      
      if (!savedItem) {
        throw new Error("Erro ao salvar dados do item");
      }
      
      console.log("[useInventoryForm] Item salvo com sucesso. Valores no banco:", {
        raw_cost: savedItem.raw_cost,
        unit_cost: savedItem.unit_cost
      });
      
      originalUnitCostRef.current = savedItem.unit_cost;
      originalRawCostRef.current = savedItem.raw_cost;
      userChangedUnitCostRef.current = false;
      userChangedRawCostRef.current = false;
      
      if (photosModified || !item) {
        console.log("Processando fotos - modificadas ou novo item");
        await processPhotoUpdates(savedItem.id);
      } else {
        console.log("Fotos não foram modificadas, mantendo as existentes");
      }

      if (item) {
        toast.success("Item atualizado com sucesso!");
      } else {
        toast.success("Item criado com sucesso!");
        form.reset();
        formInitializedRef.current = false;
      }

      if (onSuccess && savedItem) {
        onSuccess(savedItem);
      } else {
        onClose();
      }
    } catch (error) {
      console.error('[useInventoryForm] Erro ao salvar item:', error);
      toast.error("Erro ao salvar item. Verifique os dados e tente novamente.");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  return {
    form,
    isSubmitting,
    onSubmit,
    handleSubmit: onSubmit,
    photos,
    setPhotos,
    addPhoto: (file: File) => {
      addNewPhotos([file]);
      setPhotosModified(true);
    },
    addPhotos: (files: File[]) => {
      addNewPhotos(files);
      setPhotosModified(true);
    },
    setPrimaryPhoto,
    removePhoto,
    uploadProgress,
    setUploadProgress,
    savePhotosOnly: handleSavePhotosOnly,
    photosModified,
    setPhotosModified
  };
}
