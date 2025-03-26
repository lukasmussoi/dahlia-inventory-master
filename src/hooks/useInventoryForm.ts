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
      console.log("Fotos para salvamento:", photos.length);
      
      // CORREÇÃO: Preparar as fotos para envio, garantindo que cada objeto tenha file e is_primary
      const preparedPhotos = photos.map((photo, index) => {
        // Verificação detalhada para depuração
        console.log(`Preparando foto ${index + 1}/${photos.length}:`, {
          name: photo.name,
          type: photo.type,
          size: photo.size,
          lastModified: photo.lastModified,
          isPrimary: index === primaryPhotoIndex
        });
        
        // Retornar objeto no formato esperado pelo BaseInventoryModel.updateItemPhotos
        return {
          file: photo,
          is_primary: index === primaryPhotoIndex
        };
      });
      
      let savedItem: InventoryItem | null = null;

      if (item) {
        // Modo de edição
        console.log("Atualizando item existente");
        savedItem = await InventoryModel.updateItem(item.id, itemData);
        
        // Verificar se há fotos para atualizar
        if (preparedPhotos.length > 0) {
          console.log("Atualizando fotos do item:", preparedPhotos.length, "fotos");
          
          // CORREÇÃO: Logs detalhados para verificar o conteúdo do array de fotos
          console.log("Detalhes das fotos a serem enviadas:", 
            preparedPhotos.map((p, i) => ({
              index: i, 
              fileName: p.file.name,
              fileType: p.file.type,
              fileSize: p.file.size,
              isPrimary: p.is_primary
            }))
          );
          
          // Enviar as fotos para atualização
          await InventoryModel.updateItemPhotos(item.id, preparedPhotos);
        }
        
        toast.success("Item atualizado com sucesso!");
      } else {
        // Modo de criação
        console.log("Criando novo item");
        savedItem = await InventoryModel.createItem(itemData);
        
        // Verificar se há fotos para salvar e se o item foi criado com sucesso
        if (preparedPhotos.length > 0 && savedItem) {
          console.log("Salvando fotos do novo item:", preparedPhotos.length, "fotos");
          
          // CORREÇÃO: Logs detalhados para verificar o conteúdo do array de fotos
          console.log("Detalhes das fotos a serem enviadas:", 
            preparedPhotos.map((p, i) => ({
              index: i, 
              fileName: p.file.name,
              fileType: p.file.type,
              fileSize: p.file.size,
              isPrimary: p.is_primary
            }))
          );
          
          // Enviar as fotos para salvamento
          await InventoryModel.updateItemPhotos(savedItem.id, preparedPhotos);
        }
        
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
    setPrimaryPhotoIndex
  };
}
