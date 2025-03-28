/**
 * Componente de Diálogo de Formulário de Maleta
 * @file Este arquivo contém o formulário para criar e editar informações de uma maleta
 * @relacionamento Utilizado para criar novas maletas ou editar maletas existentes
 */
import { useState, useEffect, useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CombinedSuitcaseController } from "@/controllers/suitcase";
import { toast } from "sonner";
import { Suitcase } from "@/types/suitcase";

const formSchema = z.object({
  code: z.string().min(2, {
    message: "O código da maleta deve ter pelo menos 2 caracteres.",
  }),
  seller_id: z.string().min(1, {
    message: "Selecione uma revendedora.",
  }),
  city: z.string().optional(),
  neighborhood: z.string().optional(),
});

interface SuitcaseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suitcase?: Suitcase;
  onSuccess?: () => void;
}

export function SuitcaseFormDialog({
  open,
  onOpenChange,
  suitcase,
  onSuccess,
}: SuitcaseFormDialogProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");

  // Função para extrair valores do endereço
  const extractAddressValue = (address: any, field: string): string => {
    // Se o endereço for null/undefined, retornar string vazia
    if (!address) return '';
    
    // Se o endereço for um objeto JSON, tentar extrair o campo
    if (typeof address === 'object' && !Array.isArray(address)) {
      return address[field]?.toString() || '';
    }
    
    // Se for qualquer outro tipo, retornar string vazia
    return '';
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      seller_id: "",
      city: "",
      neighborhood: "",
    },
  });

  useEffect(() => {
    setIsEditMode(!!suitcase);
    if (suitcase) {
      form.setValue("code", suitcase.code);
      form.setValue("seller_id", suitcase.seller_id);
      setCity(suitcase.city || "");
      setNeighborhood(suitcase.neighborhood || "");
    } else {
      form.reset();
      setCity("");
      setNeighborhood("");
    }
  }, [suitcase, form]);

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const sellersData = await CombinedSuitcaseController.getAllSellers();
        setSellers(sellersData);
      } catch (error) {
        console.error("Erro ao buscar revendedoras:", error);
        toast.error("Erro ao buscar revendedoras");
      } finally {
        setLoading(false);
      }
    };

    fetchSellers();
  }, []);

  // Quando buscar o vendedor
  const fetchSellerInfo = async (sellerId: string) => {
    try {
      const seller = await CombinedSuitcaseController.getSellerById(sellerId);
      if (seller) {
        // Use a função utilitária para extrair valores do endereço
        setCity(extractAddressValue(seller.address, 'city'));
        setNeighborhood(extractAddressValue(seller.address, 'neighborhood'));
      }
    } catch (error) {
      console.error("Erro ao buscar informações da revendedora:", error);
    }
  };

  useEffect(() => {
    if (form.watch("seller_id")) {
      void fetchSellerInfo(form.watch("seller_id"));
    }
  }, [form.watch("seller_id")]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (isEditMode && suitcase) {
        // Editar maleta existente
        await CombinedSuitcaseController.updateSuitcase({
          id: suitcase.id,
          code: values.code,
          seller_id: values.seller_id,
          city,
          neighborhood,
        });
        toast.success("Maleta atualizada com sucesso!");
      } else {
        // Criar nova maleta
        await CombinedSuitcaseController.createSuitcase({
          code: values.code,
          seller_id: values.seller_id,
          city,
          neighborhood,
        });
        toast.success("Maleta criada com sucesso!");
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar maleta:", error);
      toast.error("Erro ao salvar maleta");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Maleta" : "Criar Maleta"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Edite os campos abaixo para atualizar a maleta."
              : "Adicione uma nova maleta ao sistema."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código da Maleta</FormLabel>
                  <FormControl>
                    <Input placeholder="MALETA-001" {...field} />
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
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma revendedora" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loading ? (
                        <SelectItem value="">Carregando...</SelectItem>
                      ) : (
                        sellers.map((seller: any) => (
                          <SelectItem key={seller.id} value={seller.id}>
                            {seller.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center justify-between">
              <Label htmlFor="city">Cidade</Label>
              <Switch id="city" checked={!!city} onCheckedChange={() => {}} />
            </div>
            <Input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Cidade"
              disabled={!form.watch("seller_id")}
            />
            <div className="flex items-center justify-between">
              <Label htmlFor="neighborhood">Bairro</Label>
              <Switch
                id="neighborhood"
                checked={!!neighborhood}
                onCheckedChange={() => {}}
              />
            </div>
            <Input
              type="text"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Bairro"
              disabled={!form.watch("seller_id")}
            />
            <DialogFooter>
              <Button type="submit">
                {isEditMode ? "Salvar Alterações" : "Criar Maleta"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
