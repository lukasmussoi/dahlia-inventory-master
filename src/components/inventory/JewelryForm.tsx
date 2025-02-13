import { useState, useEffect } from "react";
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
  total_cost: z.number().optional(),
  total_cost_with_packaging: z.number().optional(),
  quantity: z.number().int().min(0, "Quantidade não pode ser negativa"),
  min_stock: z.number().int().min(0, "Estoque mínimo não pode ser negativa"),
  markup_percentage: z.number().optional(),
  price: z.number().optional(),
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [primaryPhotoIndex, setPrimaryPhotoIndex] = useState<number | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: item?.name || '',
      plating_type_id: item?.plating_type_id || '',
      supplier_id: item?.supplier_id || '',
      raw_cost: item?.unit_cost || 0,
      material_weight: item?.material_weight || 0,
      packaging_cost: item?.packaging_cost || 0,
      quantity: item?.quantity || 0,
      min_stock: item?.min_stock || 0,
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

  const { totalCost, suggestedPrice, profit } = form.watch((data) => {
    const total = (data.unit_cost || 0) + (data.packaging_cost || 0);
    const markup = (data.markup_percentage || 30) / 100;
    const suggested = total * (1 + markup);
    const finalProfit = (data.price || 0) - total;
    return {
      totalCost: total,
      suggestedPrice: suggested,
      profit: finalProfit,
    };
  });

  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (type !== "change") return;
      
      const formValues = form.getValues();
      const updates: Partial<FormValues> = {};
      
      const selectedPlatingType = platingTypes.find(
        pt => pt.id === formValues.plating_type_id
      );
      
      if (selectedPlatingType && formValues.material_weight && formValues.raw_cost) {
        const totalCost = (formValues.material_weight * selectedPlatingType.gram_value) + formValues.raw_cost;
        updates.total_cost = totalCost;

        const totalCostWithPackaging = totalCost + (formValues.packaging_cost || 0);
        updates.total_cost_with_packaging = totalCostWithPackaging;

        Object.entries(updates).forEach(([field, value]) => {
          form.setValue(field as keyof FormValues, value, {
            shouldValidate: false,
            shouldDirty: true,
            shouldTouch: false,
          });
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [form, platingTypes]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const itemData = {
        name: data.name,
        plating_type_id: data.plating_type_id,
        supplier_id: data.supplier_id,
        material_weight: data.material_weight,
        packaging_cost: data.packaging_cost,
        unit_cost: data.total_cost_with_packaging || 0,
        price: data.total_cost_with_packaging || 0,
        quantity: data.quantity,
        min_stock: data.min_stock,
        category_id: item?.category_id || '00000000-0000-0000-0000-000000000000',
        suggested_price: data.total_cost_with_packaging || 0,
      };

      if (item) {
        await InventoryModel.updateItem(item.id, itemData);
        if (selectedFile) {
          await InventoryModel.updateItemPhotos(item.id, [selectedFile], 0);
        }
        toast.success('Peça atualizada com sucesso!');
      } else {
        const newItem = await InventoryModel.createItem(itemData);
        if (selectedFile) {
          await InventoryModel.updateItemPhotos(newItem.id, [selectedFile], 0);
        }
        toast.success('Peça cadastrada com sucesso!');
      }
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar peça:', error);
      toast.error('Erro ao salvar peça');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('O arquivo deve ter no máximo 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('O arquivo deve ser uma imagem');
        return;
      }
      
      setSelectedFile(file);
      toast.success('Foto selecionada com sucesso!');
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
              totalCost={totalCost}
              finalPrice={form.watch('price') || 0}
              finalProfit={profit}
              suggestedPrice={suggestedPrice}
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            <Form {...form}>
              <form id="jewelry-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                          <div className="p-2">
                            <Input
                              placeholder="Buscar fornecedor..."
                              className="mb-2"
                              onChange={(e) => {
                                const filtered = suppliers.filter(s => 
                                  s.name.toLowerCase().includes(e.target.value.toLowerCase())
                                );
                                // Atualizar lista de fornecedores filtrados
                              }}
                            />
                          </div>
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="total_cost">Custo Total (R$)</Label>
                      <Input
                        id="total_cost"
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        readOnly
                        className="h-12 bg-gray-50"
                        value={form.watch('total_cost') || 0}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="total_cost_with_packaging">Custo Total com Embalagem (R$)</Label>
                      <Input
                        id="total_cost_with_packaging"
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        readOnly
                        className="h-12 bg-gray-50"
                        value={form.watch('total_cost_with_packaging') || 0}
                      />
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
                        Preço sugerido: R$ {suggestedPrice.toFixed(2)}
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
