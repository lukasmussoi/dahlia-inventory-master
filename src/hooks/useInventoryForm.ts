
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
  weight: z.number().min(0, "Peso não pode ser negativo").optional(),
  width: z.number().min(0, "Largura não pode ser negativa").optional(),
  height: z.number().min(0, "Altura não pode ser negativa").optional(),
  depth: z.number().min(0, "Profundidade não pode ser negativa").optional(),
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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: item?.name || "",
      category_id: item?.category_id || "",
      quantity: item?.quantity || 0,
      price: item?.price || 0,
      unit_cost: item?.unit_cost || 0,
      suggested_price: item?.suggested_price || 0,
      weight: item?.weight,
      width: item?.width,
      height: item?.height,
      depth: item?.depth,
      min_stock: item?.min_stock || 0,
      supplier_id: item?.supplier_id || undefined,
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      if (item) {
        await InventoryModel.updateItem(item.id, values);
        toast.success("Item atualizado com sucesso!");
      } else {
        // Garantir que os campos obrigatórios estejam presentes
        const newItem = {
          name: values.name,
          category_id: values.category_id,
          quantity: values.quantity,
          price: values.price,
          unit_cost: values.unit_cost,
          suggested_price: values.suggested_price,
          min_stock: values.min_stock,
          // Campos opcionais
          supplier_id: values.supplier_id,
          weight: values.weight,
          width: values.width,
          height: values.height,
          depth: values.depth,
        };
        await InventoryModel.createItem(newItem);
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
    onSubmit: form.handleSubmit(onSubmit),
  };
};
