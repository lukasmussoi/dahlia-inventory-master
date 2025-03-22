
import React, { useState, useCallback, useEffect } from 'react';
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EtiquetaEditor } from "./EtiquetaEditor";
import { FormatoEtiquetaFields } from "../form/FormatoEtiquetaFields";
import { DimensoesEtiquetaFields } from "../form/DimensoesEtiquetaFields";
import { ElementosEtiquetaFields } from "../form/ElementosEtiquetaFields";
import { MargensEtiquetaFields } from "../form/MargensEtiquetaFields";
import { EspacamentoEtiquetaFields } from "../form/EspacamentoEtiquetaFields";
import { MargensInternasEtiquetaFields } from "../form/MargensInternasEtiquetaFields";
import { useEtiquetaCustomForm } from "@/hooks/useEtiquetaCustomForm";
import type { ModeloEtiqueta, CampoEtiqueta } from "@/types/etiqueta";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useEtiquetaZoom } from "./useEtiquetaZoom";
import { ZoomControls } from "./ZoomControls";

interface EtiquetaCreatorProps {
  initialData?: ModeloEtiqueta;
  onClose: () => void;
  onSave: () => void;
}

export function EtiquetaCreator({ initialData, onClose, onSave }: EtiquetaCreatorProps) {
  const [showNewElementModal, setShowNewElementModal] = useState(false);
  const [activeTab, setActiveTab] = useState("dimensoes");
  const [selectedElementType, setSelectedElementType] = useState<"nome" | "codigo" | "preco" | null>(null);
  const [isEditorMode, setIsEditorMode] = useState(true);
  const [editorView, setEditorView] = useState<"etiqueta" | "pagina">("etiqueta");
  
  const { zoomLevel, handleZoomIn, handleZoomOut, handleResetZoom } = useEtiquetaZoom();
  
  const { form, isLoading, onSubmit, pageAreaWarning, validarDimensoes } = useEtiquetaCustomForm(
    initialData,
    onClose,
    onSave
  );
  
  // Verificar se um tipo de elemento já existe nos campos
  const camposAtuais = form.watch("campos") || [];
  const tiposExistentes = new Set(camposAtuais.map(campo => campo.tipo));
  
  // Calcular altura e largura atuais
  const larguraEtiqueta = form.watch("largura");
  const alturaEtiqueta = form.watch("altura");
  
  // Calcular altura e largura máximas disponíveis
  const formatoPagina = form.watch("formatoPagina");
  const orientacao = form.watch("orientacao");
  const margemSuperior = form.watch("margemSuperior");
  const margemInferior = form.watch("margemInferior");
  const margemEsquerda = form.watch("margemEsquerda");
  const margemDireita = form.watch("margemDireita");
  
  let larguraPagina = formatoPagina === "A4" ? 210 : 
                    formatoPagina === "Letter" ? 216 : 
                    formatoPagina === "Legal" ? 216 : 
                    form.watch("larguraPagina") || 210;
  
  let alturaPagina = formatoPagina === "A4" ? 297 : 
                   formatoPagina === "Letter" ? 279 : 
                   formatoPagina === "Legal" ? 356 : 
                   form.watch("alturaPagina") || 297;
  
  if (orientacao === "paisagem") {
    [larguraPagina, alturaPagina] = [alturaPagina, larguraPagina];
  }
  
  const larguraMaxima = larguraPagina - margemEsquerda - margemDireita;
  const alturaMaxima = alturaPagina - margemSuperior - margemInferior;
  
  const resetSelectedElement = useCallback(() => {
    setSelectedElementType(null);
  }, []);

  const handleCamposChange = useCallback((novosCampos: CampoEtiqueta[]) => {
    form.setValue("campos", novosCampos, { shouldValidate: true });
  }, [form]);

  const handleDimensoesChange = useCallback((largura: number, altura: number) => {
    form.setValue("largura", largura, { shouldValidate: true });
    form.setValue("altura", altura, { shouldValidate: true });
    validarDimensoes();
  }, [form, validarDimensoes]);

  const handleFormatoChange = useCallback((formatoPagina: string, orientacao: string, larguraPagina?: number, alturaPagina?: number) => {
    form.setValue("formatoPagina", formatoPagina, { shouldValidate: true });
    form.setValue("orientacao", orientacao, { shouldValidate: true });
    
    if (formatoPagina === "Personalizado") {
      if (larguraPagina) form.setValue("larguraPagina", larguraPagina, { shouldValidate: true });
      if (alturaPagina) form.setValue("alturaPagina", alturaPagina, { shouldValidate: true });
    }
    
    validarDimensoes();
  }, [form, validarDimensoes]);

  const handleMargensChange = useCallback((margemSuperior: number, margemInferior: number, margemEsquerda: number, margemDireita: number) => {
    form.setValue("margemSuperior", margemSuperior, { shouldValidate: true });
    form.setValue("margemInferior", margemInferior, { shouldValidate: true });
    form.setValue("margemEsquerda", margemEsquerda, { shouldValidate: true });
    form.setValue("margemDireita", margemDireita, { shouldValidate: true });
    
    validarDimensoes();
  }, [form, validarDimensoes]);

  const handleEspacamentoChange = useCallback((espacamentoHorizontal: number, espacamentoVertical: number) => {
    form.setValue("espacamentoHorizontal", espacamentoHorizontal, { shouldValidate: true });
    form.setValue("espacamentoVertical", espacamentoVertical, { shouldValidate: true });
  }, [form]);

  const handleMargemInternaChange = useCallback((superior: number, inferior: number, esquerda: number, direita: number) => {
    form.setValue("margemInternaEtiquetaSuperior", superior, { shouldValidate: true });
    form.setValue("margemInternaEtiquetaInferior", inferior, { shouldValidate: true });
    form.setValue("margemInternaEtiquetaEsquerda", esquerda, { shouldValidate: true });
    form.setValue("margemInternaEtiquetaDireita", direita, { shouldValidate: true });
  }, [form]);

  const toggleEditorMode = () => {
    setIsEditorMode(!isEditorMode);
  };

  const toggleEditorView = () => {
    setEditorView(editorView === "etiqueta" ? "pagina" : "etiqueta");
  };

  // Verificar se podemos adicionar novos elementos
  const canAddNome = !tiposExistentes.has('nome');
  const canAddCodigo = !tiposExistentes.has('codigo');
  const canAddPreco = !tiposExistentes.has('preco');
  
  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-[90vw] h-[90vh] flex flex-col p-0 gap-0 bg-background">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle>
            {initialData?.id ? "Editar Modelo de Etiqueta" : "Criar Novo Modelo de Etiqueta"}
          </DialogTitle>
          <DialogDescription>
            Configure as dimensões, elementos e layouts para criar seu modelo de etiqueta personalizado.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex flex-col flex-1 overflow-hidden">
            <div className="flex gap-4 px-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Nome do Modelo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Etiqueta Padrão" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-end gap-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={toggleEditorMode}
                >
                  {isEditorMode ? "Modo Formulário" : "Modo Editor Visual"}
                </Button>
                
                {isEditorMode && (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={toggleEditorView}
                  >
                    {editorView === "etiqueta" ? "Visualizar Página" : "Editar Etiqueta"}
                  </Button>
                )}
                
                <ZoomControls 
                  zoomLevel={zoomLevel}
                  onZoomIn={handleZoomIn}
                  onZoomOut={handleZoomOut}
                  onResetZoom={handleResetZoom}
                />
              </div>
            </div>

            {pageAreaWarning && (
              <Alert variant="destructive" className="mx-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Atenção</AlertTitle>
                <AlertDescription>
                  {pageAreaWarning}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-1 overflow-hidden">
              {isEditorMode ? (
                <div className="flex-1 flex overflow-hidden">
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
                    onCamposChange={handleCamposChange}
                    onDimensoesChange={handleDimensoesChange}
                    onMargensChange={handleMargensChange}
                    onEspacamentoChange={handleEspacamentoChange}
                    onFormatoChange={handleFormatoChange}
                    showPageView={editorView === "pagina"}
                  />
                </div>
              ) : (
                <div className="flex flex-1 overflow-hidden">
                  <div className="w-1/3 border-r p-4 overflow-y-auto">
                    <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="grid grid-cols-3 mb-4">
                        <TabsTrigger value="dimensoes">Dimensões</TabsTrigger>
                        <TabsTrigger value="margens">Margens</TabsTrigger>
                        <TabsTrigger value="elementos">Elementos</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="dimensoes" className="space-y-4">
                        <DimensoesEtiquetaFields form={form} />
                        <FormatoEtiquetaFields form={form} />
                      </TabsContent>
                      
                      <TabsContent value="margens" className="space-y-4">
                        <h3 className="font-medium mb-2">Margens da Página</h3>
                        <MargensEtiquetaFields form={form} />
                        
                        <h3 className="font-medium mb-2 mt-6">Margens Internas da Etiqueta</h3>
                        <MargensInternasEtiquetaFields form={form} />
                        
                        <h3 className="font-medium mb-2 mt-6">Espaçamento entre Etiquetas</h3>
                        <EspacamentoEtiquetaFields form={form} />
                      </TabsContent>
                      
                      <TabsContent value="elementos" className="space-y-4">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-medium">Elementos na Etiqueta</h3>
                          <Button 
                            type="button"
                            variant="outline"
                            onClick={() => {
                              // Corrigido: definindo explicitamente todos os campos obrigatórios
                              const newCampo: CampoEtiqueta = {
                                tipo: 'nome',
                                x: 5,
                                y: 5,
                                largura: 40,
                                altura: 10,
                                tamanhoFonte: 8,
                                align: 'left'
                              };
                              
                              const campos = form.getValues().campos || [];
                              form.setValue('campos', [...campos, newCampo], { shouldValidate: true });
                            }}
                          >
                            Adicionar Elemento
                          </Button>
                        </div>
                        <ElementosEtiquetaFields 
                          form={form} 
                          maxWidth={larguraMaxima} 
                          maxHeight={alturaMaxima} 
                        />
                      </TabsContent>
                    </Tabs>
                  </div>
                  
                  <div className="flex-1 p-4 flex flex-col items-center justify-center bg-gray-50 overflow-auto">
                    <div 
                      className="bg-white border rounded shadow-sm overflow-hidden"
                      style={{
                        width: `${form.watch("largura") * zoomLevel}px`,
                        height: `${form.watch("altura") * zoomLevel}px`,
                        position: 'relative'
                      }}
                    >
                      {form.watch("campos").map((campo, index) => (
                        <div 
                          key={`preview-${campo.tipo}-${index}`}
                          className="absolute border border-gray-300"
                          style={{
                            left: `${campo.x * zoomLevel}px`,
                            top: `${campo.y * zoomLevel}px`,
                            width: `${campo.largura * zoomLevel}px`,
                            height: `${campo.altura * zoomLevel}px`,
                            fontSize: `${campo.tamanhoFonte * zoomLevel}px`,
                            fontFamily: 'Arial, sans-serif',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: campo.align === 'center' ? 'center' : 
                                          campo.align === 'right' ? 'flex-end' : 'flex-start',
                            padding: '0 4px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {campo.tipo === 'nome' ? 'Nome do Produto' :
                           campo.tipo === 'codigo' ? '0123456789012' : 'R$ 99,99'}
                        </div>
                      ))}
                    </div>
                    
                    <div className="text-sm text-gray-500 mt-2">
                      Dimensões: {form.watch("largura")}mm × {form.watch("altura")}mm
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="p-4 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar Modelo"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
