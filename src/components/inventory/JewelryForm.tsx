
import { useState } from "react";
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
import { toast } from "sonner";

interface JewelryFormProps {
  item?: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormValues {
  name: string;
  plating_type_id: string;
  supplier_id: string;
  material_weight: number;
  packaging_cost: number;
  gram_value: number;
  profit_margin: number;
  quantity: number;
}

export function JewelryForm({ item, isOpen, onClose, onSuccess }: JewelryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<FormValues>({
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

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // Lógica de salvamento será implementada na próxima etapa
      toast.success('Peça cadastrada com sucesso!');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar peça:', error);
      toast.error('Erro ao cadastrar peça');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
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
