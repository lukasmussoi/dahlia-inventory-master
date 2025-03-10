
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { EtiquetaCustomModel, ModeloEtiqueta } from "@/models/etiquetaCustomModel";
import { DimensoesEtiquetaFields } from "./form/DimensoesEtiquetaFields";
import { FormatoEtiquetaFields } from "./form/FormatoEtiquetaFields";
import { MargensEtiquetaFields } from "./form/MargensEtiquetaFields";
import { EspacamentoEtiquetaFields } from "./form/EspacamentoEtiquetaFields";

const formSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  descricao: z.string().min(3, "Descrição deve ter pelo menos 3 caracteres"),
  largura: z.number().min(10, "Largura mínima de 10mm"),
  altura: z.number().min(10, "Altura mínima de 10mm"),
  formatoPagina: z.string(),
  orientacao: z.string(),
  margemSuperior: z.number().min(0),
  margemInferior: z.number().min(0),
  margemEsquerda: z.number().min(0),
  margemDireita: z.number().min(0),
  espacamentoHorizontal: z.number().min(0),
  espacamentoVertical: z.number().min(0),
});

type EtiquetaCustomFormProps = {
  modelo?: ModeloEtiqueta;
  onClose: () => void;
  onSuccess: () => void;
};

export function EtiquetaCustomForm({ modelo, onClose, onSuccess }: EtiquetaCustomFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: modelo?.nome || "",
      descricao: modelo?.descricao || "",
      largura: modelo?.largura || 80,
      altura: modelo?.altura || 40,
      formatoPagina: modelo?.formatoPagina || "A4",
      orientacao: modelo?.orientacao || "retrato",
      margemSuperior: modelo?.margemSuperior || 10,
      margemInferior: modelo?.margemInferior || 10,
      margemEsquerda: modelo?.margemEsquerda || 10,
      margemDireita: modelo?.margemDireita || 10,
      espacamentoHorizontal: modelo?.espacamentoHorizontal || 0,
      espacamentoVertical: modelo?.espacamentoVertical || 0,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);

      const modeloData: ModeloEtiqueta = {
        ...values,
        campos: modelo?.campos || [],
      };

      let success: boolean | string | null;
      if (modelo?.id) {
        success = await EtiquetaCustomModel.update(modelo.id, modeloData);
      } else {
        success = await EtiquetaCustomModel.create(modeloData);
      }

      if (success) {
        toast.success(modelo?.id ? "Modelo atualizado com sucesso!" : "Modelo criado com sucesso!");
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error("Erro ao salvar modelo:", error);
      toast.error("Erro ao salvar modelo de etiqueta");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Modelo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Etiqueta Padrão 80x40mm" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição do Modelo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Etiqueta para produtos pequenos" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DimensoesEtiquetaFields form={form} />
        <FormatoEtiquetaFields form={form} />
        <MargensEtiquetaFields form={form} />
        <EspacamentoEtiquetaFields form={form} />

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : (modelo?.id ? "Atualizar" : "Criar")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
