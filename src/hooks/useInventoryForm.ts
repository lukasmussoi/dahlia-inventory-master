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
import { useState, useEffect } from "react";
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
  // Flag para controlar se é modo de edição
  const [isEditMode, setIsEditMode] = useState(false);
  // CORREÇÃO DO BUG: Adicionando um estado para armazenar o valor original do preço bruto
  const [originalUnitCost, setOriginalUnitCost] = useState<number | undefined>(undefined);

  // Inicializa o formulário com valores padrão
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: item?.name || "",
      sku: item?.sku || "",
      category_id: item?.category_id || "",
      supplier_id: item?.supplier_id || "",
      barcode: item?.barcode || "",
      quantity: item?.quantity || 0,
      min_stock: item?.min_stock || 0,
      // CORREÇÃO DO BUG: Definir explicitamente o unit_cost sem nenhum cálculo
      unit_cost: item?.unit_cost || 0,
      price: item?.price || 0,
      width: item?.width || undefined,
      height: item?.height || undefined,
      depth: item?.depth || undefined,
      weight: item?.weight || undefined,
    },
  });

  // CORREÇÃO DO BUG: Capturar o valor original do preço bruto
  useEffect(() => {
    // Define se estamos em modo de edição
    setIsEditMode(!!item);
    console.log("Modo de edição:", !!item);
    
    if (item?.unit_cost !== undefined) {
      console.log("Preço do Bruto original carregado do banco:", item.unit_cost);
      // Armazenar o valor original para garantir que não seja alterado automaticamente
      setOriginalUnitCost(item.unit_cost);
      
      // IMPORTANTE: Forçar a atualização do valor no formulário para garantir que seja exato
      form.setValue("unit_cost", item.unit_cost);
    }
  }, [item, form]);

  // CORREÇÃO DO BUG: Garantir que o valor do preço bruto não seja alterado automaticamente
  useEffect(() => {
    // Se estivermos em modo de edição e temos um valor original, garantir que ele seja mantido
    if (isEditMode && originalUnitCost !== undefined) {
      // Verificar se o valor atual do formulário é diferente do original
      const currentValue = form.getValues("unit_cost");
      
      if (currentValue !== originalUnitCost) {
        console.log("Detectada alteração automática no preço bruto. Restaurando valor original:", originalUnitCost);
        // Restaurar o valor original
        form.setValue("unit_cost", originalUnitCost);
      }
    }
  }, [isEditMode, originalUnitCost, form]);

  // Carregar fotos existentes se estiver editando um item
  useEffect(() => {
    if (item && item.photos && item.photos.length > 0) {
      console.log("Carregando fotos existentes do item:", item.id);
      
      try {
        // Converter fotos existentes para o novo formato PhotoItem
        const existingPhotos: PhotoItem[] = item.photos.map(photo => ({
          id: photo.id,
          photo_url: photo.photo_url,
          is_primary: photo.is_primary || false,
          type: 'existing'
        }));
        
        console.log(`${existingPhotos.length} fotos existentes carregadas com sucesso`);
        
        // Armazenar as fotos existentes
        setPhotos(existingPhotos);
        setOriginalPhotos([...existingPhotos]); // Cópia para comparação posterior
        setPhotosModified(false);
      } catch (error) {
        console.error('Erro ao carregar fotos existentes:', error);
        toast.error("Não foi possível carregar as fotos existentes");
      }
    } else {
      // Reset do estado para quando não há fotos existentes
      console.log("Item sem fotos ou novo item");
      setPhotosModified(false);
      setPhotos([]);
      setOriginalPhotos([]);
    }
  }, [item]);

  // Função para adicionar novas fotos
  const addNewPhotos = (files: File[]) => {
    console.log(`Adicionando ${files.length} novas fotos`);
    
    // Converter Files para PhotoItems do tipo 'new'
    const newPhotoItems: PhotoItem[] = files.map(file => ({
      file,
      is_primary: false, // Por padrão, não é primária
      type: 'new'
    }));
    
    // Atualizar o estado
    const updatedPhotos = [...photos, ...newPhotoItems];
    
    // Se não há foto primária e estamos adicionando fotos, definir a primeira como primária
    if (!updatedPhotos.some(p => p.is_primary) && updatedPhotos.length > 0) {
      updatedPhotos[0].is_primary = true;
    }
    
    setPhotos(updatedPhotos);
    setPhotosModified(true);
    
    console.log("Estado de fotos atualizado:", updatedPhotos);
  };

  // Função para definir uma foto como primária
  const setPrimaryPhoto = (index: number) => {
    console.log(`Definindo foto ${index} como primária`);
    
    const updatedPhotos = photos.map((photo, i) => ({
      ...photo,
      is_primary: i === index
    }));
    
    setPhotos(updatedPhotos);
    setPhotosModified(true);
  };

  // Função para remover uma foto
  const removePhoto = (index: number) => {
    console.log(`Removendo foto no índice ${index}`);
    
    // Verificar se a foto é primária
    const isPrimary = photos[index].is_primary;
    
    // Remover a foto
    const updatedPhotos = photos.filter((_, i) => i !== index);
    
    // Se a foto removida era primária e ainda temos fotos, definir a primeira como primária
    if (isPrimary && updatedPhotos.length > 0) {
      updatedPhotos[0].is_primary = true;
    }
    
    setPhotos(updatedPhotos);
    setPhotosModified(true);
    
    console.log("Estado de fotos após remoção:", updatedPhotos);
  };

  // Função para salvar somente as fotos, sem submeter o formulário
  const handleSavePhotosOnly = async () => {
    try {
      if (!item) {
        toast.error("É necessário salvar o item primeiro para anexar fotos.");
        return;
      }
      
      // Se as fotos não foram modificadas, não precisamos fazer nada
      if (!photosModified) {
        toast.info("Nenhuma alteração nas fotos para salvar.");
        return;
      }
      
      console.log("Iniciando salvamento de fotos para o item:", item.id);
      setIsSubmitting(true);
      
      // Identificar fotos removidas comparando com as originais
      const removedPhotos = originalPhotos.filter(originalPhoto => 
        !photos.some(currentPhoto => 
          currentPhoto.type === 'existing' && currentPhoto.photo_url === originalPhoto.photo_url
        )
      );
      
      console.log(`Detectadas ${removedPhotos.length} fotos removidas`);
      
      // Excluir fotos removidas do storage
      for (const photo of removedPhotos) {
        if (photo.photo_url) {
          console.log(`Excluindo foto removida: ${photo.photo_url}`);
          await deletePhoto(photo.photo_url, 'inventory_images');
        }
      }
      
      // Processar uploads se necessário
      const photoUpdates = await processPhotoUpdates(item.id);
      
      if (photoUpdates) {
        // Atualizar o estado
        setPhotosModified(false);
        setOriginalPhotos([...photos]); // Atualizar fotos originais
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

  // Função para processar as atualizações de fotos
  const processPhotoUpdates = async (itemId: string): Promise<boolean> => {
    try {
      console.log("Processando atualizações de fotos para o item:", itemId);
      
      // Identificar fotos novas que precisam de upload
      const newPhotos = photos.filter(photo => photo.type === 'new' && photo.file);
      console.log(`${newPhotos.length} novas fotos para fazer upload`);
      
      // Fotos existentes que serão mantidas
      const existingPhotos = photos.filter(photo => photo.type === 'existing' && photo.photo_url);
      console.log(`${existingPhotos.length} fotos existentes serão mantidas`);
      
      // Identificar fotos removidas comparando com as originais
      const removedPhotos = originalPhotos.filter(originalPhoto => 
        !photos.some(currentPhoto => 
          currentPhoto.type === 'existing' && currentPhoto.photo_url === originalPhoto.photo_url
        )
      );
      console.log(`${removedPhotos.length} fotos serão excluídas`);
      
      // Se não há atualizações, não precisamos fazer nada
      if (newPhotos.length === 0 && removedPhotos.length === 0 && !photos.some((p, i) => p.is_primary !== originalPhotos[i]?.is_primary)) {
        console.log("Nenhuma alteração nas fotos detectada");
        return false;
      }
      
      // Excluir fotos removidas do storage
      for (const photo of removedPhotos) {
        if (photo.photo_url) {
          console.log(`Excluindo foto removida: ${photo.photo_url}`);
          await deletePhoto(photo.photo_url, 'inventory_images');
        }
      }
      
      // Preparar array para o upload de novas fotos
      const filesToUpload: File[] = newPhotos
        .filter(photo => photo.file instanceof File)
        .map(photo => photo.file as File);
      
      let uploadResults: { photo_url: string; is_primary: boolean }[] = [];
      
      // Fazer upload das novas fotos
      if (filesToUpload.length > 0) {
        console.log(`Iniciando upload de ${filesToUpload.length} novas fotos`);
        setUploadProgress(0);
        
        const results = await uploadMultiplePhotos(
          filesToUpload,
          'inventory_images',
          (progress) => setUploadProgress(progress),
          itemId
        );
        
        // Converter resultados de upload para o formato esperado
        uploadResults = results
          .filter(r => r.success && r.url)
          .map((result, index) => ({
            photo_url: result.url as string,
            is_primary: newPhotos[index].is_primary
          }));
        
        console.log(`${uploadResults.length} novas fotos enviadas com sucesso`);
      }
      
      // Combinar fotos existentes e novas fotos para salvar no banco
      const allPhotoRecords = [
        // Fotos existentes com is_primary atualizado
        ...existingPhotos.map(photo => ({
          inventory_id: itemId,
          photo_url: photo.photo_url as string,
          is_primary: photo.is_primary
        })),
        // Novas fotos enviadas
        ...uploadResults.map(result => ({
          inventory_id: itemId,
          photo_url: result.photo_url,
          is_primary: result.is_primary
        }))
      ];
      
      // Garantir que apenas uma foto seja primária
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
      
      // Se nenhuma foto está marcada como primária, definir a primeira
      if (!primaryFound && allPhotoRecords.length > 0) {
        allPhotoRecords[0].is_primary = true;
      }
      
      // Salvar no banco de dados
      console.log(`Salvando ${allPhotoRecords.length} registros de fotos no banco`);
      
      // Remover registros antigos
      const { error: deleteError } = await supabase
        .from('inventory_photos')
        .delete()
        .eq('inventory_id', itemId);
        
      if (deleteError) {
        console.error("Erro ao excluir fotos antigas do banco:", deleteError);
        throw new Error("Erro ao atualizar fotos antigas");
      }
      
      // Inserir novos registros
      if (allPhotoRecords.length > 0) {
        const { data, error } = await supabase
          .from('inventory_photos')
          .insert(allPhotoRecords)
          .select();
          
        if (error) {
          console.error("Erro ao salvar registros das fotos:", error);
          throw new Error("Erro ao salvar informações das fotos");
        }
        
        console.log(`${data.length} registros de fotos salvos com sucesso`);
        
        // Atualizar o estado das fotos
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
      } else {
        // Se não há fotos, limpar o estado
        setPhotos([]);
        setOriginalPhotos([]);
      }
      
      return true;
    } catch (error) {
      console.error("Erro ao processar atualizações de fotos:", error);
      throw error;
    }
  };

  // Função para envio do formulário completo
  const onSubmit = async (values: FormValues) => {
    try {
      console.log("Iniciando submissão do formulário", values);
      setIsSubmitting(true);

      // CORREÇÃO DO BUG: Registro de valores para depuração
      console.log("Valores originais ao submeter formulário:");
      if (isEditMode && item) {
        console.log("Preço do Bruto original no banco:", item.unit_cost);
        if (originalUnitCost !== undefined) {
          console.log("Preço do Bruto original capturado:", originalUnitCost);
        }
      }
      console.log("Preço do Bruto enviado no formulário:", values.unit_cost);

      // CORREÇÃO DO BUG: Usar o valor original se estamos em modo de edição e o usuário não alterou o campo
      let finalUnitCost = values.unit_cost;
      if (isEditMode && originalUnitCost !== undefined && values.unit_cost === originalUnitCost) {
        console.log("Usando valor original do preço bruto sem recalcular");
        finalUnitCost = originalUnitCost;
      }

      const itemData = {
        name: values.name,
        sku: values.sku || "",
        category_id: values.category_id,
        supplier_id: values.supplier_id || null,
        barcode: values.barcode || "",
        quantity: values.quantity,
        min_stock: values.min_stock,
        // CORREÇÃO DO BUG: Usar o valor final determinado acima
        unit_cost: finalUnitCost,
        price: values.price,
        width: values.width || null,
        height: values.height || null,
        depth: values.depth || null,
        weight: values.weight || null,
      };

      console.log("Dados preparados para salvamento:", itemData);
      console.log("Campo 'Preço do Bruto' mantido sem alterações:", finalUnitCost);
      
      let savedItem: InventoryItem | null = null;

      // Primeiro, salvar os dados do item sem as fotos
      if (item) {
        // Modo de edição
        console.log("Atualizando item existente");
        savedItem = await InventoryModel.updateItem(item.id, itemData);
      } else {
        // Modo de criação
        console.log("Criando novo item");
        savedItem = await InventoryModel.createItem(itemData);
      }
      
      if (!savedItem) {
        throw new Error("Erro ao salvar dados do item");
      }
      
      // Em seguida, processar as fotos
      if (photosModified || !item) {
        console.log("Processando fotos - modificadas ou novo item");
        await processPhotoUpdates(savedItem.id);
      } else {
        console.log("Fotos não foram modificadas, mantendo as existentes");
      }

      // Exibir mensagem de sucesso
      if (item) {
        toast.success("Item atualizado com sucesso!");
      } else {
        toast.success("Item criado com sucesso!");
      }

      // CORREÇÃO DO BUG: Armazenar o novo preço como original para futuras referências
      if (savedItem.unit_cost !== undefined) {
        setOriginalUnitCost(savedItem.unit_cost);
      }

      // Chamar callback de sucesso ou fechar o formulário
      if (onSuccess && savedItem) {
        onSuccess(savedItem);
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Erro ao salvar item:', error);
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
