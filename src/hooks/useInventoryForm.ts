
/**
 * Hook personalizado para gerenciar o formulário de itens do inventário
 * Lida com a lógica de criação e edição de itens, incluindo validação e envio
 */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { InventoryItem, InventoryModel } from "@/models/inventoryModel";

// Schema de validação do formulário
const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  category_id: z.string().min(1, "Categoria é obrigatória"),
  quantity: z.number().min(0, "Quantidade não pode ser negativa"),
  price: z.number().min(0, "Preço não pode ser negativo"),
  unit_cost: z.number().min(0, "Custo unitário não pode ser negativo"),
  suggested_price: z.number().min(0, "Preço sugerido não pode ser negativo"),
  min_stock: z.number().min(0, "Estoque mínimo não pode ser negativo"),
  markup_percentage: z.number().min(0, "Markup não pode ser negativo"),
  supplier_id: z.string().optional(),
  plating_type_id: z.string().optional(),
  material_weight: z.number().min(0, "Peso do material não pode ser negativo").optional(),
  packaging_cost: z.number().min(0, "Custo da embalagem não pode ser negativo").optional(),
  weight: z.number().min(0).optional(),
  width: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
  depth: z.number().min(0).optional(),
});

export type FormValues = z.infer<typeof formSchema>;

interface UseInventoryFormProps {
  item?: InventoryItem | null;
  onSuccess?: () => void;
  onClose: () => void;
}

export const useInventoryForm = ({ item, onSuccess, onClose }: UseInventoryFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [primaryPhotoIndex, setPrimaryPhotoIndex] = useState<number | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: item?.name || "",
      category_id: item?.category_id || "",
      quantity: item?.quantity || 0,
      price: item?.price || 0,
      unit_cost: item?.unit_cost || 0,
      suggested_price: item?.suggested_price || 0,
      weight: item?.weight || 0,
      width: item?.width || 0,
      height: item?.height || 0,
      depth: item?.depth || 0,
      min_stock: item?.min_stock || 0,
      supplier_id: item?.supplier_id || "",
      markup_percentage: item?.markup_percentage || 30.0,
      plating_type_id: item?.plating_type_id || "",
      material_weight: item?.material_weight || 0,
      packaging_cost: item?.packaging_cost || 0,
    },
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);

      if (photos.length > 5) {
        toast.error("Máximo de 5 fotos permitido");
        return;
      }

      // Garantir que todos os campos obrigatórios estejam presentes
      const itemData = {
        name: values.name,
        category_id: values.category_id,
        quantity: values.quantity,
        price: values.price,
        unit_cost: values.unit_cost,
        suggested_price: values.suggested_price,
        min_stock: values.min_stock,
        markup_percentage: values.markup_percentage,
        // Campos opcionais
        supplier_id: values.supplier_id,
        plating_type_id: values.plating_type_id,
        material_weight: values.material_weight,
        packaging_cost: values.packaging_cost,
        weight: values.weight,
        width: values.width,
        height: values.height,
        depth: values.depth,
      };

      if (item) {
        await InventoryModel.updateItem(item.id, itemData);
        if (photos.length > 0) {
          // Fix: Remove third parameter
          await InventoryModel.updateItemPhotos(item.id, photos);
        }
        toast.success("Item atualizado com sucesso!");
      } else {
        const createdItem = await InventoryModel.createItem(itemData);
        if (photos.length > 0) {
          // Fix: Remove third parameter
          await InventoryModel.updateItemPhotos(createdItem.id, photos);
        }
        toast.success("Item criado com sucesso!");
      }
      onSuccess?.();
      onClose();
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
    onSubmit: form.handleSubmit(handleSubmit),
    photos,
    setPhotos,
    primaryPhotoIndex,
    setPrimaryPhotoIndex,
  };
};
