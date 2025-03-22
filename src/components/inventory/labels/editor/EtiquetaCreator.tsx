import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EtiquetaEditor } from './EtiquetaEditor';
import { FormatoEtiquetaFields } from '../form/FormatoEtiquetaFields';
import { MargensEtiquetaFields } from '../form/MargensEtiquetaFields';
import { useEtiquetaCustomForm, FormValues } from '@/hooks/useEtiquetaCustomForm';
import { MargensInternasEtiquetaFields } from '../form/MargensInternasEtiquetaFields';

const formSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  descricao: z.string().min(3, "Descrição deve ter pelo menos 3 caracteres"),
  largura: z.number().min(10, "Largura mínima de 10mm").max(210, "Largura máxima de 210mm"),
  altura: z.number().min(5, "Altura mínima de 5mm").max(297, "Altura máxima de 297mm"),
  formatoPagina: z.string(),
  orientacao: z.string(),
  margemSuperior: z.number().min(0, "Margem superior deve ser positiva").max(200, "Margem superior muito grande"),
  margemInferior: z.number().min(0, "Margem inferior deve ser positiva").max(200, "Margem inferior muito grande"),
  margemEsquerda: z.number().min(0, "Margem esquerda deve ser positiva").max(200, "Margem esquerda muito grande"),
  margemDireita: z.number().min(0, "Margem direita deve ser positiva").max(200, "Margem direita muito grande"),
  espacamentoHorizontal: z.number().min(0, "Espaçamento horizontal deve ser positivo").max(200, "Espaçamento horizontal muito grande"),
  espacamentoVertical: z.number().min(0, "Espaçamento vertical deve ser positivo").max(200, "Espaçamento vertical muito grande"),
  larguraPagina: z.number().optional(),
  alturaPagina: z.number().optional(),
  margemInternaEtiquetaSuperior: z.number().min(0, "Margem interna superior deve ser positiva").max(200, "Margem interna superior muito grande"),
  margemInternaEtiquetaInferior: z.number().min(0, "Margem interna inferior deve ser positiva").max(200, "Margem interna inferior muito grande"),
  margemInternaEtiquetaEsquerda: z.number().min(0, "Margem interna esquerda deve ser positiva").max(200, "Margem interna esquerda muito grande"),
  margemInternaEtiquetaDireita: z.number().min(0, "Margem interna direita deve ser positiva").max(200, "Margem interna direita muito grande"),
  campos: z.array(
    z.object({
      tipo: z.enum(['nome', 'codigo', 'preco']),
      x: z.number(),
      y: z.number(),
      largura: z.number(),
      altura: z.number(),
      tamanhoFonte: z.number(),
      align: z.enum(['left', 'center', 'right']).optional(),
    })
  ),
});

type EtiquetaCreatorProps = {
  initialData?: FormValues;
  onClose: () => void;
  onSave: () => void;
};

export type LabelElement = {
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  align?: 'left' | 'center' | 'right';
};

export type LabelType = {
  width: number;
  height: number;
  elements: LabelElement[];
};

import { generatePreviewPDF } from '@/utils/etiquetaGenerator';

/**
 * Componente para criar ou editar modelos de etiqueta
 */
