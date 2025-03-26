
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
  const [photos, setPhotos] = useState<File[]>([]);
  const [primaryPhotoIndex, setPrimaryPhotoIndex] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

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
      unit_cost: item?.unit_cost || 0,
      price: item?.price || 0,
      width: item?.width || undefined,
      height: item?.height || undefined,
      depth: item?.depth || undefined,
      weight: item?.weight || undefined,
    },
  });

  // Carregar fotos existentes se estiver editando um item
  useEffect(() => {
    if (item && item.photos && item.photos.length > 0) {
      // Convertemos as URLs das fotos existentes para objetos File usando fetch
      const loadExistingPhotos = async () => {
        try {
          const photoFiles: File[] = [];
          let primaryIndex = null;
          
          for (let i = 0; i < item.photos.length; i++) {
            const photo = item.photos[i];
            try {
              // Fetch da imagem para converter para blob
              const response = await fetch(photo.photo_url);
              const blob = await response.blob();
              
              // Extrair nome do arquivo da URL
              const urlParts = photo.photo_url.split('/');
              const fileName = urlParts[urlParts.length - 1] || `photo_${i}.jpg`;
              
              // Criar objeto File
              const file = new File([blob], fileName, { 
                type: blob.type || 'image/jpeg',
                lastModified: new Date().getTime()
              });
              
              photoFiles.push(file);
              
              // Verificar se é a foto primária
              if (photo.is_primary) {
                primaryIndex = i;
              }
            } catch (error) {
              console.error(`Erro ao carregar foto ${photo.photo_url}:`, error);
            }
          }
          
          setPhotos(photoFiles);
          setPrimaryPhotoIndex(primaryIndex !== null ? primaryIndex : (photoFiles.length > 0 ? 0 : null));
          
        } catch (error) {
          console.error('Erro ao carregar fotos existentes:', error);
          toast.error("Não foi possível carregar as fotos existentes");
        }
      };
      
      loadExistingPhotos();
    }
  }, [item]);

  // Função para fazer upload direto das fotos para o Storage do Supabase
  const uploadPhotosToSupabase = async (itemId: string): Promise<Array<{photo_url: string; is_primary: boolean}>> => {
    if (photos.length === 0) return [];
    
    try {
      console.log(`Iniciando upload de ${photos.length} fotos para o item ${itemId}`);
      setUploadProgress(0);
      
      const results = [];
      
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        const isPrimary = i === primaryPhotoIndex;
        
        // Garantir que o nome do arquivo seja seguro para URLs
        const timestamp = new Date().getTime();
        const safeFileName = photo.name
          .replace(/[^a-zA-Z0-9_\-.]/g, '_')
          .toLowerCase();
        
        // Determinar a extensão correta com base no tipo MIME
        let fileExtension = '.jpg'; // Padrão
        if (photo.type === 'image/png') fileExtension = '.png';
        if (photo.type === 'image/jpeg') fileExtension = '.jpg';
        if (photo.type === 'image/gif') fileExtension = '.gif';
        if (photo.type === 'image/webp') fileExtension = '.webp';
        
        // Garantir que o nome do arquivo tenha a extensão correta
        const fileNameWithoutExt = safeFileName.replace(/\.[^/.]+$/, "");
        const finalFileName = `${fileNameWithoutExt}${fileExtension}`;
        
        // Caminho no formato: inventory/item_id/timestamp_filename.ext
        const filePath = `inventory/${itemId}/${timestamp}_${finalFileName}`;
        
        console.log(`Enviando foto ${i+1}/${photos.length}: ${filePath}`);
        
        // Upload do arquivo para o novo bucket 'inventory_images'
        const { data, error } = await supabase.storage
          .from('inventory_images')
          .upload(filePath, photo, {
            cacheControl: '3600',
            upsert: true
          });
        
        if (error) {
          console.error(`Erro ao fazer upload da foto ${i+1}:`, error);
          toast.error(`Erro ao enviar foto ${i+1}: ${error.message}`);
          continue;
        }
        
        // Obter URL pública
        const { data: urlData } = supabase.storage
          .from('inventory_images')
          .getPublicUrl(filePath);
        
        console.log(`Foto ${i+1} enviada com sucesso. URL:`, urlData.publicUrl);
        
        results.push({
          photo_url: urlData.publicUrl,
          is_primary: isPrimary
        });
        
        // Atualizar progresso
        setUploadProgress(Math.round(((i + 1) / photos.length) * 100));
      }
      
      console.log(`Upload finalizado. ${results.length} fotos enviadas com sucesso.`);
      return results;
      
    } catch (error) {
      console.error('Erro ao fazer upload das fotos:', error);
      toast.error("Erro ao enviar as fotos. Tente novamente.");
      return [];
    }
  };

  // Função para envio do formulário
  const onSubmit = async (values: FormValues) => {
    try {
      console.log("Iniciando submissão do formulário", values);
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
        price: values.price,
        width: values.width || null,
        height: values.height || null,
        depth: values.depth || null,
        weight: values.weight || null,
      };

      console.log("Dados preparados para salvamento:", itemData);
      
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
      
      // Em seguida, fazer upload das fotos diretamente para o Storage
      if (photos.length > 0) {
        console.log("Iniciando upload das fotos");
        const uploadedPhotos = await uploadPhotosToSupabase(savedItem.id);
        
        if (uploadedPhotos.length > 0) {
          // Após o upload, inserir os registros na tabela inventory_photos
          console.log("Salvando registros das fotos no banco de dados");
          const photoRecords = uploadedPhotos.map(photo => ({
            inventory_id: savedItem!.id,
            photo_url: photo.photo_url,
            is_primary: photo.is_primary
          }));
          
          // Remover fotos antigas primeiro
          const { error: deleteError } = await supabase
            .from('inventory_photos')
            .delete()
            .eq('inventory_id', savedItem.id);
            
          if (deleteError) {
            console.error("Erro ao excluir fotos antigas:", deleteError);
            toast.error("Erro ao atualizar fotos antigas");
          }
          
          // Inserir novas fotos
          const { data, error } = await supabase
            .from('inventory_photos')
            .insert(photoRecords)
            .select();
            
          if (error) {
            console.error("Erro ao salvar registros das fotos:", error);
            toast.error("Erro ao salvar informações das fotos");
          } else {
            console.log("Fotos salvas com sucesso:", data);
            
            // Atualizar o objeto savedItem com as fotos
            savedItem.photos = data;
          }
        }
      }

      if (item) {
        toast.success("Item atualizado com sucesso!");
      } else {
        toast.success("Item criado com sucesso!");
      }

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
    handleSubmit: form.handleSubmit(onSubmit),
    photos,
    setPhotos,
    primaryPhotoIndex,
    setPrimaryPhotoIndex,
    uploadProgress
  };
}
