
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { toast } from "sonner";
import { EtiquetaCustomModel } from "@/models/etiquetaCustomModel";
import type { ModeloEtiqueta } from "@/types/etiqueta";

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

export type FormValues = z.infer<typeof formSchema>;

export function useEtiquetaCustomForm(modelo?: ModeloEtiqueta, onClose?: () => void, onSuccess?: () => void) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
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

  async function onSubmit(data: FormValues) {
    try {
      setIsLoading(true);

      const modeloData: ModeloEtiqueta = {
        ...data,
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
        onSuccess?.();
        onClose?.();
      }
    } catch (error) {
      console.error("Erro ao salvar modelo:", error);
      toast.error("Erro ao salvar modelo de etiqueta");
    } finally {
      setIsLoading(false);
    }
  }

  return {
    form,
    isLoading,
    onSubmit
  };
}
