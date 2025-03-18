
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ResellerController } from "@/controllers/resellerController";
import { PromoterController } from "@/controllers/promoterController";
import { Promoter } from "@/types/promoter";
import { Reseller, ResellerInput } from "@/types/reseller";
import { formatPhone, formatCPFOrCNPJ, formatZipCode } from "@/utils/formatUtils";
import { isValidCPFOrCNPJ, isValidPhone, isValidEmail, isValidZipCode } from "@/utils/validationUtils";

// Esquema de validação com zod
const formSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  cpfCnpj: z.string().refine(isValidCPFOrCNPJ, "CPF/CNPJ inválido"),
  phone: z.string().refine(isValidPhone, "Telefone inválido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  status: z.enum(["Ativa", "Inativa"]),
  promoterId: z.string().uuid("Selecione uma promotora"),
  commissionRate: z.union([
    z.number().min(0, "A comissão não pode ser negativa").max(1, "A comissão deve ser um valor entre 0 e 1 (ex: 0.3 para 30%)"),
    z.string().transform((val, ctx) => {
      const parsed = parseFloat(val.replace(',', '.'));
      if (isNaN(parsed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Comissão inválida",
        });
        return z.NEVER;
      }
      return parsed;
    })
  ]).optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
});

interface ResellerFormProps {
  resellerId?: string;
  onSuccess?: () => void;
  isDialog?: boolean;
}

export function ResellerForm({ resellerId, onSuccess, isDialog = false }: ResellerFormProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [reseller, setReseller] = useState<Reseller | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      cpfCnpj: "",
      phone: "",
      email: "",
      status: "Ativa",
      promoterId: "",
      commissionRate: 0.3,
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
    },
  });

  // Buscar promotoras
  useEffect(() => {
    const loadPromoters = async () => {
      try {
        const data = await PromoterController.getAllPromoters();
        setPromoters(data);
      } catch (error) {
        console.error("Erro ao carregar promotoras:", error);
        toast.error("Erro ao carregar promotoras");
      }
    };

    loadPromoters();
  }, []);

  // Buscar dados da revendedora para edição
  useEffect(() => {
    if (resellerId) {
      const loadReseller = async () => {
        try {
          setIsLoading(true);
          const data = await ResellerController.getResellerById(resellerId);
          setReseller(data);
          
          // Preencher formulário com dados da revendedora
          form.reset({
            name: data.name,
            cpfCnpj: data.cpfCnpj,
            phone: data.phone,
            email: data.email || "",
            status: data.status,
            promoterId: data.promoterId,
            commissionRate: data.commissionRate || 0.3,
            street: data.address?.street || "",
            number: data.address?.number || "",
            complement: data.address?.complement || "",
            neighborhood: data.address?.neighborhood || "",
            city: data.address?.city || "",
            state: data.address?.state || "",
            zipCode: data.address?.zipCode || "",
          });
        } catch (error) {
          console.error("Erro ao carregar revendedora:", error);
          toast.error("Erro ao carregar dados da revendedora");
        } finally {
          setIsLoading(false);
        }
      };

      loadReseller();
    }
  }, [resellerId, form]);

  // Funções de formatação
  const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedValue = formatCPFOrCNPJ(value);
    form.setValue("cpfCnpj", formattedValue);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedValue = formatPhone(value);
    form.setValue("phone", formattedValue);
  };

  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedValue = formatZipCode(value);
    form.setValue("zipCode", formattedValue);
  };

  // Lidar com a formatação de porcentagem
  const handleCommissionRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(',', '.');
    if (value === '' || !isNaN(parseFloat(value))) {
      // Aqui passamos o valor como string, a transformação para número é feita pelo schema
      form.setValue("commissionRate", value as any);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);

      // Preparar dados do endereço
      const address = {
        street: values.street || "",
        number: values.number || "",
        complement: values.complement,
        neighborhood: values.neighborhood || "",
        city: values.city || "",
        state: values.state || "",
        zipCode: values.zipCode || "",
      };

      // Preparar dados da revendedora
      const resellerData: ResellerInput = {
        name: values.name,
        cpfCnpj: values.cpfCnpj,
        phone: values.phone,
        email: values.email,
        status: values.status,
        promoterId: values.promoterId,
        address,
        commissionRate: typeof values.commissionRate === 'string' 
          ? parseFloat(values.commissionRate) 
          : values.commissionRate,
      };

      if (resellerId) {
        // Atualizar revendedora existente
        await ResellerController.updateReseller(resellerId, resellerData);
        toast.success("Revendedora atualizada com sucesso!");
      } else {
        // Criar nova revendedora
        await ResellerController.createReseller(resellerData);
        toast.success("Revendedora cadastrada com sucesso!");
      }

      // Callback de sucesso ou redirecionar
      if (onSuccess) {
        onSuccess();
      } else if (!isDialog) {
        navigate("/dashboard/sales/resellers");
      }
    } catch (error: any) {
      console.error("Erro ao salvar revendedora:", error);
      toast.error(error.message || "Erro ao salvar revendedora");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{resellerId ? "Editar Revendedora" : "Nova Revendedora"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" id="resellerForm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome*</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome da revendedora" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cpfCnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF/CNPJ*</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="CPF ou CNPJ" 
                        onChange={handleCpfCnpjChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone*</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="(00) 00000-0000"
                        onChange={handlePhoneChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="email@exemplo.com" type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="commissionRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comissão</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="0.3" 
                        type="text"
                        onChange={handleCommissionRateChange}
                      />
                    </FormControl>
                    <FormMessage />
                    <div className="text-xs text-muted-foreground">
                      Exemplo: 0.3 para 30% de comissão
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status*</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um status" />
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

              <FormField
                control={form.control}
                name="promoterId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Promotora Responsável*</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma promotora" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {promoters.map(promoter => (
                          <SelectItem key={promoter.id} value={promoter.id}>
                            {promoter.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />
            <h3 className="text-lg font-medium">Endereço</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="00000-000"
                        onChange={handleZipCodeChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Logradouro</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Rua, Avenida, etc." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Número" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="complement"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Complemento</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Apartamento, sala, etc." />
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
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Estado" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (isDialog && onSuccess) {
                    onSuccess();
                  } else {
                    navigate("/dashboard/sales/resellers");
                  }
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} form="resellerForm">
                {isLoading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
