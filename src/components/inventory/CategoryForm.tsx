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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { InventoryCategory, InventoryModel } from "@/models/inventory";

// Schema de validação do formulário
const formSchema = z.object({
  name: z.string().min(1, "Nome da categoria é obrigatório"),
});

type FormValues = z.infer<typeof formSchema>;

interface CategoryFormProps {
  category?: InventoryCategory | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CategoryForm({ category, isOpen, onClose, onSuccess }: CategoryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: category?.name || "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      if (category) {
        // Como a função updateCategory agora aceita um objeto, passamos o objeto completo
        await InventoryModel.updateCategory(category.id, { name: values.name });
        toast.success("Categoria atualizada com sucesso!");
      } else {
        // Como a função createCategory agora aceita um objeto, passamos o objeto completo
        await InventoryModel.createCategory({ name: values.name });
        toast.success("Categoria criada com sucesso!");
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      toast.error("Erro ao salvar categoria. Verifique se já não existe uma categoria com este nome.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {category ? "Editar Categoria" : "Nova Categoria"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Categoria</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