export default function EtiquetaCreator({ initialData, onClose, onSave }: EtiquetaCreatorProps) {
  const navigate = useNavigate();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewElements, setPreviewElements] = useState<LabelElement[]>([]);
  const [showPageView, setShowPageView] = useState(false);

  const { form, isLoading, onSubmit, pageAreaWarning, validarDimensoes } = useEtiquetaCustomForm(initialData, onClose, onSave);

  const handlePreview = useCallback(async () => {
    try {
      // Validar dimensões antes de gerar a pré-visualização
      validarDimensoes();
      if (pageAreaWarning) {
        toast.error("Há problemas com as dimensões da etiqueta. Por favor, corrija antes de pré-visualizar.");
        return;
      }

      const formValues = form.getValues();

      // Converter os campos do formulário para o formato de elementos da etiqueta
      const elements = formValues.campos.map(campo => ({
        type: campo.tipo,
        x: campo.x,
        y: campo.y,
        width: campo.largura,
        height: campo.altura,
        fontSize: campo.tamanhoFonte,
        align: campo.align
      }));
      setPreviewElements(elements);

      // Determinar o tamanho da página
      let pageSize: { width: number, height: number };
      if (formValues.formatoPagina === "Personalizado" && formValues.larguraPagina && formValues.alturaPagina) {
        pageSize = { width: formValues.larguraPagina, height: formValues.alturaPagina };
      } else {
        // Tamanhos padrão (em mm)
        if (formValues.formatoPagina === "A4") {
          pageSize = formValues.orientacao === "retrato" ? { width: 210, height: 297 } : { width: 297, height: 210 };
        } else if (formValues.formatoPagina === "A5") {
          pageSize = formValues.orientacao === "retrato" ? { width: 148, height: 210 } : { width: 210, height: 148 };
        } else if (formValues.formatoPagina === "Letter") {
          pageSize = formValues.orientacao === "retrato" ? { width: 216, height: 279 } : { width: 279, height: 216 };
        } else {
          // Formato padrão (A4 retrato)
          pageSize = { width: 210, height: 297 };
        }
      }

      const previewUrl = await generatePreviewPDF(
        formValues.nome || 'Novo Modelo',
        [
          {
            width: formValues.largura,
            height: formValues.altura,
            elements: previewElements
          }
        ],
        formValues.formatoPagina,
        pageSize,
        { top: formValues.margemSuperior, right: formValues.margemDireita, bottom: formValues.margemInferior, left: formValues.margemEsquerda },
        { horizontal: formValues.espacamentoHorizontal, vertical: formValues.espacamentoVertical },
        { 
          top: formValues.margemInternaEtiquetaSuperior || 0, 
          right: formValues.margemInternaEtiquetaDireita || 0,
          bottom: formValues.margemInternaEtiquetaInferior || 0, 
          left: formValues.margemInternaEtiquetaEsquerda || 0
        },
        true
      );

      setPreviewUrl(previewUrl);
    } catch (error: any) {
      console.error("Erro ao gerar PDF de pré-visualização:", error);
      toast.error(`Erro ao gerar PDF: ${error.message}`);
    }
  }, [form, previewElements, validarDimensoes, pageAreaWarning]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Modelo de Etiqueta</DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para criar um novo modelo de etiqueta.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do modelo" {...field} />
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
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input placeholder="Descrição do modelo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="largura"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Largura da Etiqueta (mm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="80"
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="altura"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Altura da Etiqueta (mm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="30"
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormatoEtiquetaFields form={form} />
            <MargensEtiquetaFields form={form} />
            <MargensInternasEtiquetaFields form={form} />

            <EtiquetaEditor
              campos={form.watch("campos")}
              largura={form.watch("largura")}
              altura={form.watch("altura")}
              formatoPagina={form.watch("formatoPagina")}
              orientacao={form.watch("orientacao")}
              margemSuperior={form.watch("margemSuperior")}
              margemInferior={form.watch("margemInferior")}
              margemEsquerda={form.watch("margemEsquerda")}
              margemDireita={form.watch("margemDireita")}
              espacamentoHorizontal={form.watch("espacamentoHorizontal")}
              espacamentoVertical={form.watch("espacamentoVertical")}
              larguraPagina={form.watch("larguraPagina")}
              alturaPagina={form.watch("alturaPagina")}
              onCamposChange={(campos) => form.setValue("campos", campos)}
              onDimensoesChange={(largura, altura) => {
                form.setValue("largura", largura);
                form.setValue("altura", altura);
              }}
              onMargensChange={(margemSuperior, margemInferior, margemEsquerda, margemDireita) => {
                form.setValue("margemSuperior", margemSuperior);
                form.setValue("margemInferior", margemInferior);
                form.setValue("margemEsquerda", margemEsquerda);
                form.setValue("margemDireita", margemDireita);
              }}
              onEspacamentoChange={(espacamentoHorizontal, espacamentoVertical) => {
                form.setValue("espacamentoHorizontal", espacamentoHorizontal);
                form.setValue("espacamentoVertical", espacamentoVertical);
              }}
              onFormatoChange={(formatoPagina, orientacao, larguraPagina, alturaPagina) => {
                form.setValue("formatoPagina", formatoPagina);
                form.setValue("orientacao", orientacao);
                if (larguraPagina) form.setValue("larguraPagina", larguraPagina);
                if (alturaPagina) form.setValue("alturaPagina", alturaPagina);
              }}
              showPageView={showPageView}
            />

            {pageAreaWarning && (
              <div className="rounded-md bg-muted p-4 mt-4">
                <div className="text-sm text-destructive">{pageAreaWarning}</div>
              </div>
            )}

            <div className="flex justify-between">
              <Button type="button" variant="secondary" onClick={() => {
                setShowPageView(!showPageView);
              }}>
                {showPageView ? 'Esconder Visualização da Página' : 'Mostrar Visualização da Página'}
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handlePreview} disabled={isLoading}>
                  Pré-visualizar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  Salvar modelo
                </Button>
              </div>
            </div>
          </form>
        </Form>
        {previewUrl && (
          <dialog open className="w-full max-w-2xl">
            <Button onClick={() => setPreviewUrl(null)} className="absolute top-2 right-2">Fechar</Button>
            <iframe src={previewUrl} className="w-full h-[600px]"></iframe>
          </dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
