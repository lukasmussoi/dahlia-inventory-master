
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PlatingType, InventoryModel } from "@/models/inventoryModel";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  gram_value: z.number().min(0.01, "Valor por grama deve ser maior que 0"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PlatingTypeFormProps {
  platingType?: PlatingType | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PlatingTypeForm({ platingType, isOpen, onClose, onSuccess }: PlatingTypeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: platingType?.name || '',
      gram_value: platingType?.gram_value || 0,
      description: platingType?.description || '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      await InventoryModel.createPlatingType(data);
      toast.success('Tipo de banho salvo com sucesso!');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar tipo de banho:', error);
      toast.error('Erro ao salvar tipo de banho');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {platingType ? "Editar Tipo de Banho" : "Novo Tipo de Banho"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                placeholder="Ex: Ouro 18k"
                {...form.register('name')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gram_value">Valor por Grama (R$) *</Label>
              <Input
                id="gram_value"
                type="number"
                step="0.01"
                placeholder="0,00"
                {...form.register('gram_value', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                placeholder="Descrição do tipo de banho"
                {...form.register('description')}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                type="submit"
                className="bg-gold hover:bg-gold/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
