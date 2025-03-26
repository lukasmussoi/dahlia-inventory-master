
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
import { useState } from "react";
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

type FormValues = z.infer<typeof formSchema>;

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

      // Processar fotos para o formato correto
      const processedPhotos = photos.map((file, index) => ({
        photo_url: URL.createObjectURL(file),
        is_primary: index === primaryPhotoIndex
      }));

      let savedItem: InventoryItem | null = null;

      if (item) {
        // Modo de edição
        console.log("Atualizando item existente");
        savedItem = await InventoryModel.updateItem(item.id, itemData);
        if (photos.length > 0) {
          await InventoryModel.updateItemPhotos(item.id, processedPhotos);
        }
        toast.success("Item atualizado com sucesso!");
      } else {
        // Modo de criação
        console.log("Criando novo item");
        savedItem = await InventoryModel.createItem(itemData);
        if (photos.length > 0 && savedItem) {
          await InventoryModel.updateItemPhotos(savedItem.id, processedPhotos);
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
    onSubmit: form.handleSubmit(onSubmit),
    photos,
    setPhotos,
    primaryPhotoIndex,
    setPrimaryPhotoIndex
  };
}
