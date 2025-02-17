
/**
 * JewelryForm - Componente para criação e edição de joias no inventário
 */
import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { InventoryModel, PlatingType, Supplier, InventoryItem } from "@/models/inventoryModel";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { PriceSummary } from "./form/PriceSummary";
import { PhotoFields } from "./form/PhotoFields";

// Schema de validação do formulário
const formSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  plating_type_id: z.string().min(1, "Tipo de banho é obrigatório"),
  supplier_id: z.string().optional(),
  raw_cost: z.number().min(0, "Custo não pode ser negativo"),
  material_weight: z.number().min(0.01, "Peso deve ser maior que 0"),
  packaging_cost: z.number().min(0, "Custo não pode ser negativo"),
  quantity: z.number().int().min(0, "Quantidade não pode ser negativa"),
  min_stock: z.number().int().min(0, "Estoque mínimo não pode ser negativa"),
  markup_percentage: z.number().min(0, "Markup não pode ser negativo").default(30),
  price: z.number().min(0, "Preço não pode ser negativo").default(0),
  category_id: z.string().min(1, "Categoria é obrigatória"),
});

type FormValues = z.infer<typeof formSchema>;

interface JewelryFormProps {
  item?: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function JewelryForm({ item, isOpen, onClose, onSuccess }: JewelryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [primaryPhotoIndex, setPrimaryPhotoIndex] = useState<number | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: item?.name || "",
      plating_type_id: item?.plating_type_id || "",
      supplier_id: item?.supplier_id || "",
      raw_cost: item?.unit_cost || 0,
      material_weight: item?.material_weight || 0,
      packaging_cost: item?.packaging_cost || 0,
      quantity: item?.quantity || 0,
      min_stock: item?.min_stock || 0,
      markup_percentage: item?.markup_percentage || 30,
      price: item?.price || 0,
      category_id: item?.category_id || "",
    },
  });

  const { data: platingTypes = [] } = useQuery({
    queryKey: ['plating-types'],
    queryFn: () => InventoryModel.getAllPlatingTypes(),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => InventoryModel.getAllSuppliers(),
  });

  // Calcular valores em tempo real
  const calculatedValues = useMemo(() => {
    const rawCost = form.watch('raw_cost') || 0;
    const packagingCost = form.watch('packaging_cost') || 0;
    const materialWeight = form.watch('material_weight') || 0;
    const markup = form.watch('markup_percentage') || 30;
    const price = form.watch('price') || 0;
    
    const selectedPlatingType = platingTypes.find(pt => pt.id === form.watch('plating_type_id'));
    const platingCost = selectedPlatingType ? materialWeight * selectedPlatingType.gram_value : 0;
    
    const totalCost = rawCost + platingCost + packagingCost;
    const suggestedPrice = totalCost * (1 + markup / 100);
    const profit = price - totalCost;

    return {
      totalCost,
      suggestedPrice,
      profit,
    };
  }, [
    form.watch('raw_cost'),
    form.watch('packaging_cost'),
    form.watch('material_weight'),
    form.watch('markup_percentage'),
    form.watch('price'),
    form.watch('plating_type_id'),
    platingTypes
  ]);

  const handleSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);

      if (photos.length > 5) {
        toast.error("Máximo de 5 fotos permitido");
        return;
      }

      const itemData = {
        name: values.name,
        category_id: values.category_id,
        plating_type_id: values.plating_type_id,
        supplier_id: values.supplier_id,
        material_weight: values.material_weight,
        packaging_cost: values.packaging_cost,
        unit_cost: calculatedValues.totalCost,
        price: values.price,
        quantity: values.quantity,
        min_stock: values.min_stock,
        markup_percentage: values.markup_percentage,
        suggested_price: calculatedValues.suggestedPrice,
      };

      if (item) {
        await InventoryModel.updateItem(item.id, itemData);
        if (photos.length > 0) {
          await InventoryModel.updateItemPhotos(item.id, photos, primaryPhotoIndex);
        }
        toast.success("Peça atualizada com sucesso!");
      } else {
        const createdItem = await InventoryModel.createItem(itemData);
        if (photos.length > 0) {
          await InventoryModel.updateItemPhotos(createdItem.id, photos, primaryPhotoIndex);
        }
        toast.success("Peça criada com sucesso!");
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar peça:', error);
      toast.error("Erro ao salvar peça. Verifique os dados e tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1000px] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {item ? "Editar Peça" : "Nova Peça"}
          </DialogTitle>
          <DialogDescription className="text-base">
            Preencha os dados da peça. Os campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-6 flex-1">
          <div className="md:w-[350px] space-y-6">
            <div className="space-y-2">
              <Label>Fotos da Peça</Label>
              <PhotoFields
                photos={photos}
                setPhotos={setPhotos}
                primaryPhotoIndex={primaryPhotoIndex}
                setPrimaryPhotoIndex={setPrimaryPhotoIndex}
              />
            </div>

            <PriceSummary
              totalCost={calculatedValues.totalCost}
              finalPrice={form.watch('price') || 0}
              finalProfit={calculatedValues.profit}
              suggestedPrice={calculatedValues.suggestedPrice}
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            <Form {...form}>
              <form id="jewelry-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium border-b pb-2">Informações Básicas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome da Peça *</Label>
                      <Input 
                        id="name"
                        placeholder="Ex: Anel Solitário"
                        {...form.register('name')}
                        className="h-12"
                      />
                      {form.formState.errors.name && (
                        <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="plating_type">Tipo de Banho *</Label>
                      <Select 
                        onValueChange={(value) => form.setValue('plating_type_id', value)}
                        value={form.watch('plating_type_id')}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Selecione o tipo de banho" />
                        </SelectTrigger>
                        <SelectContent>
                          {platingTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name} - R$ {type.gram_value.toFixed(2)}/g
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.plating_type_id && (
                        <p className="text-red-500 text-sm">{form.formState.errors.plating_type_id.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="supplier">Fornecedor</Label>
                      <Select
                        onValueChange={(value) => form.setValue('supplier_id', value)}
                        value={form.watch('supplier_id')}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Selecione o fornecedor" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium border-b pb-2">Custos e Pesos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="raw_cost">Preço do Bruto (R$) *</Label>
                      <Input
                        id="raw_cost"
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        className="h-12"
                        {...form.register('raw_cost', { valueAsNumber: true })}
                      />
                      {form.formState.errors.raw_cost && (
                        <p className="text-red-500 text-sm">{form.formState.errors.raw_cost.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="material_weight">Peso (g) *</Label>
                      <Input
                        id="material_weight"
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        className="h-12"
                        {...form.register('material_weight', { valueAsNumber: true })}
                      />
                      {form.formState.errors.material_weight && (
                        <p className="text-red-500 text-sm">{form.formState.errors.material_weight.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="packaging_cost">Custo da Embalagem (R$)</Label>
                      <Input
                        id="packaging_cost"
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        className="h-12"
                        {...form.register('packaging_cost', { valueAsNumber: true })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantidade em Estoque *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        placeholder="0"
                        className="h-12"
                        {...form.register('quantity', { valueAsNumber: true })}
                      />
                      {form.formState.errors.quantity && (
                        <p className="text-red-500 text-sm">{form.formState.errors.quantity.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="min_stock">Estoque Mínimo *</Label>
                      <Input
                        id="min_stock"
                        type="number"
                        placeholder="0"
                        className="h-12"
                        {...form.register('min_stock', { valueAsNumber: true })}
                      />
                      {form.formState.errors.min_stock && (
                        <p className="text-red-500 text-sm">{form.formState.errors.min_stock.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium border-b pb-2">Precificação</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="markup_percentage">Markup (%)</Label>
                      <Input
                        id="markup_percentage"
                        type="number"
                        step="0.1"
                        placeholder="30.0"
                        className="h-12"
                        {...form.register('markup_percentage', { valueAsNumber: true })}
                      />
                      {form.formState.errors.markup_percentage && (
                        <p className="text-red-500 text-sm">{form.formState.errors.markup_percentage.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price">Preço Final (R$)</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="h-12"
                        {...form.register('price', { valueAsNumber: true })}
                      />
                      <p className="text-sm text-muted-foreground">
                        Preço sugerido: R$ {calculatedValues.suggestedPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </Form>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="h-12 px-6 text-base">
            Cancelar
          </Button>
          <Button 
            type="submit"
            form="jewelry-form"
            className="bg-[#F97316] hover:bg-[#F97316]/90 h-12 px-8 text-base font-semibold"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
