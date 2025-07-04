
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { PromoterController } from "@/controllers/promoterController";
import { Promoter } from "@/types/promoter";
import { formatPhone, formatCPFOrCNPJ, formatZipCode } from "@/utils/formatUtils";
import { isValidCPFOrCNPJ, isValidPhone, isValidEmail, isValidZipCode } from "@/utils/validationUtils";

// Esquema de validação com zod
const formSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  cpfCnpj: z.string().refine(isValidCPFOrCNPJ, "CPF/CNPJ inválido"),
  phone: z.string().refine(isValidPhone, "Telefone inválido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  status: z.enum(["Ativa", "Inativa"]),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
});

interface PromoterFormProps {
  promoterId?: string;
  onSuccess?: () => void;
  isDialog?: boolean;
}

export function PromoterForm({ promoterId, onSuccess, isDialog = false }: PromoterFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [promoter, setPromoter] = useState<Promoter | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      cpfCnpj: "",
      phone: "",
      email: "",
      status: "Ativa",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
    },
  });

  // Buscar dados da promotora para edição
  useEffect(() => {
    if (promoterId) {
      const loadPromoter = async () => {
        try {
          setIsLoading(true);
          const data = await PromoterController.getPromoterById(promoterId);
          setPromoter(data);
          
          // Preencher formulário com dados da promotora
          form.reset({
            name: data.name,
            cpfCnpj: data.cpfCnpj || "",
            phone: data.phone || "",
            email: data.email || "",
            status: data.status,
            street: typeof data.address === 'object' ? data.address?.street || "" : "",
            number: typeof data.address === 'object' ? data.address?.number || "" : "",
            complement: typeof data.address === 'object' ? data.address?.complement || "" : "",
            neighborhood: typeof data.address === 'object' ? data.address?.neighborhood || "" : "",
            city: typeof data.address === 'object' ? data.address?.city || "" : "",
            state: typeof data.address === 'object' ? data.address?.state || "" : "",
            zipCode: typeof data.address === 'object' ? data.address?.zipCode || "" : "",
          });
        } catch (error) {
          console.error("Erro ao carregar promotora:", error);
          toast.error("Erro ao carregar dados da promotora");
        } finally {
          setIsLoading(false);
        }
      };

      loadPromoter();
    }
  }, [promoterId, form]);

  // Lidar com a formatação de CPF/CNPJ
  const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedValue = formatCPFOrCNPJ(value);
    form.setValue("cpfCnpj", formattedValue);
  };

  // Lidar com a formatação de telefone
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedValue = formatPhone(value);
    form.setValue("phone", formattedValue);
  };

  // Lidar com a formatação de CEP
  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedValue = formatZipCode(value);
    form.setValue("zipCode", formattedValue);
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

      // Preparar dados da promotora
      const promoterData = {
        name: values.name,
        cpfCnpj: values.cpfCnpj,
        phone: values.phone,
        email: values.email,
        status: values.status,
        address,
      };

      if (promoterId) {
        // Atualizar promotora existente
        await PromoterController.updatePromoter(promoterId, promoterData);
        toast.success("Promotora atualizada com sucesso!");
      } else {
        // Criar nova promotora
        await PromoterController.createPromoter(promoterData);
        toast.success("Promotora cadastrada com sucesso!");
      }

      // Callback de sucesso ou redirecionar
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Erro ao salvar promotora:", error);
      toast.error(error.message || "Erro ao salvar promotora");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{promoterId ? "Editar Promotora" : "Nova Promotora"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome*</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome da promotora" />
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
                    window.history.back();
                  }
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
