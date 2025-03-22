
import React, { useState, useCallback, useEffect } from 'react';
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
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
import { useEtiquetaCustomForm } from "@/hooks/useEtiquetaCustomForm";
import type { ModeloEtiqueta, CampoEtiqueta } from "@/types/etiqueta";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Grid, Save, Plus, Settings } from "lucide-react";
import { useEtiquetaZoom } from "./useEtiquetaZoom";
import { ZoomControls } from "./ZoomControls";
import { Toggle } from "@/components/ui/toggle";

// Definir tipos para exportação que estão sendo usados em etiquetaGenerator.ts
export interface LabelType {
  width: number;
  height: number;
  elements: LabelElement[];
}

export interface LabelElement {
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  align?: 'left' | 'center' | 'right';
}

interface EtiquetaCreatorProps {
  initialData?: ModeloEtiqueta;
  onClose: () => void;
  onSave: () => void;
}

export function EtiquetaCreator({ initialData, onClose, onSave }: EtiquetaCreatorProps) {
  const [activeTab, setActiveTab] = useState<"elementos" | "config" | "etiqueta">("elementos");
  const [showGrid, setShowGrid] = useState(true);
  const { zoomLevel, handleZoomIn, handleZoomOut, handleResetZoom } = useEtiquetaZoom();
  
  // Usar o hook de formulário para gerenciar estados e validações
  const { form, isLoading, onSubmit, pageAreaWarning } = useEtiquetaCustomForm(
    initialData,
    onClose,
    onSave
  );
  
  // Verificar se um tipo de elemento já existe nos campos
  const camposAtuais = form.watch("campos") || [];
  
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

  const handleCamposChange = useCallback((novosCampos: CampoEtiqueta[]) => {
    // Garantir que todos os campos tenham tipo definido
    const camposValidados = novosCampos.map(campo => ({
      ...campo,
      tipo: campo.tipo || 'nome' // Definir valor padrão para tipo
    })) as CampoEtiqueta[];
    
    form.setValue("campos", camposValidados, { shouldValidate: true });
  }, [form]);

  const handleDimensoesChange = useCallback((largura: number, altura: number) => {
    form.setValue("largura", largura, { shouldValidate: true });
    form.setValue("altura", altura, { shouldValidate: true });
  }, [form]);

  const handleFormatoChange = useCallback((formatoPagina: string, orientacao: string, larguraPagina?: number, alturaPagina?: number) => {
    form.setValue("formatoPagina", formatoPagina, { shouldValidate: true });
    form.setValue("orientacao", orientacao, { shouldValidate: true });
    
    if (formatoPagina === "Personalizado") {
      if (larguraPagina) form.setValue("larguraPagina", larguraPagina, { shouldValidate: true });
      if (alturaPagina) form.setValue("alturaPagina", alturaPagina, { shouldValidate: true });
    }
  }, [form]);

  const handleMargensChange = useCallback((margemSuperior: number, margemInferior: number, margemEsquerda: number, margemDireita: number) => {
    form.setValue("margemSuperior", margemSuperior, { shouldValidate: true });
    form.setValue("margemInferior", margemInferior, { shouldValidate: true });
    form.setValue("margemEsquerda", margemEsquerda, { shouldValidate: true });
    form.setValue("margemDireita", margemDireita, { shouldValidate: true });
  }, [form]);

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

  // Função para adicionar novo elemento à etiqueta
  const handleAddElement = (tipo: 'nome' | 'codigo' | 'preco') => {
    const campos = form.getValues().campos || [];
    const tiposExistentes = new Set(campos.map(campo => campo.tipo || 'nome'));
    
    // Verificar se o tipo já existe
    if (tiposExistentes.has(tipo)) {
      toast.error(`Elemento "${tipo}" já existe na etiqueta`);
      return;
    }
    
    // Criar novo elemento com o tipo especificado e valores padrão
    const novoElemento: CampoEtiqueta = {
      tipo: tipo, // Valor obrigatório
      x: 10,
      y: 10,
      largura: 40,
      altura: 10,
      tamanhoFonte: 10,
      align: 'left'
    };
    
    form.setValue('campos', [...campos, novoElemento], { shouldValidate: true });
  };

  // Componente para a aba de elementos
  const ElementosTab = () => (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-medium">Adicionar Elementos</h3>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
          <span>Nome do Produto</span>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => handleAddElement('nome')}
            disabled={camposAtuais.some(c => c.tipo === 'nome')}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
          <span>Código de Barras</span>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => handleAddElement('codigo')}
            disabled={camposAtuais.some(c => c.tipo === 'codigo')}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
          <span>Preço</span>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => handleAddElement('preco')}
            disabled={camposAtuais.some(c => c.tipo === 'preco')}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="mt-6">
        <h3 className="text-base font-medium mb-2">Etiquetas</h3>
        <div className="border rounded p-2 mb-2 flex justify-between items-center">
          <span>Etiqueta 1</span>
          <Button size="sm" variant="ghost" disabled>
            <Save className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="mt-6">
          <h3 className="text-base font-medium mb-2">Tamanho da Etiqueta</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FormLabel>Largura (mm)</FormLabel>
              <Input 
                type="number" 
                value={larguraEtiqueta}
                onChange={e => handleDimensoesChange(Number(e.target.value), alturaEtiqueta)}
                min={1}
                max={300}
              />
            </div>
            <div>
              <FormLabel>Altura (mm)</FormLabel>
              <Input 
                type="number" 
                value={alturaEtiqueta}
                onChange={e => handleDimensoesChange(larguraEtiqueta, Number(e.target.value))}
                min={1}
                max={300}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Componente para a aba de configurações
  const ConfigTab = () => (
    <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-260px)]">
      <div>
        <h3 className="text-base font-medium mb-2">Tamanho da Página</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FormLabel>Largura (mm)</FormLabel>
            <Input 
              type="number" 
              value={form.watch("larguraPagina") || larguraPagina}
              onChange={e => form.setValue("larguraPagina", Number(e.target.value), { shouldValidate: true })}
              min={50}
              max={300}
            />
          </div>
          <div>
            <FormLabel>Altura (mm)</FormLabel>
            <Input 
              type="number" 
              value={form.watch("alturaPagina") || alturaPagina}
              onChange={e => form.setValue("alturaPagina", Number(e.target.value), { shouldValidate: true })}
              min={50}
              max={420}
            />
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-base font-medium mb-2">Orientação da Página</h3>
        <div className="flex space-x-2">
          <Button
            variant={orientacao === "retrato" ? "default" : "outline"}
            onClick={() => form.setValue("orientacao", "retrato", { shouldValidate: true })}
            className="flex-1"
          >
            Retrato
          </Button>
          <Button
            variant={orientacao === "paisagem" ? "default" : "outline"}
            onClick={() => form.setValue("orientacao", "paisagem", { shouldValidate: true })}
            className="flex-1"
          >
            Paisagem
          </Button>
        </div>
      </div>
      
      <div>
        <h3 className="text-base font-medium mb-2">Margens da Página (mm)</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FormLabel>Superior</FormLabel>
            <Input 
              type="number" 
              value={margemSuperior}
              onChange={e => form.setValue("margemSuperior", Number(e.target.value), { shouldValidate: true })}
              min={0}
              max={200}
            />
          </div>
          <div>
            <FormLabel>Direita</FormLabel>
            <Input 
              type="number" 
              value={margemDireita}
              onChange={e => form.setValue("margemDireita", Number(e.target.value), { shouldValidate: true })}
              min={0}
              max={200}
            />
          </div>
          <div>
            <FormLabel>Inferior</FormLabel>
            <Input 
              type="number" 
              value={margemInferior}
              onChange={e => form.setValue("margemInferior", Number(e.target.value), { shouldValidate: true })}
              min={0}
              max={200}
            />
          </div>
          <div>
            <FormLabel>Esquerda</FormLabel>
            <Input 
              type="number" 
              value={margemEsquerda}
              onChange={e => form.setValue("margemEsquerda", Number(e.target.value), { shouldValidate: true })}
              min={0}
              max={200}
            />
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-base font-medium mb-2">Margens da Etiqueta (mm)</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FormLabel>Superior</FormLabel>
            <Input 
              type="number" 
              value={form.watch("margemInternaEtiquetaSuperior")}
              onChange={e => form.setValue("margemInternaEtiquetaSuperior", Number(e.target.value), { shouldValidate: true })}
              min={0}
              max={200}
            />
          </div>
          <div>
            <FormLabel>Direita</FormLabel>
            <Input 
              type="number" 
              value={form.watch("margemInternaEtiquetaDireita")}
              onChange={e => form.setValue("margemInternaEtiquetaDireita", Number(e.target.value), { shouldValidate: true })}
              min={0}
              max={200}
            />
          </div>
          <div>
            <FormLabel>Inferior</FormLabel>
            <Input 
              type="number" 
              value={form.watch("margemInternaEtiquetaInferior")}
              onChange={e => form.setValue("margemInternaEtiquetaInferior", Number(e.target.value), { shouldValidate: true })}
              min={0}
              max={200}
            />
          </div>
          <div>
            <FormLabel>Esquerda</FormLabel>
            <Input 
              type="number" 
              value={form.watch("margemInternaEtiquetaEsquerda")}
              onChange={e => form.setValue("margemInternaEtiquetaEsquerda", Number(e.target.value), { shouldValidate: true })}
              min={0}
              max={200}
            />
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-base font-medium mb-2">Espaçamento entre Etiquetas (mm)</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FormLabel>Horizontal</FormLabel>
            <Input 
              type="number" 
              value={form.watch("espacamentoHorizontal")}
              onChange={e => form.setValue("espacamentoHorizontal", Number(e.target.value), { shouldValidate: true })}
              min={0}
              max={200}
            />
          </div>
          <div>
            <FormLabel>Vertical</FormLabel>
            <Input 
              type="number" 
              value={form.watch("espacamentoVertical")}
              onChange={e => form.setValue("espacamentoVertical", Number(e.target.value), { shouldValidate: true })}
              min={0}
              max={200}
            />
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-base font-medium mb-2">Modelo de Página</h3>
        <div className="w-full">
          <select 
            className="w-full p-2 border rounded"
            value={formatoPagina}
            onChange={e => form.setValue("formatoPagina", e.target.value, { shouldValidate: true })}
          >
            <option value="A4">A4</option>
            <option value="Letter">Letter</option>
            <option value="Legal">Legal</option>
            <option value="Personalizado">Personalizado</option>
          </select>
        </div>
      </div>
      
      <div>
        <h3 className="text-base font-medium mb-2">Grade e Alinhamento</h3>
        <div className="flex space-x-2">
          <Toggle 
            pressed={showGrid} 
            onPressedChange={setShowGrid}
            aria-label="Toggle grid"
          >
            <Grid className="h-4 w-4 mr-2" /> Ocultar Grade
          </Toggle>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-[90vw] h-[90vh] flex flex-col p-0 gap-0 bg-background">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
            <DialogHeader className="px-4 py-2 border-b">
              <div className="flex justify-between items-center">
                <DialogTitle>
                  {initialData?.id ? "Editar Modelo de Etiqueta" : "Criar Novo Modelo de Etiqueta"}
                </DialogTitle>
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem className="flex-1 max-w-xs mx-4 mb-0">
                      <FormControl>
                        <Input placeholder="Nome do modelo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={onClose}
                  className="ml-auto"
                >
                  ✕
                </Button>
              </div>
            </DialogHeader>

            <div className="flex-1 flex overflow-hidden">
              {/* Barra de ferramentas superior */}
              <div className="absolute top-[60px] left-0 right-0 z-10 bg-white border-b px-4 py-2 flex items-center">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setActiveTab("elementos")}
                  className={activeTab === "elementos" ? "bg-accent" : ""}
                >
                  <Plus className="h-4 w-4 mr-2" /> Elementos
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setActiveTab("config")}
                  className={activeTab === "config" ? "bg-accent" : ""}
                >
                  <Settings className="h-4 w-4 mr-2" /> Config
                </Button>
                <Button 
                  type="button" 
                  variant="ghost"
                  onClick={() => setShowGrid(!showGrid)}
                  className="ml-2"
                >
                  <Grid className="h-4 w-4 mr-2" /> Grade
                </Button>
                <select 
                  className="ml-4 p-1 border rounded"
                  value="100%"
                >
                  <option value="75%">75%</option>
                  <option value="100%">100%</option>
                  <option value="150%">150%</option>
                  <option value="200%">200%</option>
                </select>
                <div className="ml-auto">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => toast.info("Pré-visualização em desenvolvimento")}
                  >
                    Pré-visualizar
                  </Button>
                </div>
              </div>

              {/* Painel lateral (elementos ou configurações) */}
              <div className="w-[240px] border-r overflow-y-auto pt-[60px]">
                {activeTab === "elementos" && <ElementosTab />}
                {activeTab === "config" && <ConfigTab />}
              </div>

              {/* Editor de etiqueta */}
              <div className="flex-1 overflow-hidden pt-[60px]">
                <div className="h-full overflow-auto bg-gray-100 flex items-center justify-center">
                  <div className={`bg-yellow-100 relative border ${showGrid ? 'etiqueta-grid' : ''}`}
                      style={{
                        width: `${larguraEtiqueta * zoomLevel}px`,
                        height: `${alturaEtiqueta * zoomLevel}px`,
                        backgroundSize: `${5 * zoomLevel}mm ${5 * zoomLevel}mm`
                      }}>
                    {camposAtuais.map((campo, index) => {
                      // Garantir que campo.tipo esteja sempre definido
                      const tipo = campo.tipo || 'nome';
                      return (
                        <div 
                          key={`editor-${tipo}-${index}`}
                          className="absolute border border-blue-500 bg-white rounded-sm flex items-center p-1 cursor-move"
                          style={{
                            left: `${campo.x * zoomLevel}px`,
                            top: `${campo.y * zoomLevel}px`,
                            width: `${campo.largura * zoomLevel}px`,
                            height: `${campo.altura * zoomLevel}px`,
                          }}
                        >
                          <div className="flex items-center justify-center w-full h-full">
                            {tipo === 'nome' && <div className="text-xs">Nome</div>}
                            {tipo === 'codigo' && <div className="text-xs">|||||||</div>}
                            {tipo === 'preco' && <div className="text-xs">R$</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {pageAreaWarning && (
              <Alert variant="destructive" className="m-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Atenção</AlertTitle>
                <AlertDescription>
                  {pageAreaWarning}
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter className="p-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
