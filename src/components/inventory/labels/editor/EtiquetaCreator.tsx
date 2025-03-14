
import { useState, useRef, useEffect } from "react";
import { 
  AlignCenter, 
  AlignLeft, 
  AlignRight, 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Grid, 
  Layers, 
  Plus, 
  PlusCircle, 
  Save, 
  Settings, 
  Trash, 
  X, 
  ZoomIn, 
  ZoomOut
} from "lucide-react";
import { 
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { useEtiquetaCustomForm } from "@/hooks/useEtiquetaCustomForm";
import type { ModeloEtiqueta, CampoEtiqueta } from "@/types/etiqueta";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

interface EtiquetaCreatorProps {
  modelo?: ModeloEtiqueta;
  onClose: () => void;
  onSuccess: () => void;
}

export function EtiquetaCreator({ modelo, onClose, onSuccess }: EtiquetaCreatorProps) {
  const { 
    form, 
    isLoading, 
    onSubmit, 
    pageAreaWarning,  
    corrigirDimensoesAutomaticamente,
    duplicarModelo
  } = useEtiquetaCustomForm(modelo, onClose, onSuccess);

  // Estados locais para a nova interface
  const [activeTab, setActiveTab] = useState("editor");
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [selectedLabelIndex, setSelectedLabelIndex] = useState<number | null>(0);
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(5);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSidebarPanel, setActiveSidebarPanel] = useState<"elements" | "settings" | "labels">("elements");

  // Refs para manipulação do DOM e controle de arrastar e soltar
  const editorRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ 
    isDragging: false, 
    type: null as string | null, 
    id: null as number | string | null, 
    startX: 0, 
    startY: 0, 
    offsetX: 0, 
    offsetY: 0 
  });

  const elements = [
    { id: "nome", name: "Nome do Produto", defaultWidth: 60, defaultHeight: 15, defaultFontSize: 10, defaultAlign: "left" }, 
    { id: "codigo", name: "Código de Barras", defaultWidth: 60, defaultHeight: 20, defaultFontSize: 8 }, 
    { id: "preco", name: "Preço", defaultWidth: 40, defaultHeight: 15, defaultFontSize: 12, defaultAlign: "center" }
  ];

  // Função para iniciar o arrasto de elementos
  const handleStartDrag = (e: React.MouseEvent, type: "label" | "element", id: number | string, x: number, y: number) => {
    if (!editorRef.current) return;
    e.stopPropagation();
    const rect = editorRef.current.getBoundingClientRect();
    dragRef.current = { 
      isDragging: true, 
      type, 
      id, 
      startX: x, 
      startY: y, 
      offsetX: e.clientX - rect.left, 
      offsetY: e.clientY - rect.top 
    };
  };

  // Função para ajustar ao grid
  const snapToGridValue = (value: number) => snapToGrid ? Math.round(value / gridSize) * gridSize : value;

  // Função para manipular o arrasto
  const handleDrag = (e: React.MouseEvent) => {
    if (!dragRef.current.isDragging || !editorRef.current) return;
    e.preventDefault();

    const rect = editorRef.current.getBoundingClientRect();
    const formValues = form.getValues();
    const pageSize = {
      width: formValues.formatoPagina === "Personalizado" ? formValues.larguraPagina || 210 : 210,
      height: formValues.formatoPagina === "Personalizado" ? formValues.alturaPagina || 297 : 297
    };
    const labelSize = {
      width: formValues.largura,
      height: formValues.altura
    };

    const x = snapToGridValue((e.clientX - rect.left - dragRef.current.offsetX) / (zoom / 100));
    const y = snapToGridValue((e.clientY - rect.top - dragRef.current.offsetY) / (zoom / 100));

    // Atualizar posição do elemento ou etiqueta conforme o tipo
    if (dragRef.current.type === "label") {
      // Manipulação da etiqueta não implementada ainda
    } else {
      // Atualizar a posição de um campo dentro da etiqueta
      const campos = [...form.getValues('campos')];
      const campoIndex = campos.findIndex(c => c.tipo === dragRef.current.id);
      
      if (campoIndex > -1) {
        campos[campoIndex] = {
          ...campos[campoIndex],
          x: Math.max(0, Math.min(x, labelSize.width - campos[campoIndex].largura)),
          y: Math.max(0, Math.min(y, labelSize.height - campos[campoIndex].altura))
        };
        form.setValue('campos', campos);
      }
    }
  };

  // Função para finalizar o arrasto
  const handleEndDrag = () => {
    dragRef.current.isDragging = false;
  };

  // Adicionar listeners globais para eventos de mouse
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragRef.current.isDragging) {
        handleDrag(e as unknown as React.MouseEvent);
      }
    };

    const handleMouseUp = () => {
      if (dragRef.current.isDragging) {
        handleEndDrag();
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Renderizar a etiqueta com base nos campos
  const renderEditor = () => {
    const formValues = form.getValues();
    const pageWidth = formValues.formatoPagina === "Personalizado" ? formValues.larguraPagina || 210 : 210;
    const pageHeight = formValues.formatoPagina === "Personalizado" ? formValues.alturaPagina || 297 : 297;
    const etiquetaWidth = formValues.largura;
    const etiquetaHeight = formValues.altura;

    return (
      <div 
        className="etiqueta-editor-workspace flex-1 overflow-auto relative"
        style={{ padding: '1rem' }}
      >
        <div
          ref={editorRef}
          className="etiqueta-page-background relative mx-auto"
          style={{
            width: `${pageWidth * zoom / 100}px`,
            height: `${pageHeight * zoom / 100}px`,
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top left',
            background: 'rgba(255, 255, 0, 0.1)'  // Fundo amarelado como solicitado
          }}
        >
          {/* Etiqueta */}
          <div
            className="etiqueta-item absolute"
            style={{
              left: `${20 * zoom / 100}px`,  // Posição x
              top: `${20 * zoom / 100}px`,   // Posição y
              width: `${etiquetaWidth * zoom / 100}px`,
              height: `${etiquetaHeight * zoom / 100}px`,
              background: 'rgba(0, 0, 255, 0.1)',  // Fundo azulado como solicitado
              cursor: 'move',
              border: '1px solid rgba(0, 0, 255, 0.3)'
            }}
            onMouseDown={(e) => handleStartDrag(e, 'label', 0, 20, 20)}
          >
            {/* Elementos dentro da etiqueta */}
            {formValues.campos.map((campo, index) => (
              <div
                key={`${campo.tipo}-${index}`}
                className={`etiqueta-element absolute ${selectedElement === campo.tipo ? 'selected' : ''}`}
                style={{
                  left: `${campo.x * zoom / 100}px`,
                  top: `${campo.y * zoom / 100}px`,
                  width: `${campo.largura * zoom / 100}px`,
                  height: `${campo.altura * zoom / 100}px`,
                  background: 'rgba(255, 255, 255, 0.8)',
                  border: selectedElement === campo.tipo 
                    ? '2px solid #4299e1' 
                    : '1px dashed rgba(0, 0, 0, 0.3)',
                  fontSize: `${campo.tamanhoFonte * zoom / 100}px`
                }}
                onClick={() => setSelectedElement(campo.tipo)}
                onMouseDown={(e) => handleStartDrag(e, 'element', campo.tipo, campo.x, campo.y)}
              >
                <div className="flex h-full w-full items-center justify-center truncate">
                  {campo.tipo === 'nome' 
                    ? 'Pingente Cristal' 
                    : campo.tipo === 'codigo' 
                      ? '123456789' 
                      : 'R$ 59,90'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Renderizar o painel lateral conforme a aba ativa
  const renderSidebar = () => {
    if (sidebarCollapsed) return null;

    switch (activeSidebarPanel) {
      case "elements":
        return (
          <div className="p-4 space-y-4 overflow-y-auto">
            <h3 className="text-sm font-medium">Elementos</h3>
            <div className="space-y-2">
              {elements.map((elem) => (
                <button
                  key={elem.id}
                  className={`w-full text-left p-2 rounded ${
                    selectedElement === elem.id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted'
                  }`}
                  onClick={() => {
                    setSelectedElement(elem.id);
                    
                    // Verificar se o elemento já existe
                    const campos = form.getValues('campos');
                    const existingIndex = campos.findIndex(c => c.tipo === elem.id);
                    
                    if (existingIndex === -1) {
                      // Adicionar novo elemento se não existir
                      const newCampo: CampoEtiqueta = {
                        tipo: elem.id as 'nome' | 'codigo' | 'preco',
                        x: 5,
                        y: 5,
                        largura: elem.defaultWidth,
                        altura: elem.defaultHeight,
                        tamanhoFonte: elem.defaultFontSize
                      };
                      form.setValue('campos', [...campos, newCampo]);
                    }
                  }}
                >
                  <div className="flex items-center">
                    <span className="flex-1">{elem.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {elem.defaultWidth}×{elem.defaultHeight}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      
      case "settings":
        return (
          <div className="p-4 space-y-4 overflow-y-auto">
            <h3 className="text-sm font-medium">Configurações</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="grid-toggle" className="text-xs">Mostrar Grade</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="grid-toggle"
                    checked={showGrid}
                    onCheckedChange={setShowGrid}
                  />
                  <span className="text-xs text-muted-foreground">
                    {showGrid ? "Ativado" : "Desativado"}
                  </span>
                </div>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="snap-toggle" className="text-xs">Alinhar à Grade</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="snap-toggle"
                    checked={snapToGrid}
                    onCheckedChange={setSnapToGrid}
                  />
                  <span className="text-xs text-muted-foreground">
                    {snapToGrid ? "Ativado" : "Desativado"}
                  </span>
                </div>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="grid-size" className="text-xs">Tamanho da Grade</Label>
                <Input
                  id="grid-size"
                  type="number"
                  value={gridSize}
                  min={1}
                  max={20}
                  onChange={(e) => setGridSize(parseInt(e.target.value) || 5)}
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Formato da Página</Label>
                <Select 
                  value={form.getValues('formatoPagina')}
                  onValueChange={(value) => {
                    form.setValue('formatoPagina', value);
                    
                    // Configurar valores padrão para os tamanhos de página
                    if (value === "A4") {
                      form.setValue('larguraPagina', 210);
                      form.setValue('alturaPagina', 297);
                    } else if (value === "A5") {
                      form.setValue('larguraPagina', 148);
                      form.setValue('alturaPagina', 210);
                    } else if (value === "Carta") {
                      form.setValue('larguraPagina', 216);
                      form.setValue('alturaPagina', 279);
                    }
                  }}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Selecione o formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4 (210×297mm)</SelectItem>
                    <SelectItem value="A5">A5 (148×210mm)</SelectItem>
                    <SelectItem value="Carta">Carta (216×279mm)</SelectItem>
                    <SelectItem value="Personalizado">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {form.getValues('formatoPagina') === "Personalizado" && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="page-width" className="text-xs">Largura (mm)</Label>
                    <Input
                      id="page-width"
                      type="number"
                      value={form.getValues('larguraPagina')}
                      min={50}
                      max={500}
                      onChange={(e) => form.setValue('larguraPagina', parseFloat(e.target.value) || 210)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="page-height" className="text-xs">Altura (mm)</Label>
                    <Input
                      id="page-height"
                      type="number"
                      value={form.getValues('alturaPagina')}
                      min={50}
                      max={500}
                      onChange={(e) => form.setValue('alturaPagina', parseFloat(e.target.value) || 297)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-1">
                <Label className="text-xs">Orientação</Label>
                <Select 
                  value={form.getValues('orientacao')}
                  onValueChange={(value) => form.setValue('orientacao', value)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Selecione a orientação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retrato">Retrato</SelectItem>
                    <SelectItem value="paisagem">Paisagem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      
      case "labels":
        return (
          <div className="p-4 space-y-4 overflow-y-auto">
            <h3 className="text-sm font-medium">Configurações da Etiqueta</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="label-width" className="text-xs">Largura (mm)</Label>
                  <Input
                    id="label-width"
                    type="number"
                    value={form.getValues('largura')}
                    min={10}
                    max={200}
                    onChange={(e) => form.setValue('largura', parseFloat(e.target.value) || 80)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="label-height" className="text-xs">Altura (mm)</Label>
                  <Input
                    id="label-height"
                    type="number"
                    value={form.getValues('altura')}
                    min={5}
                    max={100}
                    onChange={(e) => form.setValue('altura', parseFloat(e.target.value) || 30)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="margin-top" className="text-xs">Margem Superior (mm)</Label>
                  <Input
                    id="margin-top"
                    type="number"
                    value={form.getValues('margemSuperior')}
                    min={0}
                    max={50}
                    onChange={(e) => form.setValue('margemSuperior', parseFloat(e.target.value) || 10)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="margin-bottom" className="text-xs">Margem Inferior (mm)</Label>
                  <Input
                    id="margin-bottom"
                    type="number"
                    value={form.getValues('margemInferior')}
                    min={0}
                    max={50}
                    onChange={(e) => form.setValue('margemInferior', parseFloat(e.target.value) || 10)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="margin-left" className="text-xs">Margem Esquerda (mm)</Label>
                  <Input
                    id="margin-left"
                    type="number"
                    value={form.getValues('margemEsquerda')}
                    min={0}
                    max={50}
                    onChange={(e) => form.setValue('margemEsquerda', parseFloat(e.target.value) || 10)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="margin-right" className="text-xs">Margem Direita (mm)</Label>
                  <Input
                    id="margin-right"
                    type="number"
                    value={form.getValues('margemDireita')}
                    min={0}
                    max={50}
                    onChange={(e) => form.setValue('margemDireita', parseFloat(e.target.value) || 10)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="spacing-h" className="text-xs">Espaçamento H. (mm)</Label>
                  <Input
                    id="spacing-h"
                    type="number"
                    value={form.getValues('espacamentoHorizontal')}
                    min={0}
                    max={20}
                    onChange={(e) => form.setValue('espacamentoHorizontal', parseFloat(e.target.value) || 0)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="spacing-v" className="text-xs">Espaçamento V. (mm)</Label>
                  <Input
                    id="spacing-v"
                    type="number"
                    value={form.getValues('espacamentoVertical')}
                    min={0}
                    max={20}
                    onChange={(e) => form.setValue('espacamentoVertical', parseFloat(e.target.value) || 0)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              
              {pageAreaWarning && (
                <Alert variant="destructive" className="py-2 text-xs">
                  <AlertTitle className="text-xs">Problema nas dimensões</AlertTitle>
                  <AlertDescription className="text-xs">
                    {pageAreaWarning}
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={corrigirDimensoesAutomaticamente}
                      className="w-full mt-1 text-xs h-7"
                    >
                      Corrigir automaticamente
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  // Controles de zoom
  const ZoomControls = () => (
    <div className="zoom-controls">
      <Button
        variant="outline"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => setZoom(Math.max(25, zoom - 25))}
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <span className="zoom-level">{zoom}%</span>
      <Button
        variant="outline"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => setZoom(Math.min(500, zoom + 25))}
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
    </div>
  );

  // Componente principal
  return (
    <Form {...form}>
      <form onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit(onSubmit)(e);
      }}>
        <div className="bg-background rounded-lg shadow-lg w-full mx-auto overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b">
            <h2 className="text-lg font-semibold">
              {modelo?.id ? "Editar Modelo de Etiqueta" : "Criar Novo Modelo de Etiqueta"}
            </h2>
            <div className="flex items-center space-x-2">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem className="m-0">
                    <FormControl>
                      <Input {...field} placeholder="Nome do modelo" className="w-48 h-8 text-sm" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
                <span className="sr-only">Fechar</span>
              </Button>
            </div>
          </div>
          
          <div className="flex h-[calc(100vh-12rem)] max-h-[700px]">
            <div className={cn("border-r flex flex-col transition-all duration-200 ease-in-out", sidebarCollapsed ? "w-10" : "w-64")}>
              <div className="flex border-b p-1 items-center justify-between">
                {!sidebarCollapsed && (
                  <div className="flex space-x-1">
                    <Button 
                      variant={activeSidebarPanel === "elements" ? "default" : "ghost"} 
                      size="sm" 
                      className="h-8 px-2" 
                      onClick={() => setActiveSidebarPanel("elements")}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      <span className="text-xs">Elementos</span>
                    </Button>
                    <Button 
                      variant={activeSidebarPanel === "labels" ? "default" : "ghost"} 
                      size="sm" 
                      className="h-8 px-2" 
                      onClick={() => setActiveSidebarPanel("labels")}
                    >
                      <Layers className="h-4 w-4 mr-1" />
                      <span className="text-xs">Etiquetas</span>
                    </Button>
                    <Button 
                      variant={activeSidebarPanel === "settings" ? "default" : "ghost"} 
                      size="sm" 
                      className="h-8 px-2" 
                      onClick={() => setActiveSidebarPanel("settings")}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      <span className="text-xs">Config</span>
                    </Button>
                  </div>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0" 
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                >
                  {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
              </div>
              
              {renderSidebar()}
            </div>
            
            {renderEditor()}
            
            <ZoomControls />
          </div>
          
          <div className="flex justify-between p-3 border-t bg-muted/50">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancelar
              </Button>
              
              {modelo?.id && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={duplicarModelo}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Duplicar
                </Button>
              )}
            </div>
            
            <Button 
              size="sm"
              type="submit"
              disabled={isLoading || !!pageAreaWarning}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? "Salvando..." : (modelo?.id ? "Atualizar" : "Criar")}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
