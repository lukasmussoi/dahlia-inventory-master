
import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SuitcaseController } from "@/controllers/suitcaseController";
import { SuitcaseModel } from "@/models/suitcaseModel";
import { Briefcase, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Schema para validação do formulário
const suitcaseFormSchema = z.object({
  code: z.string().min(1, "Código da maleta é obrigatório"),
  seller_id: z.string().min(1, "Selecione uma revendedora"),
  status: z.enum(["in_use", "returned", "in_replenishment"]),
  city: z.string().min(1, "Cidade é obrigatória"),
  neighborhood: z.string().min(1, "Bairro é obrigatório"),
});

type SuitcaseFormValues = z.infer<typeof suitcaseFormSchema>;

interface SuitcaseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: SuitcaseFormValues) => void;
  initialData?: any;
  mode?: "create" | "edit";
}

export function SuitcaseFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode = "create",
}: SuitcaseFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [resellers, setResellers] = useState<{ value: string; label: string }[]>([]);

  // Inicializar formulário com React Hook Form e Zod
  const form = useForm<SuitcaseFormValues>({
    resolver: zodResolver(suitcaseFormSchema),
    defaultValues: {
      code: "",
      seller_id: "",
      status: "in_use",
      city: "",
      neighborhood: "",
    },
  });

  // Buscar revendedoras e gerar código da maleta
  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      try {
        // Buscar revendedoras
        const resellersData = await SuitcaseController.getResellersForSelect();
        setResellers(resellersData);

        // Se estiver criando uma nova maleta
        if (mode === "create" && !initialData) {
          // Gerar código único para a maleta
          const code = await SuitcaseModel.generateSuitcaseCode();
          form.setValue("code", code);
        }
        // Se estiver editando uma maleta existente
        else if (initialData) {
          form.reset({
            code: initialData.code || "",
            seller_id: initialData.seller_id || "",
            status: initialData.status || "in_use",
            city: initialData.city || "",
            neighborhood: initialData.neighborhood || "",
          });
        }
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
      } finally {
        setLoading(false);
      }
    }

    if (open) {
      loadInitialData();
    }
  }, [open, form, initialData, mode]);

  const handleSubmit = async (values: SuitcaseFormValues) => {
    try {
      onSubmit(values);
    } catch (error) {
      console.error("Erro ao submeter formulário:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" /> 
            {mode === "create" ? "Criar Nova Maleta" : "Editar Maleta"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" 
              ? "Preencha os dados abaixo para criar uma nova maleta para uma revendedora."
              : "Edite os dados da maleta conforme necessário."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
            <span className="ml-2">Carregando...</span>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="ML001" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="seller_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Revendedora</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma revendedora" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {resellers.map((reseller) => (
                          <SelectItem key={reseller.value} value={reseller.value}>
                            {reseller.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Cidade" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="neighborhood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Bairro" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="in_use">Em Uso</SelectItem>
                        <SelectItem value="returned">Devolvida</SelectItem>
                        <SelectItem value="in_replenishment">Aguardando Reposição</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" className="w-full">
                  {mode === "create" ? "Criar Maleta" : "Salvar Alterações"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
