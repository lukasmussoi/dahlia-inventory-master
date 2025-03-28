
/**
 * Diálogo de Formulário de Maletas
 * @file Este componente permite criar ou editar uma maleta
 * @relacionamento Utiliza modelos e componentes UI para gerenciar maletas
 */
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SuitcaseModel } from "@/models/suitcase";
import { toast } from "sonner";
import { format } from 'date-fns';
import { DatePicker } from "@/components/ui/date-picker";
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Definição do schema Zod para validação do formulário
const formSchema = z.object({
  code: z.string().min(2, {
    message: "O código da maleta deve ter pelo menos 2 caracteres.",
  }),
  promoter_id: z.string().min(1, {
    message: "Selecione uma promotora.",
  }),
  reseller_id: z.string().min(1, {
    message: "Selecione uma revendedora.",
  }),
  status: z.string().min(1, {
    message: "Selecione um status.",
  }),
  notes: z.string().optional(),
  created_at: z.date(),
  next_settlement_date: z.date()
});

interface SuitcaseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: z.infer<typeof formSchema>, suitcaseId?: string) => Promise<void>;
  promoterOptions: { value: string; label: string }[];
  suitcaseData?: any | null;
  isUpdate?: boolean;
}

export function SuitcaseFormDialog({
  open,
  onOpenChange,
  onSubmit,
  promoterOptions,
  suitcaseData,
  isUpdate = false
}: SuitcaseFormDialogProps) {
  // Estados locais para gerenciar as opções de revendedoras e o estado de carregamento
  const [resellerOptions, setResellerOptions] = useState<{ value: string; label: string }[]>([]);
  const [loadingResellers, setLoadingResellers] = useState(false);
  
  // Inicializar o formulário com react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: suitcaseData?.code || "",
      promoter_id: suitcaseData?.promoter_id || "",
      reseller_id: suitcaseData?.reseller_id || "",
      status: suitcaseData?.status || "in_preparation",
      notes: suitcaseData?.notes || "",
      created_at: suitcaseData?.created_at ? new Date(suitcaseData.created_at) : new Date(),
      next_settlement_date: suitcaseData?.next_settlement_date ? new Date(suitcaseData.next_settlement_date) : new Date()
    },
    mode: "onChange"
  });
  
  // Função para buscar as revendedoras associadas a uma promotora
  const fetchResellersByPromoter = async (promoterId: string) => {
    try {
      const response = await fetch(`/api/revendedoras?promoter_id=${promoterId}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar revendedoras');
      }
      
      const resellers = await response.json();
      return resellers.map((reseller: any) => ({
        value: reseller.id,
        label: reseller.name,
      }));
    } catch (error) {
      console.error("Erro ao buscar revendedoras:", error);
      toast.error("Erro ao buscar revendedoras");
      return [];
    }
  };

  // Atualizar a lista de revendedoras quando a promotora mudar
  useEffect(() => {
    const promoterId = form.getValues("promoter_id");
    
    if (promoterId) {
      setLoadingResellers(true);
      fetchResellersByPromoter(promoterId)
        .then(resellers => {
          setResellerOptions(resellers);
          setLoadingResellers(false);
        })
        .catch(error => {
          console.error("Erro ao buscar revendedoras:", error);
          setLoadingResellers(false);
        });
    } else {
      setResellerOptions([]);
    }
  }, [form.watch("promoter_id")]);

  // Manipulador de envio do formulário
  const onSubmitHandler = async (values: z.infer<typeof formSchema>) => {
    await onSubmit(values, suitcaseData?.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isUpdate ? "Editar Maleta" : "Nova Maleta"}</DialogTitle>
          <DialogDescription>
            Preencha os dados da maleta.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitHandler)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código da Maleta</FormLabel>
                  <FormControl>
                    <Input placeholder="Código" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="created_at"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Criação</FormLabel>
                  <DatePicker
                    locale={ptBR}
                    className={cn(
                      "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                      !field.value && "text-muted-foreground"
                    )}
                    onSelect={(date) => {
                      if (date instanceof Date) field.onChange(date);
                    }}
                    defaultMonth={field.value}
                    selected={field.value}
                    mode="single"
                  >
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(field.value, "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          <span>Escolher Data</span>
                        )}
                      </Button>
                    </FormControl>
                  </DatePicker>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="next_settlement_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data Próximo Acerto</FormLabel>
                  <DatePicker
                    locale={ptBR}
                    className={cn(
                      "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                      !field.value && "text-muted-foreground"
                    )}
                    onSelect={(date) => {
                      if (date instanceof Date) field.onChange(date);
                    }}
                    defaultMonth={field.value}
                    selected={field.value}
                    mode="single"
                  >
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(field.value, "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          <span>Escolher Data</span>
                        )}
                      </Button>
                    </FormControl>
                  </DatePicker>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="promoter_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Promotora</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma promotora" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {promoterOptions.map((promoter) => (
                        <SelectItem key={promoter.value} value={promoter.value}>
                          {promoter.label}
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
              name="reseller_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Revendedora</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={loadingResellers}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma revendedora" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {resellerOptions.map((reseller) => (
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="in_preparation">Em Preparação</SelectItem>
                      <SelectItem value="in_transit">Em Trânsito</SelectItem>
                      <SelectItem value="in_use">Em Uso</SelectItem>
                      <SelectItem value="in_replenishment">Em Reposição</SelectItem>
                      <SelectItem value="settled">Acertada</SelectItem>
                      <SelectItem value="inactive">Inativa</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Input placeholder="Observações" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Salvar</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
