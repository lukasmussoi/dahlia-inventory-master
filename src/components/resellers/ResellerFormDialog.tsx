
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { ResellerModel } from "@/models/resellerModel";

// Esquema de validação
const resellerSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  cpf_cnpj: z.string().min(11, "CPF/CNPJ deve ter pelo menos 11 caracteres"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  status: z.enum(["Ativa", "Inativa"]),
  promoter_id: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    number: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
  }).optional(),
});

type ResellerFormValues = z.infer<typeof resellerSchema>;

interface ResellerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reseller?: any;
  onSubmit: (data: ResellerFormValues) => void;
}

export function ResellerFormDialog({
  open,
  onOpenChange,
  reseller,
  onSubmit,
}: ResellerFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializar o formulário com os valores do revendedor se estiver editando
  const form = useForm<ResellerFormValues>({
    resolver: zodResolver(resellerSchema),
    defaultValues: {
      name: reseller?.name || "",
      cpf_cnpj: reseller?.cpf_cnpj || "",
      phone: reseller?.phone || "",
      email: reseller?.email || "",
      status: reseller?.status || "Ativa",
      promoter_id: reseller?.promoter_id || undefined,
      address: reseller?.address || {},
    },
  });

  // Buscar promotores para o select
  const { data: promoters = [], isLoading: isLoadingPromoters } = useQuery({
    queryKey: ['promoters'],
    queryFn: async () => {
      try {
        // Simulando a busca de promotores, já que não temos acesso ao PromoterModel
        return [
          { id: "1", name: "Promotor 1" },
          { id: "2", name: "Promotor 2" },
          { id: "3", name: "Promotor 3" },
        ];
      } catch (error) {
        console.error("Erro ao buscar promotores:", error);
        return [];
      }
    },
    enabled: open,
  });

  // Função de submissão do formulário
  const handleSubmit = async (data: ResellerFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Erro ao submeter formulário:", error);
      toast.error("Erro ao salvar revendedora");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {reseller ? "Editar Revendedora" : "Nova Revendedora"}
          </DialogTitle>
          <DialogDescription>
            {reseller
              ? "Edite os dados da revendedora selecionada"
              : "Preencha os dados para cadastrar uma nova revendedora"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 py-2"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* CPF/CNPJ */}
              <FormField
                control={form.control}
                name="cpf_cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF/CNPJ</FormLabel>
                    <FormControl>
                      <Input placeholder="CPF ou CNPJ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Telefone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 00000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="email@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Ativa">Ativa</SelectItem>
                        <SelectItem value="Inativa">Inativa</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Promotor */}
              <FormField
                control={form.control}
                name="promoter_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Promotor</FormLabel>
                    {isLoadingPromoters ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">
                          Carregando...
                        </span>
                      </div>
                    ) : (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um promotor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {promoters.map((promoter) => (
                            <SelectItem key={promoter.id} value={promoter.id}>
                              {promoter.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Endereço */}
            <div>
              <h3 className="text-md font-medium mb-2">Endereço</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Rua */}
                <FormField
                  control={form.control}
                  name="address.street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rua</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da rua" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Número */}
                <FormField
                  control={form.control}
                  name="address.number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl>
                        <Input placeholder="Número" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Bairro */}
                <FormField
                  control={form.control}
                  name="address.neighborhood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro</FormLabel>
                      <FormControl>
                        <Input placeholder="Bairro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Cidade */}
                <FormField
                  control={form.control}
                  name="address.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Cidade" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Estado */}
                <FormField
                  control={form.control}
                  name="address.state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <FormControl>
                        <Input placeholder="Estado" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* CEP */}
                <FormField
                  control={form.control}
                  name="address.zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <Input placeholder="00000-000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {reseller ? "Salvar Alterações" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
