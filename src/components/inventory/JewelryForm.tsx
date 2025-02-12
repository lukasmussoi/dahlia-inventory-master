
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
  material_weight: z.number().min(0.01, "Peso deve ser maior que 0"),
  packaging_cost: z.number().min(0, "Custo não pode ser negativo"),
  gram_value: z.number().min(0.01, "Valor da grama deve ser maior que 0"),
  profit_margin: z.number().min(0, "Margem não pode ser negativa"),
  quantity: z.number().int().min(0, "Quantidade não pode ser negativa"),
  raw_cost: z.number().optional(),
  total_cost: z.number().optional(),
  final_price: z.number().optional(),
  reseller_commission: z.number().optional(),
  final_profit: z.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface JewelryFormProps {
  item?: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Formulário de cadastro e edição de peças de joalheria
 * com cálculos automáticos e validações
 */
export function JewelryForm({ item, isOpen, onClose, onSuccess }: JewelryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [suggestedPrice, setSuggestedPrice] = useState<number | undefined>(undefined);

  // Inicializar formulário com validação
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: item?.name || '',
      plating_type_id: item?.plating_type_id || '',
      supplier_id: item?.supplier_id || '',
      material_weight: item?.material_weight || 0,
      packaging_cost: item?.packaging_cost || 0,
      gram_value: item?.gram_value || 0,
      profit_margin: item?.profit_margin || 0.3,
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
    const subscription = form.watch((value, { name }) => {
      const formValues = form.getValues();
      
      // Calcular apenas se os campos necessários estiverem preenchidos
      if (formValues.material_weight && formValues.gram_value) {
        // Preço do Bruto
        const rawCost = formValues.material_weight * formValues.gram_value;
        if (!name || name !== 'raw_cost') {
          form.setValue('raw_cost', rawCost);
        }

        // Custo Total
        const totalCost = rawCost + (formValues.packaging_cost || 0);
        if (!name || name !== 'total_cost') {
          form.setValue('total_cost', totalCost);
        }

        // Preço Final
        const finalPrice = totalCost * (1 + (formValues.profit_margin || 0.3));
        if (!name || name !== 'final_price') {
          form.setValue('final_price', finalPrice);
        }

        // Comissão da Revendedora (30% do Preço Final)
        const commission = finalPrice * 0.3;
        if (!name || name !== 'reseller_commission') {
          form.setValue('reseller_commission', commission);
        }

        // Lucro Final
        const finalProfit = finalPrice - commission - totalCost;
        if (!name || name !== 'final_profit') {
          form.setValue('final_profit', finalProfit);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  /**
   * Recalcula todos os valores do formulário
   * Útil quando o usuário quer reverter alterações manuais
   */
  const recalculateValues = () => {
    const formValues = form.getValues();
    const rawCost = formValues.material_weight * formValues.gram_value;
    const totalCost = rawCost + (formValues.packaging_cost || 0);
    const finalPrice = totalCost * (1 + (formValues.profit_margin || 0.3));
    const commission = finalPrice * 0.3;
    const finalProfit = finalPrice - commission - totalCost;

    form.setValue('raw_cost', rawCost);
    form.setValue('total_cost', totalCost);
    form.setValue('final_price', finalPrice);
    form.setValue('reseller_commission', commission);
    form.setValue('final_profit', finalProfit);

    toast.success('Valores recalculados com sucesso!');
  };

  /**
   * Salva a peça no banco de dados
   * Inclui validações e upload de foto
   */
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // Garantir que todos os campos obrigatórios estão presentes
      const itemData = {
        name: data.name,
        category_id: item?.category_id || '00000000-0000-0000-0000-000000000000', // Categoria padrão
        quantity: data.quantity,
        price: data.final_price || 0,
        unit_cost: data.total_cost || 0,
        suggested_price: data.final_price || 0,
        min_stock: 1,
        // Campos opcionais
        plating_type_id: data.plating_type_id,
        supplier_id: data.supplier_id,
        material_weight: data.material_weight,
        packaging_cost: data.packaging_cost,
        gram_value: data.gram_value,
        profit_margin: data.profit_margin,
        reseller_commission: 0.3,
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
      // Validar tamanho do arquivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('O arquivo deve ter no máximo 5MB');
        return;
      }
      
      // Validar tipo do arquivo
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
        
        {/* Resumo Visual */}
        <PriceSummary
          totalCost={form.watch('total_cost') || 0}
          finalPrice={form.watch('final_price') || 0}
          finalProfit={form.watch('final_profit') || 0}
          suggestedPrice={suggestedPrice}
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
                            {type.name}
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

              {/* Seção 2: Cálculo de Custos */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Cálculo de Custos</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gram_value">Valor da Grama (R$) *</Label>
                    <Input
                      id="gram_value"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      {...form.register('gram_value')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="material_weight">Peso (g) *</Label>
                    <Input
                      id="material_weight"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      {...form.register('material_weight')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="raw_cost">Preço do Bruto (R$)</Label>
                    <Input
                      id="raw_cost"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      {...form.register('raw_cost')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="packaging_cost">Custo da Embalagem (R$)</Label>
                    <Input
                      id="packaging_cost"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      {...form.register('packaging_cost')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="total_cost">Custo Total (R$)</Label>
                    <Input
                      id="total_cost"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      {...form.register('total_cost')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantidade em Estoque *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="0"
                      {...form.register('quantity')}
                    />
                  </div>
                </div>
              </div>

              {/* Seção 3: Precificação */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Precificação</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="profit_margin">Margem de Lucro (%)</Label>
                    <Input
                      id="profit_margin"
                      type="number"
                      step="0.01"
                      placeholder="30"
                      {...form.register('profit_margin')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="final_price">Preço Final (R$)</Label>
                    <Input
                      id="final_price"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      {...form.register('final_price')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reseller_commission">Comissão da Revendedora (R$)</Label>
                    <Input
                      id="reseller_commission"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      {...form.register('reseller_commission')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="final_profit">Lucro Final (R$)</Label>
                    <Input
                      id="final_profit"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      {...form.register('final_profit')}
                    />
                  </div>
                </div>
              </div>
            </form>
          </Form>
        </div>

        <div className="flex justify-between gap-2 pt-4 border-t">
          <Button 
            type="button"
            variant="secondary"
            onClick={recalculateValues}
          >
            Recalcular Valores
          </Button>
          <div className="flex gap-2">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
