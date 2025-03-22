import React, { useState, useCallback, useEffect } from 'react';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FormatoEtiquetaFields } from '../form/FormatoEtiquetaFields';
import { MargensEtiquetaFields } from '../form/MargensEtiquetaFields';
import { MargensInternasEtiquetaFields } from '../form/MargensInternasEtiquetaFields';
import { EtiquetaEditor } from './EtiquetaEditor';
import { useEtiquetaCustomForm } from '@/hooks/useEtiquetaCustomForm';
import { generatePreviewPDF } from '@/utils/etiquetaGenerator';
import type { ModeloEtiqueta, CampoEtiqueta } from "@/types/etiqueta";

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

type EtiquetaCreatorProps = {
  initialData?: ModeloEtiqueta;
  onClose: () => void;
  onSave: () => void;
};

/**
 * Componente para criar ou editar modelos de etiqueta com editor visual
 */
export default function EtiquetaCreator({ initialData, onClose, onSave }: EtiquetaCreatorProps) {
  const [activeTab, setActiveTab] = useState("elementos");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewElements, setPreviewElements] = useState<LabelElement[]>([]);
  const [showPageView, setShowPageView] = useState(true);

  const { form, isLoading, onSubmit, pageAreaWarning, validarDimensoes } = useEtiquetaCustomForm(initialData, onClose, onSave);

  useEffect(() => {
    const campos = form.watch("campos");
    if (campos) {
      const elements = campos.map(campo => ({
        type: campo.tipo,
        x: campo.x,
        y: campo.y,
        width: campo.largura,
        height: campo.altura,
        fontSize: campo.tamanhoFonte,
        align: campo.align
      }));
      setPreviewElements(elements);
    }
  }, [form.watch("campos")]);

  const handlePreview = useCallback(async () => {
    try {
      validarDimensoes();
      if (pageAreaWarning) {
        toast.error("Há problemas com as dimensões da etiqueta. Por favor, corrija antes de pré-visualizar.");
        return;
      }

      const formValues = form.getValues();

      let pageSize: { width: number, height: number };
      if (formValues.formatoPagina === "Personalizado" && formValues.larguraPagina && formValues.alturaPagina) {
        pageSize = { width: formValues.larguraPagina, height: formValues.alturaPagina };
      } else {
        if (formValues.formatoPagina === "A4") {
          pageSize = formValues.orientacao === "retrato" ? { width: 210, height: 297 } : { width: 297, height: 210 };
        } else if (formValues.formatoPagina === "A5") {
          pageSize = formValues.orientacao === "retrato" ? { width: 148, height: 210 } : { width: 210, height: 148 };
        } else if (formValues.formatoPagina === "Letter") {
          pageSize = formValues.orientacao === "retrato" ? { width: 216, height: 279 } : { width: 279, height: 216 };
        } else {
          pageSize = { width: 210, height: 297 };
        }
      }

      const camposValidos = formValues.campos.map(campo => ({
        tipo: campo.tipo,
        x: Number(campo.x) || 0,
        y: Number(campo.y) || 0,
        largura: Number(campo.largura) || 40,
        altura: Number(campo.altura) || 10,
        tamanhoFonte: Number(campo.tamanhoFonte) || 8,
        align: campo.align || 'left'
      }));

      const modeloCompleto: ModeloEtiqueta = {
        nome: formValues.nome || 'Novo Modelo',
        descricao: formValues.descricao || '',
        largura: formValues.largura,
        altura: formValues.altura,
        formatoPagina: formValues.formatoPagina,
        orientacao: formValues.orientacao,
        margemSuperior: formValues.margemSuperior,
        margemInferior: formValues.margemInferior,
        margemEsquerda: formValues.margemEsquerda,
        margemDireita: formValues.margemDireita,
        espacamentoHorizontal: formValues.espacamentoHorizontal,
        espacamentoVertical: formValues.espacamentoVertical,
        larguraPagina: formValues.larguraPagina,
        alturaPagina: formValues.alturaPagina,
        margemInternaEtiquetaSuperior: formValues.margemInternaEtiquetaSuperior,
        margemInternaEtiquetaInferior: formValues.margemInternaEtiquetaInferior,
        margemInternaEtiquetaEsquerda: formValues.margemInternaEtiquetaEsquerda,
        margemInternaEtiquetaDireita: formValues.margemInternaEtiquetaDireita,
        campos: camposValidos
      };

      const previewUrl = await generatePreviewPDF(
        modeloCompleto.nome,
        [
          {
            width: modeloCompleto.largura,
            height: modeloCompleto.altura,
            elements: previewElements
          }
        ],
        modeloCompleto.formatoPagina,
        pageSize,
        { 
          top: modeloCompleto.margemSuperior, 
          right: modeloCompleto.margemDireita, 
          bottom: modeloCompleto.margemInferior, 
          left: modeloCompleto.margemEsquerda 
        },
        { 
          horizontal: modeloCompleto.espacamentoHorizontal, 
          vertical: modeloCompleto.espacamentoVertical 
        },
        { 
          top: modeloCompleto.margemInternaEtiquetaSuperior || 0, 
          right: modeloCompleto.margemInternaEtiquetaDireita || 0,
          bottom: modeloCompleto.margemInternaEtiquetaInferior || 0, 
          left: modeloCompleto.margemInternaEtiquetaEsquerda || 0
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
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Criar Novo Modelo de Etiqueta</h2>
        <div className="flex gap-2">
          <Button onClick={onClose} variant="outline">Cancelar</Button>
          <Button 
            onClick={form.handleSubmit(onSubmit)} 
            disabled={isLoading}
          >
            {isLoading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do modelo</FormLabel>
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

          <Tabs 
            defaultValue="elementos" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="elementos">Elementos</TabsTrigger>
              <TabsTrigger value="etiquetas">Etiquetas</TabsTrigger>
              <TabsTrigger value="config">Configurações</TabsTrigger>
            </TabsList>
            
            <TabsContent value="elementos" className="space-y-4">
              <div className="border p-4 rounded-md">
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
                            {...field}
                            onChange={e => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="border p-4 rounded-md bg-slate-50">
                <h3 className="font-medium mb-2">Editor Visual</h3>
                <EtiquetaEditor
                  campos={form.watch("campos") || []}
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
                  margemInternaEtiquetaSuperior={form.watch("margemInternaEtiquetaSuperior")}
                  margemInternaEtiquetaInferior={form.watch("margemInternaEtiquetaInferior")}
                  margemInternaEtiquetaEsquerda={form.watch("margemInternaEtiquetaEsquerda")}
                  margemInternaEtiquetaDireita={form.watch("margemInternaEtiquetaDireita")}
                  onCamposChange={(campos) => {
                    form.setValue("campos", campos as CampoEtiqueta[], { shouldValidate: true });
                  }}
                  onDimensoesChange={(largura, altura) => {
                    form.setValue("largura", largura, { shouldValidate: true });
                    form.setValue("altura", altura, { shouldValidate: true });
                  }}
                  onMargensChange={(margemSuperior, margemInferior, margemEsquerda, margemDireita) => {
                    form.setValue("margemSuperior", margemSuperior, { shouldValidate: true });
                    form.setValue("margemInferior", margemInferior, { shouldValidate: true });
                    form.setValue("margemEsquerda", margemEsquerda, { shouldValidate: true });
                    form.setValue("margemDireita", margemDireita, { shouldValidate: true });
                  }}
                  onEspacamentoChange={(espacamentoHorizontal, espacamentoVertical) => {
                    form.setValue("espacamentoHorizontal", espacamentoHorizontal, { shouldValidate: true });
                    form.setValue("espacamentoVertical", espacamentoVertical, { shouldValidate: true });
                  }}
                  onFormatoChange={(formatoPagina, orientacao, larguraPagina, alturaPagina) => {
                    form.setValue("formatoPagina", formatoPagina, { shouldValidate: true });
                    form.setValue("orientacao", orientacao, { shouldValidate: true });
                    if (larguraPagina) form.setValue("larguraPagina", larguraPagina, { shouldValidate: true });
                    if (alturaPagina) form.setValue("alturaPagina", alturaPagina, { shouldValidate: true });
                  }}
                  showPageView={showPageView}
                />
                {pageAreaWarning && (
                  <div className="rounded-md bg-yellow-50 p-3 mt-4 text-yellow-700 text-sm border border-yellow-200">
                    <span className="font-medium">Alerta:</span> {pageAreaWarning}
                  </div>
                )}
                <div className="flex justify-end mt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowPageView(!showPageView)}
                  >
                    {showPageView ? 'Esconder Visualização da Página' : 'Mostrar Visualização da Página'}
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="etiquetas" className="space-y-4">
              <div className="flex justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handlePreview} 
                  disabled={isLoading}
                  className="mb-4"
                >
                  Pré-visualizar
                </Button>
              </div>

              <div className="border p-4 rounded-md">
                <h3 className="font-medium mb-2">Configuração de Elementos</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Adicione ou ajuste elementos de texto na etiqueta. Você pode arrastar e redimensionar elementos no editor visual.
                </p>
                
                <div className="grid gap-4">
                  {form.watch("campos")?.map((campo, index) => (
                    <div key={index} className="grid grid-cols-2 gap-3 p-3 border rounded-md">
                      <div>
                        <FormLabel>Tipo</FormLabel>
                        <Select
                          value={campo.tipo}
                          onValueChange={(value: 'nome' | 'codigo' | 'preco') => {
                            const newCampos = [...form.watch("campos")];
                            newCampos[index].tipo = value;
                            form.setValue("campos", newCampos, { shouldValidate: true });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo de campo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nome">Nome</SelectItem>
                            <SelectItem value="codigo">Código</SelectItem>
                            <SelectItem value="preco">Preço</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <FormLabel>Tamanho da Fonte</FormLabel>
                        <Input
                          type="number"
                          value={campo.tamanhoFonte}
                          onChange={(e) => {
                            const newCampos = [...form.watch("campos")];
                            newCampos[index].tamanhoFonte = Number(e.target.value);
                            form.setValue("campos", newCampos, { shouldValidate: true });
                          }}
                        />
                      </div>
                      
                      <div>
                        <FormLabel>Alinhamento</FormLabel>
                        <Select
                          value={campo.align || 'left'}
                          onValueChange={(value: 'left' | 'center' | 'right') => {
                            const newCampos = [...form.watch("campos")];
                            newCampos[index].align = value;
                            form.setValue("campos", newCampos, { shouldValidate: true });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Alinhamento" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Esquerda</SelectItem>
                            <SelectItem value="center">Centro</SelectItem>
                            <SelectItem value="right">Direita</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="col-span-2 grid grid-cols-4 gap-2">
                        <div>
                          <FormLabel className="text-xs">X (mm)</FormLabel>
                          <Input
                            type="number"
                            value={campo.x}
                            onChange={(e) => {
                              const newCampos = [...form.watch("campos")];
                              newCampos[index].x = Number(e.target.value);
                              form.setValue("campos", newCampos, { shouldValidate: true });
                            }}
                          />
                        </div>
                        <div>
                          <FormLabel className="text-xs">Y (mm)</FormLabel>
                          <Input
                            type="number"
                            value={campo.y}
                            onChange={(e) => {
                              const newCampos = [...form.watch("campos")];
                              newCampos[index].y = Number(e.target.value);
                              form.setValue("campos", newCampos, { shouldValidate: true });
                            }}
                          />
                        </div>
                        <div>
                          <FormLabel className="text-xs">Largura (mm)</FormLabel>
                          <Input
                            type="number"
                            value={campo.largura}
                            onChange={(e) => {
                              const newCampos = [...form.watch("campos")];
                              newCampos[index].largura = Number(e.target.value);
                              form.setValue("campos", newCampos, { shouldValidate: true });
                            }}
                          />
                        </div>
                        <div>
                          <FormLabel className="text-xs">Altura (mm)</FormLabel>
                          <Input
                            type="number"
                            value={campo.altura}
                            onChange={(e) => {
                              const newCampos = [...form.watch("campos")];
                              newCampos[index].altura = Number(e.target.value);
                              form.setValue("campos", newCampos, { shouldValidate: true });
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className="col-span-2 flex justify-end">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            const newCampos = form.watch("campos").filter((_, i) => i !== index);
                            form.setValue("campos", newCampos, { shouldValidate: true });
                          }}
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const newCampo: CampoEtiqueta = {
                        tipo: 'nome',
                        x: 5,
                        y: 5,
                        largura: 40,
                        altura: 10,
                        tamanhoFonte: 8,
                        align: 'left'
                      };
                      const currentCampos = form.watch("campos") || [];
                      form.setValue("campos", [...currentCampos, newCampo], { shouldValidate: true });
                    }}
                  >
                    Adicionar Elemento
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="config" className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <FormatoEtiquetaFields form={form} />
                <MargensEtiquetaFields form={form} />
                <MargensInternasEtiquetaFields form={form} />
                
                <div className="border p-4 rounded-md">
                  <h3 className="text-sm font-medium mb-1">Espaçamento Entre Etiquetas</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="espacamentoHorizontal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Horizontal (mm)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              min={0}
                              max={200}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="espacamentoVertical"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vertical (mm)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              min={0}
                              max={200}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between">
            <Button 
              type="button" 
              variant="outline"
              onClick={handlePreview} 
              disabled={isLoading}
            >
              Pré-visualizar
            </Button>
            <div className="space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button 
                type="button" 
                onClick={form.handleSubmit(onSubmit)} 
                disabled={isLoading}
              >
                {isLoading ? "Salvando..." : "Salvar modelo"}
              </Button>
            </div>
          </div>
        </form>
      </Form>

      {previewUrl && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-lg w-4/5 h-4/5 flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium">Pré-visualização da Etiqueta</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setPreviewUrl(null)}
              >
                Fechar
              </Button>
            </div>
            <div className="flex-1 overflow-auto">
              <iframe 
                src={previewUrl} 
                className="w-full h-full border-none"
                title="Pré-visualização de etiqueta"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

