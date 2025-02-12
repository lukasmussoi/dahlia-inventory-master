
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

// Schema de validação do formulário
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

  // Inicializar formulário com validação
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
    },
  });

  // Buscar tipos de banho
  const { data: platingTypes = [] } = useQuery({
    queryKey: ['plating-types'],
    queryFn: () => InventoryModel.getAllPlatingTypes(),
  });

  // Buscar fornecedores
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => InventoryModel.getAllSuppliers(),
  });

  // Calcular valores automaticamente quando os campos dependentes mudarem
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      // Só recalcular se a mudança vier de uma interação do usuário
      if (type !== "change") return;
      
      const formValues = form.getValues();
      const updates: Partial<FormValues> = {};
      
      // Buscar o valor da grama do tipo de banho selecionado
      const selectedPlatingType = platingTypes.find(
        pt => pt.id === formValues.plating_type_id
      );
      
      if (selectedPlatingType && formValues.material_weight && formValues.raw_cost) {
        // Custo total = (gramas * valor da grama do banho) + preço do bruto
        const totalCost = (formValues.material_weight * selectedPlatingType.gram_value) + formValues.raw_cost;
        updates.total_cost = totalCost;

        // Custo total com embalagem
        const totalCostWithPackaging = totalCost + (formValues.packaging_cost || 0);
        updates.total_cost_with_packaging = totalCostWithPackaging;

        // Atualizar todos os valores de uma vez
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
        price: data.total_cost_with_packaging || 0, // Preço inicial igual ao custo
        quantity: data.quantity,
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
      <DialogContent className="sm:max-w-[600px] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {item ? "Editar Peça" : "Nova Peça"}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados da peça. Os campos com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>
        
        <PriceSummary
          totalCost={form.watch('total_cost') || 0}
          finalPrice={form.watch('total_cost_with_packaging') || 0}
          finalProfit={0}
        />
        
        <div className="flex-1 overflow-y-auto px-1 pb-4">
          <Form {...form}>
            <form id="jewelry-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Seção 1: Informações Básicas */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Informações Básicas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Peça *</Label>
                    <Input 
                      id="name"
                      placeholder="Ex: Anel Solitário"
                      {...form.register('name')}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="plating_type">Tipo de Banho *</Label>
                    <Select 
                      onValueChange={(value) => form.setValue('plating_type_id', value)}
                      value={form.watch('plating_type_id')}
                    >
                      <SelectTrigger>
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supplier">Fornecedor</Label>
                    <Select
                      onValueChange={(value) => form.setValue('supplier_id', value)}
                      value={form.watch('supplier_id')}
                    >
                      <SelectTrigger>
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

                  <div className="space-y-2">
                    <Label htmlFor="photo">Foto da Peça</Label>
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 2: Custos */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Custos e Pesos</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="raw_cost">Preço do Bruto (R$) *</Label>
                    <Input
                      id="raw_cost"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      {...form.register('raw_cost', { valueAsNumber: true })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="material_weight">Peso (g) *</Label>
                    <Input
                      id="material_weight"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      {...form.register('material_weight', { valueAsNumber: true })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="packaging_cost">Custo da Embalagem (R$)</Label>
                    <Input
                      id="packaging_cost"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      {...form.register('packaging_cost', { valueAsNumber: true })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="total_cost">Custo Total (R$)</Label>
                    <Input
                      id="total_cost"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      readOnly
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
                      value={form.watch('total_cost_with_packaging') || 0}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantidade em Estoque *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="0"
                      {...form.register('quantity', { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </div>
            </form>
          </Form>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            type="submit"
            form="jewelry-form"
            className="bg-gold hover:bg-gold/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
