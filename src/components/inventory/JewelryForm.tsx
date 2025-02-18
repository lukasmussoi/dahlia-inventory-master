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
      <DialogContent className="w-[92vw] md:w-[85vw] h-[92vh] p-0 md:p-0 overflow-hidden bg-background">
        <div className="px-4 py-3 md:px-6 md:py-4 border-b bg-white/50 backdrop-blur-sm sticky top-0 z-10">
          <DialogTitle className="text-xl md:text-2xl font-semibold text-gray-900">
            {item ? "Editar Peça" : "Nova Peça"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Preencha os dados da peça. Os campos marcados com * são obrigatórios.
          </DialogDescription>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-[1.6fr_1fr] h-[calc(100%-8rem)] overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 border-r">
            <Form {...form}>
              <form id="jewelry-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="bg-white rounded-lg p-4 md:p-5 shadow-sm border">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
                    <span className="size-6 flex items-center justify-center rounded-full bg-orange-100 text-orange-600 text-sm font-medium">1</span>
                    Informações Básicas
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-gray-700">Nome da Peça *</Label>
                      <Input 
                        {...form.register('name')}
                        placeholder="Ex: Anel Solitário"
                        className="h-11"
                      />
                      {form.formState.errors.name && (
                        <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-gray-700">Categoria *</Label>
                      <Select 
                        onValueChange={(value) => form.setValue('category_id', value)}
                        value={form.watch('category_id')}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Selecione a categoria" />
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

                <div className="bg-white rounded-lg p-4 md:p-5 shadow-sm border">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
                    <span className="size-6 flex items-center justify-center rounded-full bg-orange-100 text-orange-600 text-sm font-medium">2</span>
                    Custos e Pesos
                  </h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="raw_cost" className="text-gray-700">Custo do Bruto (R$) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        className="h-11"
                        {...form.register('raw_cost', { valueAsNumber: true })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="material_weight" className="text-gray-700">Peso (g) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        className="h-11"
                        {...form.register('material_weight', { valueAsNumber: true })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="packaging_cost" className="text-gray-700">Custo da Embalagem (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        className="h-11"
                        {...form.register('packaging_cost', { valueAsNumber: true })}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 md:p-5 shadow-sm border">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
                    <span className="size-6 flex items-center justify-center rounded-full bg-orange-100 text-orange-600 text-sm font-medium">3</span>
                    Estoque
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity" className="text-gray-700">Quantidade *</Label>
                      <Input
                        type="number"
                        className="h-11"
                        {...form.register('quantity', { valueAsNumber: true })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="min_stock" className="text-gray-700">Estoque Mínimo *</Label>
                      <Input
                        type="number"
                        className="h-11"
                        {...form.register('min_stock', { valueAsNumber: true })}
                      />
                    </div>
                  </div>
                </div>
              </form>
            </Form>
          </div>

          <div className="lg:h-full overflow-y-auto px-4 py-4 md:px-6 md:py-6 bg-gray-50/50">
            <div className="space-y-6">
              <div className="bg-[#1A1F2C] rounded-xl p-5 shadow-lg">
                <h3 className="text-lg font-semibold text-white mb-4">Resumo do Produto</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-white/10 p-3 rounded-lg">
                    <span className="text-sm font-medium text-gray-300">Custo Total</span>
                    <span className="text-lg font-bold text-white">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculatedValues.totalCost)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between bg-white/10 p-3 rounded-lg">
                    <span className="text-sm font-medium text-gray-300">Preço Final</span>
                    <span className="text-lg font-bold text-white">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(form.watch('price') || 0)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between bg-white/10 p-3 rounded-lg">
                    <span className="text-sm font-medium text-gray-300">Lucro Final</span>
                    <span className={`text-lg font-bold ${calculatedValues.profit >= 0 ? 'text-[#F97316]' : 'text-red-500'}`}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculatedValues.profit)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Fotos da Peça</h3>
                <PhotoFields
                  photos={photos}
                  setPhotos={setPhotos}
                  primaryPhotoIndex={primaryPhotoIndex}
                  setPrimaryPhotoIndex={setPrimaryPhotoIndex}
                />
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Precificação</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="markup_percentage" className="text-gray-700">Markup (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      className="h-11"
                      {...form.register('markup_percentage', { valueAsNumber: true })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-gray-700">Preço Final (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      className="h-11"
                      {...form.register('price', { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t bg-white/50 backdrop-blur-sm sticky bottom-0 right-0 left-0 p-4 md:p-6 flex justify-end gap-3 items-center">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="h-11 px-6 min-w-[120px] font-medium"
          >
            Cancelar
          </Button>
          <Button 
            type="submit"
            form="jewelry-form"
            disabled={isSubmitting}
            className="h-11 px-6 min-w-[120px] font-medium bg-[#F97316] hover:bg-[#F97316]/90"
          >
            {isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
