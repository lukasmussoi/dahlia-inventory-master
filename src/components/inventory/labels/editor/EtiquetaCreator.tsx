
"use client"
import { useState, useRef, useEffect } from "react"
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
  ZoomOut,
  LayoutGrid,
  CheckSquare,
  Minus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export interface ElementType {
  id: string;
  name: string;
  defaultWidth: number;
  defaultHeight: number;
  defaultFontSize: number;
  defaultAlign?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fontSize?: number;
  align?: string;
}

export interface LabelElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  align: string;
}

export interface LabelType {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  elements: LabelElement[];
}

export interface EtiquetaCreatorProps {
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
}

export default function EtiquetaCreator({ onClose, onSave, initialData }: EtiquetaCreatorProps) {
  // Estado principal
  const [activeTab, setActiveTab] = useState("elementos")
  const [modelName, setModelName] = useState(initialData?.nome || "")
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [zoom, setZoom] = useState(150)
  const [showGrid, setShowGrid] = useState(true)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [gridSize, setGridSize] = useState(5)
  const [pageSize, setPageSize] = useState({ width: initialData?.larguraPagina || 210, height: initialData?.alturaPagina || 297 })
  const [pageFormat, setPageFormat] = useState(initialData?.formatoPagina || "A4")
  const [labelSize, setLabelSize] = useState({ 
    width: initialData?.largura || 80, 
    height: initialData?.altura || 40 
  })
  const [labels, setLabels] = useState<LabelType[]>([{ 
    id: 0, 
    x: 20, 
    y: 20, 
    width: initialData?.largura || 80,
    height: initialData?.altura || 40,
    elements: initialData?.campos?.map((campo: any, index: number) => ({
      id: `elemento-${campo.tipo}-${index}`,
      type: campo.tipo,
      x: campo.x,
      y: campo.y,
      width: campo.largura,
      height: campo.altura,
      fontSize: campo.tamanhoFonte,
      align: campo.alinhamento || "left"
    })) || []
  }])
  
  // Refs
  const editorRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef({ 
    isDragging: false, 
    type: null as any, 
    id: null as any, 
    startX: 0, 
    startY: 0, 
    offsetX: 0, 
    offsetY: 0 
  })
  
  // Elementos disponíveis
  const elements = [
    { 
      id: "nome", 
      name: "Nome do Produto", 
      defaultWidth: 60, 
      defaultHeight: 15, 
      defaultFontSize: 10, 
      defaultAlign: "left" 
    }, 
    { 
      id: "codigo", 
      name: "Código de Barras", 
      defaultWidth: 60, 
      defaultHeight: 15, 
      defaultFontSize: 8,
      defaultAlign: "left"
    }, 
    { 
      id: "preco", 
      name: "Preço", 
      defaultWidth: 40, 
      defaultHeight: 15, 
      defaultFontSize: 12, 
      defaultAlign: "center" 
    }
  ]
  
  // Quando a página carrega, definir o foco no input de nome
  useEffect(() => {
    const timer = setTimeout(() => {
      document.getElementById("model-name-input")?.focus();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Funções auxiliares
  const getSelectedElementDetails = () => {
    if (!selectedElement) return null;
    const label = labels[0]; // Sempre usamos apenas a primeira etiqueta no array
    return label.elements.find(e => e.id === selectedElement);
  }

  const handleStartDrag = (e: React.MouseEvent, type: "element", id: string, x: number, y: number) => {
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
  }

  const snapToGridValue = (value: number) => snapToGrid ? Math.round(value / gridSize) * gridSize : value;

  const handleDrag = (e: React.MouseEvent) => {
    if (!dragRef.current.isDragging || !editorRef.current) return;
    e.preventDefault();
    
    const rect = editorRef.current.getBoundingClientRect();
    const zoomFactor = zoom / 100;
    
    const x = snapToGridValue((e.clientX - rect.left - dragRef.current.offsetX) / zoomFactor);
    const y = snapToGridValue((e.clientY - rect.top - dragRef.current.offsetY) / zoomFactor);
    
    const updatedLabels = [...labels];
    const label = updatedLabels[0]; // Sempre usamos apenas a primeira etiqueta
    
    if (dragRef.current.type === "element") {
      const elementIndex = label.elements.findIndex(el => el.id === dragRef.current.id);
      if (elementIndex === -1) return;
      
      const element = label.elements[elementIndex];
      
      // Limitar o elemento dentro dos limites da etiqueta
      const newX = Math.max(0, Math.min(x, label.width - element.width));
      const newY = Math.max(0, Math.min(y, label.height - element.height));
      
      label.elements[elementIndex] = {
        ...element,
        x: newX,
        y: newY
      };
      
      setLabels(updatedLabels);
    }
  }

  const handleEndDrag = () => {
    dragRef.current.isDragging = false;
  }
  
  const handleAddElement = (elementType: string) => {
    // Verificar se o elemento já existe
    const elementExists = labels[0].elements.some(el => el.type === elementType);
    if (elementExists) {
      toast.error(`Este elemento já foi adicionado na etiqueta`);
      return;
    }
    
    const elementTemplate = elements.find(e => e.id === elementType);
    if (!elementTemplate) return;
    
    const newElement: LabelElement = {
      id: `elemento-${elementType}-${Date.now()}`,
      type: elementType,
      x: 10,
      y: 10,
      width: elementTemplate.defaultWidth,
      height: elementTemplate.defaultHeight,
      fontSize: elementTemplate.defaultFontSize,
      align: elementTemplate.defaultAlign || "left"
    };
    
    const updatedLabels = [...labels];
    updatedLabels[0].elements.push(newElement);
    setLabels(updatedLabels);
    setSelectedElement(newElement.id);
    
    toast.success(`${elementTemplate.name} adicionado`);
  }
  
  const handleDeleteElement = () => {
    if (!selectedElement) return;
    
    const updatedLabels = [...labels];
    const label = updatedLabels[0];
    
    const elementIndex = label.elements.findIndex(el => el.id === selectedElement);
    if (elementIndex === -1) return;
    
    label.elements.splice(elementIndex, 1);
    setLabels(updatedLabels);
    setSelectedElement(null);
    
    toast.success(`Elemento removido`);
  }
  
  const handleUpdateElement = (property: string, value: any) => {
    if (!selectedElement) return;
    
    const updatedLabels = [...labels];
    const label = updatedLabels[0];
    
    const elementIndex = label.elements.findIndex(el => el.id === selectedElement);
    if (elementIndex === -1) return;
    
    // Garantir que os valores estão dentro dos limites
    if (property === 'x' || property === 'y' || property === 'width' || property === 'height') {
      value = Number(value);
      
      // Limites para x e width
      if (property === 'x') {
        value = Math.max(0, Math.min(value, label.width - label.elements[elementIndex].width));
      }
      else if (property === 'width') {
        value = Math.max(10, Math.min(value, label.width - label.elements[elementIndex].x));
      }
      
      // Limites para y e height
      if (property === 'y') {
        value = Math.max(0, Math.min(value, label.height - label.elements[elementIndex].height));
      }
      else if (property === 'height') {
        value = Math.max(5, Math.min(value, label.height - label.elements[elementIndex].y));
      }
    }
    
    if (property === 'fontSize') {
      value = Math.max(6, Math.min(24, Number(value)));
    }
    
    label.elements[elementIndex] = {
      ...label.elements[elementIndex],
      [property]: value
    };
    
    setLabels(updatedLabels);
  }
  
  const handleUpdatePageFormat = (value: string) => {
    setPageFormat(value);
    
    if (value === "A4") {
      setPageSize({ width: 210, height: 297 });
    } else if (value === "A5") {
      setPageSize({ width: 148, height: 210 });
    } else if (value === "Letter") {
      setPageSize({ width: 216, height: 279 });
    }
    // Outros formatos podem ser adicionados conforme necessário
  }
  
  const handleUpdateLabelSize = (dimension: "width" | "height", value: number) => {
    // Validar que o tamanho da etiqueta não seja maior que a página
    value = Math.max(10, Math.min(value, dimension === "width" ? pageSize.width : pageSize.height));
    
    const newLabelSize = { ...labelSize, [dimension]: value };
    setLabelSize(newLabelSize);
    
    // Atualizar também o tamanho da etiqueta no array
    const updatedLabels = [...labels];
    updatedLabels[0] = {
      ...updatedLabels[0],
      [dimension]: value
    };
    
    // Verificar se algum elemento está fora dos limites e ajustar se necessário
    updatedLabels[0].elements = updatedLabels[0].elements.map(element => {
      let updatedElement = { ...element };
      
      if (dimension === "width" && element.x + element.width > value) {
        if (element.x < value) {
          // Elemento está parcialmente dentro, ajustar apenas a largura
          updatedElement.width = value - element.x;
        } else {
          // Elemento está totalmente fora, reposicionar
          updatedElement.x = Math.max(0, value - element.width);
        }
      }
      
      if (dimension === "height" && element.y + element.height > value) {
        if (element.y < value) {
          // Elemento está parcialmente dentro, ajustar apenas a altura
          updatedElement.height = value - element.y;
        } else {
          // Elemento está totalmente fora, reposicionar
          updatedElement.y = Math.max(0, value - element.height);
        }
      }
      
      return updatedElement;
    });
    
    setLabels(updatedLabels);
  }
  
  const handleSave = () => {
    if (!modelName.trim()) {
      toast.error("Por favor, informe um nome para o modelo");
      document.getElementById("model-name-input")?.focus();
      return;
    }
    
    if (labels[0].elements.length === 0) {
      toast.error("Por favor, adicione pelo menos um elemento à etiqueta");
      return;
    }
    
    // Mapear para o formato esperado pelo backend
    const modelData = {
      nome: modelName,
      descricao: modelName,
      campos: labels[0].elements.map(el => ({
        tipo: el.type,
        x: el.x,
        y: el.y,
        largura: el.width,
        altura: el.height,
        tamanhoFonte: el.fontSize,
        alinhamento: el.align
      })),
      largura: labelSize.width,
      altura: labelSize.height,
      formatoPagina: pageFormat,
      orientacao: "retrato", // Pode ser dinâmico no futuro
      margemSuperior: 10,
      margemInferior: 10,
      margemEsquerda: 10,
      margemDireita: 10,
      espacamentoHorizontal: 2,
      espacamentoVertical: 2,
      larguraPagina: pageSize.width,
      alturaPagina: pageSize.height
    };
    
    onSave(modelData);
  }
  
  const getElementName = (type: string) => {
    switch (type) {
      case "nome": return "Nome do Produto";
      case "codigo": return "Código de Barras";
      case "preco": return "Preço";
      default: return type;
    }
  }
  
  const getElementPreview = (type: string) => {
    switch (type) {
      case "nome": return "Pingente Cristal";
      case "codigo": return "123456789";
      case "preco": return "R$ 99,90";
      default: return "Elemento";
    }
  }
  
  const handleOptimizeLayout = () => {
    // Implementação básica de otimização: centralizar todos os elementos
    const updatedLabels = [...labels];
    const label = updatedLabels[0];
    
    // Organizar elementos em uma grade lógica
    const totalElements = label.elements.length;
    if (totalElements === 0) return;
    
    if (totalElements === 1) {
      // Centralizar o único elemento
      const element = label.elements[0];
      element.x = Math.floor((label.width - element.width) / 2);
      element.y = Math.floor((label.height - element.height) / 2);
    } else if (totalElements === 2) {
      // Organizar dois elementos um acima do outro
      const gap = 5;
      const totalHeight = label.elements.reduce((sum, el) => sum + el.height, 0) + gap;
      let currentY = Math.floor((label.height - totalHeight) / 2);
      
      for (let element of label.elements) {
        element.x = Math.floor((label.width - element.width) / 2);
        element.y = currentY;
        currentY += element.height + gap;
      }
    } else if (totalElements === 3) {
      // Organizar três elementos em uma configuração adequada
      const nomeElement = label.elements.find(el => el.type === "nome");
      const codigoElement = label.elements.find(el => el.type === "codigo");
      const precoElement = label.elements.find(el => el.type === "preco");
      
      if (nomeElement && codigoElement && precoElement) {
        // Nome no topo
        nomeElement.x = Math.floor((label.width - nomeElement.width) / 2);
        nomeElement.y = 2;
        
        // Código no meio
        codigoElement.x = Math.floor((label.width - codigoElement.width) / 2);
        codigoElement.y = nomeElement.y + nomeElement.height + 2;
        
        // Preço na parte inferior
        precoElement.x = Math.floor((label.width - precoElement.width) / 2);
        precoElement.y = codigoElement.y + codigoElement.height + 2;
      }
    }
    
    setLabels(updatedLabels);
    toast.success("Layout otimizado!");
  }
  
  const handleSetAlignment = (alignment: string) => {
    if (!selectedElement) return;
    handleUpdateElement('align', alignment);
  }
  
  return (
    <div className="bg-background rounded-lg shadow-lg w-full max-w-5xl mx-auto overflow-hidden">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between p-3 border-b">
        <h2 className="text-lg font-semibold">Criar Novo Modelo de Etiqueta</h2>
        <div className="flex items-center space-x-2">
          <Input 
            id="model-name-input"
            placeholder="Nome do modelo" 
            className="w-48 h-8 text-sm" 
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
          />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar</span>
          </Button>
        </div>
      </div>
      
      {/* Conteúdo principal */}
      <div className="flex h-[calc(100vh-8rem)] max-h-[700px]">
        {/* Barra lateral */}
        <div className="border-r w-64 flex flex-col">
          {/* Navegação da barra lateral */}
          <div className="flex border-b p-1 items-center justify-between">
            <div className="flex space-x-1">
              <Button 
                variant={activeTab === "elementos" ? "default" : "ghost"} 
                size="sm" 
                className="h-8 px-2" 
                onClick={() => setActiveTab("elementos")}
              >
                <Plus className="h-4 w-4 mr-1" />
                <span className="text-xs">Elementos</span>
              </Button>
              <Button 
                variant={activeTab === "pagina" ? "default" : "ghost"} 
                size="sm" 
                className="h-8 px-2" 
                onClick={() => setActiveTab("pagina")}
              >
                <Copy className="h-4 w-4 mr-1" />
                <span className="text-xs">Página</span>
              </Button>
              <Button 
                variant={activeTab === "config" ? "default" : "ghost"} 
                size="sm" 
                className="h-8 px-2" 
                onClick={() => setActiveTab("config")}
              >
                <Settings className="h-4 w-4 mr-1" />
                <span className="text-xs">Config</span>
              </Button>
            </div>
          </div>
          
          {/* Conteúdo da barra lateral */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "elementos" && (
              <div className="space-y-4">
                <h3 className="font-medium text-sm">Adicionar Elementos</h3>
                <div className="space-y-2">
                  {elements.map((element) => {
                    // Verificar se este elemento já foi adicionado
                    const isAdded = labels[0].elements.some(el => el.type === element.id);
                    
                    return (
                      <div 
                        key={element.id}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <span>{element.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleAddElement(element.id)}
                          disabled={isAdded}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
                
                {selectedElement && (
                  <>
                    <div className="pt-4 border-t mt-4">
                      <h3 className="font-medium text-sm mb-2">Propriedades</h3>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label htmlFor="element-x" className="text-xs">X (mm)</Label>
                            <Input
                              id="element-x"
                              type="number"
                              className="h-8"
                              value={getSelectedElementDetails()?.x || 0}
                              onChange={(e) => handleUpdateElement('x', Number(e.target.value))}
                              min={0}
                              max={labels[0].width}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="element-y" className="text-xs">Y (mm)</Label>
                            <Input
                              id="element-y"
                              type="number"
                              className="h-8"
                              value={getSelectedElementDetails()?.y || 0}
                              onChange={(e) => handleUpdateElement('y', Number(e.target.value))}
                              min={0}
                              max={labels[0].height}
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label htmlFor="element-width" className="text-xs">Largura</Label>
                            <Input
                              id="element-width"
                              type="number"
                              className="h-8"
                              value={getSelectedElementDetails()?.width || 0}
                              onChange={(e) => handleUpdateElement('width', Number(e.target.value))}
                              min={10}
                              max={labels[0].width}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="element-height" className="text-xs">Altura</Label>
                            <Input
                              id="element-height"
                              type="number"
                              className="h-8"
                              value={getSelectedElementDetails()?.height || 0}
                              onChange={(e) => handleUpdateElement('height', Number(e.target.value))}
                              min={5}
                              max={labels[0].height}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <Label htmlFor="element-font-size" className="text-xs">Fonte (pt)</Label>
                          <Input
                            id="element-font-size"
                            type="number"
                            className="h-8"
                            value={getSelectedElementDetails()?.fontSize || 10}
                            onChange={(e) => handleUpdateElement('fontSize', Number(e.target.value))}
                            min={6}
                            max={24}
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <Label className="text-xs">Alinhamento</Label>
                          <div className="flex space-x-1">
                            <Button 
                              variant={getSelectedElementDetails()?.align === "left" ? "default" : "outline"}
                              size="sm"
                              className="flex-1 h-9"
                              onClick={() => handleSetAlignment("left")}
                            >
                              <AlignLeft className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant={getSelectedElementDetails()?.align === "center" ? "default" : "outline"}
                              size="sm"
                              className="flex-1 h-9"
                              onClick={() => handleSetAlignment("center")}
                            >
                              <AlignCenter className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant={getSelectedElementDetails()?.align === "right" ? "default" : "outline"}
                              size="sm"
                              className="flex-1 h-9"
                              onClick={() => handleSetAlignment("right")}
                            >
                              <AlignRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex justify-between pt-2">
                          <div className="text-xs text-muted-foreground">
                            {getElementName(getSelectedElementDetails()?.type || "")}
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-7"
                            onClick={handleDeleteElement}
                          >
                            <Trash className="h-3.5 w-3.5 mr-1" />
                            <span className="text-xs">Remover</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            
            {activeTab === "pagina" && (
              <div className="space-y-4">
                <h3 className="font-medium text-sm">Tamanho da Página</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="page-width" className="text-xs">Largura (mm)</Label>
                    <Input
                      id="page-width"
                      type="number"
                      className="h-8"
                      value={pageSize.width}
                      onChange={(e) => setPageSize({...pageSize, width: Number(e.target.value)})}
                      min={100}
                      max={500}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="page-height" className="text-xs">Altura (mm)</Label>
                    <Input
                      id="page-height"
                      type="number"
                      className="h-8"
                      value={pageSize.height}
                      onChange={(e) => setPageSize({...pageSize, height: Number(e.target.value)})}
                      min={100}
                      max={500}
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="page-format" className="text-xs">Modelo de Página</Label>
                  <Select
                    value={pageFormat}
                    onValueChange={handleUpdatePageFormat}
                  >
                    <SelectTrigger id="page-format" className="h-8">
                      <SelectValue placeholder="Selecione o formato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4">A4 (210 × 297 mm)</SelectItem>
                      <SelectItem value="A5">A5 (148 × 210 mm)</SelectItem>
                      <SelectItem value="Letter">Letter (216 × 279 mm)</SelectItem>
                      <SelectItem value="Personalizado">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="pt-4 border-t mt-4">
                  <h3 className="font-medium text-sm mb-2">Tamanho da Etiqueta</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="label-width" className="text-xs">Largura (mm)</Label>
                      <Input
                        id="label-width"
                        type="number"
                        className="h-8"
                        value={labelSize.width}
                        onChange={(e) => handleUpdateLabelSize("width", Number(e.target.value))}
                        min={10}
                        max={pageSize.width}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="label-height" className="text-xs">Altura (mm)</Label>
                      <Input
                        id="label-height"
                        type="number"
                        className="h-8"
                        value={labelSize.height}
                        onChange={(e) => handleUpdateLabelSize("height", Number(e.target.value))}
                        min={10}
                        max={pageSize.height}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 mt-2">
                  <Button 
                    variant="secondary"
                    className="w-full"
                    onClick={handleOptimizeLayout}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Otimizar Layout
                  </Button>
                </div>
              </div>
            )}
            
            {activeTab === "config" && (
              <div className="space-y-4">
                <h3 className="font-medium text-sm">Grade e Alinhamento</h3>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-grid" className="text-sm cursor-pointer">Mostrar Grade</Label>
                  <Button
                    variant={showGrid ? "default" : "outline"}
                    size="sm"
                    className="h-7"
                    onClick={() => setShowGrid(!showGrid)}
                  >
                    <Grid className="h-4 w-4 mr-1" />
                    <span className="text-xs">{showGrid ? "Ocultar" : "Mostrar"}</span>
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="snap-to-grid" className="text-sm cursor-pointer">Snap to Grid</Label>
                  <Button
                    variant={snapToGrid ? "default" : "outline"}
                    size="sm"
                    className="h-7"
                    onClick={() => setSnapToGrid(!snapToGrid)}
                  >
                    <CheckSquare className="h-4 w-4 mr-1" />
                    <span className="text-xs">{snapToGrid ? "Desativar" : "Ativar"}</span>
                  </Button>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="grid-size" className="text-xs">Tamanho da Grade (mm)</Label>
                  <Select
                    value={String(gridSize)}
                    onValueChange={(value) => setGridSize(Number(value))}
                  >
                    <SelectTrigger id="grid-size" className="h-8">
                      <SelectValue placeholder="Selecione o tamanho" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 mm</SelectItem>
                      <SelectItem value="2">2 mm</SelectItem>
                      <SelectItem value="5">5 mm</SelectItem>
                      <SelectItem value="10">10 mm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="pt-4 border-t mt-4">
                  <h3 className="font-medium text-sm mb-2">Zoom</h3>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setZoom(Math.max(50, zoom - 25))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    
                    <Select
                      value={String(zoom)}
                      onValueChange={(value) => setZoom(Number(value))}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder={`${zoom}%`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="50">50%</SelectItem>
                        <SelectItem value="75">75%</SelectItem>
                        <SelectItem value="100">100%</SelectItem>
                        <SelectItem value="150">150%</SelectItem>
                        <SelectItem value="200">200%</SelectItem>
                        <SelectItem value="300">300%</SelectItem>
                        <SelectItem value="500">500%</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setZoom(Math.min(500, zoom + 25))}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Área principal de edição */}
        <div className="flex-1 p-4 relative overflow-hidden" ref={editorRef}>
          <div className="overflow-auto h-full" onMouseMove={handleDrag} onMouseUp={handleEndDrag} onMouseLeave={handleEndDrag}>
            {/* Container da página */}
            <div 
              className="relative mx-auto bg-yellow-50/80 border border-yellow-200 shadow-md"
              style={{
                width: `${pageSize.width * zoom / 100}px`,
                height: `${pageSize.height * zoom / 100}px`,
              }}
            >
              {/* Etiqueta */}
              <div 
                className={cn(
                  "absolute border-2 border-blue-400 bg-blue-50/50", 
                  showGrid && "etiqueta-grid"
                )}
                style={{
                  left: `${labels[0].x * zoom / 100}px`,
                  top: `${labels[0].y * zoom / 100}px`,
                  width: `${labels[0].width * zoom / 100}px`,
                  height: `${labels[0].height * zoom / 100}px`,
                  backgroundSize: `${gridSize * zoom / 100}px ${gridSize * zoom / 100}px`
                }}
                onClick={() => setSelectedElement(null)}
              >
                {/* Elementos dentro da etiqueta */}
                {labels[0].elements.map((element) => (
                  <div
                    key={element.id}
                    className={cn(
                      "absolute border cursor-move transition-all",
                      selectedElement === element.id 
                        ? "border-blue-500 bg-blue-100/70" 
                        : "border-dashed border-gray-400 bg-white/70 hover:border-blue-300 hover:bg-blue-50/50"
                    )}
                    style={{
                      left: `${element.x * zoom / 100}px`,
                      top: `${element.y * zoom / 100}px`,
                      width: `${element.width * zoom / 100}px`,
                      height: `${element.height * zoom / 100}px`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedElement(element.id);
                    }}
                    onMouseDown={(e) => handleStartDrag(e, "element", element.id, element.x, element.y)}
                  >
                    <div 
                      className="w-full h-full flex items-center overflow-hidden p-1"
                      style={{
                        fontSize: `${element.fontSize * zoom / 100}px`,
                        textAlign: element.align as any
                      }}
                    >
                      {getElementPreview(element.type)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Controle de zoom flutuante */}
          <div className="absolute bottom-4 right-4 flex items-center space-x-1 bg-white/90 rounded-md p-1 shadow-md border">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setZoom(Math.max(50, zoom - 25))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium px-2">{zoom}%</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setZoom(Math.min(500, zoom + 25))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Rodapé */}
      <div className="flex items-center justify-between p-3 border-t bg-muted/50">
        <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
        <Button 
          size="sm" 
          onClick={handleSave}
          disabled={!modelName.trim() || labels[0].elements.length === 0}
        >
          <Save className="h-4 w-4 mr-2" />
          Criar
        </Button>
      </div>
    </div>
  )
}
