
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
  weight: z.number().min(0, "Peso não pode ser negativo").nullable(),
  width: z.number().min(0, "Largura não pode ser negativa").nullable(),
  height: z.number().min(0, "Altura não pode ser negativa").nullable(),
  depth: z.number().min(0, "Profundidade não pode ser negativa").nullable(),
  min_stock: z.number().min(0, "Estoque mínimo não pode ser negativo"),
  supplier_id: z.string().optional(),
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
      weight: item?.weight || null,
      width: item?.width || null,
      height: item?.height || null,
      depth: item?.depth || null,
      min_stock: item?.min_stock || 0,
      supplier_id: item?.supplier_id || undefined,
    },
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);

      if (photos.length > 5) {
        toast.error("Máximo de 5 fotos permitido");
        return;
      }

      if (item) {
        await InventoryModel.updateItem(item.id, values);
        if (photos.length > 0) {
          await InventoryModel.updateItemPhotos(item.id, photos, primaryPhotoIndex);
        }
        toast.success("Item atualizado com sucesso!");
      } else {
        const newItem = {
          name: values.name,
          category_id: values.category_id,
          quantity: values.quantity,
          price: values.price,
          unit_cost: values.unit_cost,
          suggested_price: values.suggested_price,
          min_stock: values.min_stock,
          supplier_id: values.supplier_id,
          weight: values.weight,
          width: values.width,
          height: values.height,
          depth: values.depth,
        };
        const createdItem = await InventoryModel.createItem(newItem);
        if (photos.length > 0) {
          await InventoryModel.updateItemPhotos(createdItem.id, photos, primaryPhotoIndex);
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
