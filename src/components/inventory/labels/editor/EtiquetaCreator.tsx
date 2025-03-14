
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
  Minus,
  FileText
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
import "@/styles/etiqueta-editor.css"

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
  name: string;
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
  const [nextLabelId, setNextLabelId] = useState(1)
  const [selectedLabelId, setSelectedLabelId] = useState<number | null>(0)
  const [labels, setLabels] = useState<LabelType[]>([{ 
    id: 0, 
    name: "Etiqueta 1",
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
  const getSelectedLabel = () => {
    if (selectedLabelId === null) return null;
    return labels.find(label => label.id === selectedLabelId) || null;
  }

  const getSelectedElementDetails = () => {
    if (!selectedElement || selectedLabelId === null) return null;
    const label = labels.find(l => l.id === selectedLabelId);
    if (!label) return null;
    return label.elements.find(e => e.id === selectedElement);
  }

  const handleStartDrag = (e: React.MouseEvent, type: "element" | "label", id: string | number, x: number, y: number) => {
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
    
    if (dragRef.current.type === "element") {
      const labelIndex = updatedLabels.findIndex(l => l.id === selectedLabelId);
      if (labelIndex === -1) return;
      
      const label = updatedLabels[labelIndex];
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
    } else if (dragRef.current.type === "label") {
      const labelIndex = updatedLabels.findIndex(l => l.id === dragRef.current.id);
      if (labelIndex === -1) return;
      
      // Limitar a etiqueta dentro dos limites da página
      const label = updatedLabels[labelIndex];
      const newX = Math.max(0, Math.min(x, pageSize.width - label.width));
      const newY = Math.max(0, Math.min(y, pageSize.height - label.height));
      
      updatedLabels[labelIndex] = {
        ...label,
        x: newX,
        y: newY
      };
    }
    
    setLabels(updatedLabels);
  }

  const handleEndDrag = () => {
    dragRef.current.isDragging = false;
  }
  
  const handleAddElement = (elementType: string) => {
    if (selectedLabelId === null) {
      toast.error("Selecione uma etiqueta primeiro");
      return;
    }
    
    const labelIndex = labels.findIndex(l => l.id === selectedLabelId);
    if (labelIndex === -1) return;
    
    // Verificar se o elemento já existe
    const elementExists = labels[labelIndex].elements.some(el => el.type === elementType);
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
    updatedLabels[labelIndex].elements.push(newElement);
    setLabels(updatedLabels);
    setSelectedElement(newElement.id);
    
    toast.success(`${elementTemplate.name} adicionado`);
  }
  
  const handleDeleteElement = () => {
    if (!selectedElement || selectedLabelId === null) return;
    
    const updatedLabels = [...labels];
    const labelIndex = updatedLabels.findIndex(l => l.id === selectedLabelId);
    if (labelIndex === -1) return;
    
    const elementIndex = updatedLabels[labelIndex].elements.findIndex(el => el.id === selectedElement);
    if (elementIndex === -1) return;
    
    updatedLabels[labelIndex].elements.splice(elementIndex, 1);
    setLabels(updatedLabels);
    setSelectedElement(null);
    
    toast.success(`Elemento removido`);
  }
  
  const handleUpdateElement = (property: string, value: any) => {
    if (!selectedElement || selectedLabelId === null) return;
    
    const updatedLabels = [...labels];
    const labelIndex = updatedLabels.findIndex(l => l.id === selectedLabelId);
    if (labelIndex === -1) return;
    
    const label = updatedLabels[labelIndex];
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
    if (selectedLabelId === null) return;
    
    // Validar que o tamanho da etiqueta não seja maior que a página
    value = Math.max(10, Math.min(value, dimension === "width" ? pageSize.width : pageSize.height));
    
    const newLabelSize = { ...labelSize, [dimension]: value };
    setLabelSize(newLabelSize);
    
    // Atualizar também o tamanho da etiqueta selecionada no array
    const updatedLabels = [...labels];
    const labelIndex = updatedLabels.findIndex(l => l.id === selectedLabelId);
    if (labelIndex === -1) return;
    
    updatedLabels[labelIndex] = {
      ...updatedLabels[labelIndex],
      [dimension]: value
    };
    
    // Verificar se algum elemento está fora dos limites e ajustar se necessário
    updatedLabels[labelIndex].elements = updatedLabels[labelIndex].elements.map(element => {
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
  
  const handleAddLabel = () => {
    const newLabelId = nextLabelId;
    setNextLabelId(prevId => prevId + 1);
    
    // Criar uma nova etiqueta com base na configuração atual
    const newLabel: LabelType = {
      id: newLabelId,
      name: `Etiqueta ${newLabelId + 1}`,
      x: 20,
      y: 20 + (labels.length * 10), // Posicionar abaixo das etiquetas existentes
      width: labelSize.width,
      height: labelSize.height,
      elements: [] // Começar sem elementos
    };
    
    setLabels(prevLabels => [...prevLabels, newLabel]);
    setSelectedLabelId(newLabelId); // Selecionar a nova etiqueta
    setSelectedElement(null); // Limpar seleção de elemento
    
    toast.success(`Nova etiqueta adicionada`);
  }
  
  const handleDuplicateLabel = (labelId: number) => {
    const labelToDuplicate = labels.find(l => l.id === labelId);
    if (!labelToDuplicate) return;
    
    const newLabelId = nextLabelId;
    setNextLabelId(prevId => prevId + 1);
    
    // Criar uma cópia da etiqueta
    const newLabel: LabelType = {
      ...labelToDuplicate,
      id: newLabelId,
      name: `${labelToDuplicate.name} (Cópia)`,
      x: labelToDuplicate.x + 10, // Posicionar ligeiramente deslocada
      y: labelToDuplicate.y + 10,
      // Copiar todos os elementos da etiqueta
      elements: labelToDuplicate.elements.map(element => ({
        ...element,
        id: `${element.id}-copy-${Date.now()}`
      }))
    };
    
    setLabels(prevLabels => [...prevLabels, newLabel]);
    setSelectedLabelId(newLabelId); // Selecionar a nova etiqueta
    setSelectedElement(null); // Limpar seleção de elemento
    
    toast.success(`Etiqueta duplicada`);
  }
  
  const handleDeleteLabel = (labelId: number) => {
    // Impedir que todas as etiquetas sejam excluídas
    if (labels.length === 1) {
      toast.error("Deve haver pelo menos uma etiqueta");
      return;
    }
    
    setLabels(prevLabels => prevLabels.filter(l => l.id !== labelId));
    
    // Se a etiqueta excluída era a selecionada, selecionar a primeira etiqueta restante
    if (selectedLabelId === labelId) {
      const remainingLabels = labels.filter(l => l.id !== labelId);
      setSelectedLabelId(remainingLabels[0]?.id || null);
      setSelectedElement(null);
    }
    
    toast.success(`Etiqueta removida`);
  }
  
  const handleUpdateLabelName = (labelId: number, name: string) => {
    setLabels(prevLabels => 
      prevLabels.map(label => 
        label.id === labelId ? { ...label, name } : label
      )
    );
  }
  
  const handleSave = () => {
    if (!modelName.trim()) {
      toast.error("Por favor, informe um nome para o modelo");
      document.getElementById("model-name-input")?.focus();
      return;
    }
    
    // Verificar se existe ao menos uma etiqueta
    if (labels.length === 0) {
      toast.error("Por favor, adicione pelo menos uma etiqueta");
      return;
    }
    
    // Verificar se todas as etiquetas têm pelo menos um elemento
    const emptyLabels = labels.filter(label => label.elements.length === 0);
    if (emptyLabels.length > 0) {
      toast.error(`A etiqueta "${emptyLabels[0].name}" não possui elementos. Adicione pelo menos um elemento em cada etiqueta.`);
      setSelectedLabelId(emptyLabels[0].id);
      return;
    }
    
    // Se tiver múltiplas etiquetas, usar a primeira como referência principal
    const primaryLabel = labels[0];
    
    // Mapear para o formato esperado pelo backend
    const modelData = {
      nome: modelName,
      descricao: modelName,
      campos: primaryLabel.elements.map(el => ({
        tipo: el.type,
        x: el.x,
        y: el.y,
        largura: el.width,
        altura: el.height,
        tamanhoFonte: el.fontSize,
        alinhamento: el.align
      })),
      largura: primaryLabel.width,
      altura: primaryLabel.height,
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
    if (selectedLabelId === null) return;
    
    // Implementação básica de otimização: centralizar todos os elementos
    const updatedLabels = [...labels];
    const labelIndex = updatedLabels.findIndex(l => l.id === selectedLabelId);
    if (labelIndex === -1) return;
    
    const label = updatedLabels[labelIndex];
    
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
      
      {/* Toolbar */}
      <div className="flex items-center border-b p-2 gap-2 bg-muted/30">
        <Button 
          variant={activeTab === "elementos" ? "default" : "outline"} 
          size="sm" 
          className="h-8 px-3" 
          onClick={() => setActiveTab("elementos")}
        >
          <Plus className="h-4 w-4 mr-1" />
          <span className="text-xs">Elementos</span>
        </Button>
        
        <Button 
          variant={activeTab === "etiquetas" ? "default" : "outline"} 
          size="sm" 
          className="h-8 px-3" 
          onClick={() => setActiveTab("etiquetas")}
        >
          <Layers className="h-4 w-4 mr-1" />
          <span className="text-xs">Etiquetas</span>
        </Button>
        
        <Button 
          variant={activeTab === "config" ? "default" : "outline"} 
          size="sm" 
          className="h-8 px-3" 
          onClick={() => setActiveTab("config")}
        >
          <Settings className="h-4 w-4 mr-1" />
          <span className="text-xs">Config</span>
        </Button>
        
        <div className="ml-auto flex items-center gap-2">
          <Select
            value={String(zoom)}
            onValueChange={(value) => setZoom(Number(value))}
          >
            <SelectTrigger className="h-8 w-20">
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
            variant={showGrid ? "default" : "outline"}
            size="sm"
            className="h-8 px-3"
            onClick={() => setShowGrid(!showGrid)}
          >
            <Grid className="h-4 w-4 mr-1" />
            <span className="text-xs">Grade</span>
          </Button>
          
          <Button
            variant={snapToGrid ? "default" : "outline"}
            size="sm"
            className="h-8 px-3"
            onClick={() => setSnapToGrid(!snapToGrid)}
          >
            <CheckSquare className="h-4 w-4 mr-1" />
            <span className="text-xs">Snap</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3"
            onClick={() => setActiveTab("preview")}
          >
            <FileText className="h-4 w-4 mr-1" />
            <span className="text-xs">Pré-visualizar</span>
          </Button>
        </div>
      </div>
      
      {/* Conteúdo principal */}
      <div className="flex etiqueta-content">
        {/* Barra lateral */}
        <div className="border-r w-64 flex flex-col">
          {/* Conteúdo da barra lateral */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "elementos" && (
              <div className="space-y-4">
                <h3 className="font-medium text-sm">Adicionar Elementos</h3>
                <div className="space-y-2">
                  {elements.map((element) => {
                    const selectedLabel = getSelectedLabel();
                    // Verificar se este elemento já foi adicionado na etiqueta selecionada
                    const isAdded = selectedLabel?.elements.some(el => el.type === element.id) || false;
                    
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
                          disabled={isAdded || selectedLabelId === null}
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
                              max={getSelectedLabel()?.width || 0}
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
                              max={getSelectedLabel()?.height || 0}
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
                              max={getSelectedLabel()?.width || 0}
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
                              max={getSelectedLabel()?.height || 0}
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
                        
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full"
                          onClick={handleDeleteElement}
                        >
                          <Trash className="h-4 w-4 mr-1" />
                          <span className="text-xs">Remover Elemento</span>
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            
            {activeTab === "etiquetas" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">Etiquetas</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2"
                    onClick={handleAddLabel}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    <span className="text-xs">Nova</span>
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {labels.map((label) => (
                    <div 
                      key={label.id}
                      className={cn(
                        "flex items-center justify-between p-2 border rounded cursor-pointer",
                        selectedLabelId === label.id ? "border-primary bg-primary/10" : "hover:bg-muted/50"
                      )}
                      onClick={() => {
                        setSelectedLabelId(label.id);
                        setSelectedElement(null);
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-primary/20 border border-primary/30 rounded-sm flex-shrink-0"></div>
                        <span className="text-sm truncate">{label.name}</span>
                      </div>
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateLabel(label.id);
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLabel(label.id);
                          }}
                          disabled={labels.length <= 1}
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {selectedLabelId !== null && (
                  <div className="pt-4 border-t mt-4">
                    <h3 className="font-medium text-sm mb-2">Propriedades da Etiqueta</h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <Label htmlFor="label-name" className="text-xs">Nome</Label>
                        <Input
                          id="label-name"
                          className="h-8"
                          value={getSelectedLabel()?.name || ""}
                          onChange={(e) => handleUpdateLabelName(selectedLabelId, e.target.value)}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor="label-x" className="text-xs">X (mm)</Label>
                          <Input
                            id="label-x"
                            type="number"
                            className="h-8"
                            value={getSelectedLabel()?.x || 0}
                            onChange={(e) => {
                              const updatedLabels = [...labels];
                              const labelIndex = updatedLabels.findIndex(l => l.id === selectedLabelId);
                              if (labelIndex === -1) return;
                              
                              updatedLabels[labelIndex] = {
                                ...updatedLabels[labelIndex],
                                x: Math.max(0, Math.min(Number(e.target.value), pageSize.width - updatedLabels[labelIndex].width))
                              };
                              
                              setLabels(updatedLabels);
                            }}
                            min={0}
                            max={pageSize.width - (getSelectedLabel()?.width || 0)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="label-y" className="text-xs">Y (mm)</Label>
                          <Input
                            id="label-y"
                            type="number"
                            className="h-8"
                            value={getSelectedLabel()?.y || 0}
                            onChange={(e) => {
                              const updatedLabels = [...labels];
                              const labelIndex = updatedLabels.findIndex(l => l.id === selectedLabelId);
                              if (labelIndex === -1) return;
                              
                              updatedLabels[labelIndex] = {
                                ...updatedLabels[labelIndex],
                                y: Math.max(0, Math.min(Number(e.target.value), pageSize.height - updatedLabels[labelIndex].height))
                              };
                              
                              setLabels(updatedLabels);
                            }}
                            min={0}
                            max={pageSize.height - (getSelectedLabel()?.height || 0)}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor="label-width" className="text-xs">Largura (mm)</Label>
                          <Input
                            id="label-width"
                            type="number"
                            className="h-8"
                            value={getSelectedLabel()?.width || 0}
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
                            value={getSelectedLabel()?.height || 0}
                            onChange={(e) => handleUpdateLabelSize("height", Number(e.target.value))}
                            min={10}
                            max={pageSize.height}
                          />
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={handleOptimizeLayout}
                      >
                        <LayoutGrid className="h-4 w-4 mr-1" />
                        <span className="text-xs">Otimizar Layout</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === "config" && (
              <div className="space-y-4">
                <h3 className="font-medium text-sm">Configurações da Página</h3>
                
                <div className="space-y-1">
                  <Label htmlFor="page-format" className="text-xs">Formato</Label>
                  <Select
                    value={pageFormat}
                    onValueChange={handleUpdatePageFormat}
                  >
                    <SelectTrigger id="page-format" className="h-8">
                      <SelectValue placeholder="Selecione o formato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4">A4 (210 x 297 mm)</SelectItem>
                      <SelectItem value="A5">A5 (148 x 210 mm)</SelectItem>
                      <SelectItem value="Letter">Carta (216 x 279 mm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="page-width" className="text-xs">Largura (mm)</Label>
                    <Input
                      id="page-width"
                      type="number"
                      className="h-8"
                      value={pageSize.width}
                      onChange={(e) => setPageSize({ ...pageSize, width: Number(e.target.value) })}
                      min={50}
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
                      onChange={(e) => setPageSize({ ...pageSize, height: Number(e.target.value) })}
                      min={50}
                      max={800}
                    />
                  </div>
                </div>
                
                <div className="space-y-1 pt-4 border-t mt-4">
                  <Label htmlFor="grid-size" className="text-xs">Tamanho da Grade (mm)</Label>
                  <Input
                    id="grid-size"
                    type="number"
                    className="h-8"
                    value={gridSize}
                    onChange={(e) => setGridSize(Number(e.target.value))}
                    min={1}
                    max={20}
                  />
                </div>
              </div>
            )}
            
            {activeTab === "preview" && (
              <div className="space-y-4">
                <h3 className="font-medium text-sm">Pré-visualização</h3>
                
                <div className="border rounded p-2">
                  <p className="text-xs text-muted-foreground mb-2">Aqui você pode visualizar como a etiqueta ficará depois de impressa:</p>
                  
                  {labels.map((label) => (
                    <div 
                      key={label.id}
                      className="border p-2 rounded mb-2"
                      style={{
                        width: `${label.width}mm`, 
                        height: `${label.height}mm`,
                        position: 'relative',
                        transform: 'scale(1.5)',
                        transformOrigin: 'top left',
                        margin: '0 0 20px 0'
                      }}
                    >
                      <div className="text-xs font-medium text-muted-foreground mb-1">{label.name}</div>
                      
                      {label.elements.map((element) => (
                        <div
                          key={element.id}
                          style={{
                            position: 'absolute',
                            left: `${element.x}mm`,
                            top: `${element.y}mm`,
                            width: `${element.width}mm`,
                            height: `${element.height}mm`,
                            fontSize: `${element.fontSize}pt`,
                            textAlign: element.align as any,
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {getElementPreview(element.type)}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Botões de ação */}
          <div className="bg-background p-4 border-t space-x-2 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
            >
              <Save className="h-4 w-4 mr-1" />
              Criar
            </Button>
          </div>
        </div>
        
        {/* Área de edição principal */}
        <div className="flex-1 relative overflow-hidden">
          <div 
            className="flex items-center justify-center h-full p-8 overflow-auto"
            onMouseMove={handleDrag}
            onMouseUp={handleEndDrag}
            onMouseLeave={handleEndDrag}
            ref={editorRef}
          >
            <div 
              className={cn(
                "etiqueta-page-background",
                showGrid && "etiqueta-grid"
              )}
              style={{
                width: `${pageSize.width}mm`,
                height: `${pageSize.height}mm`,
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'center',
                backgroundSize: showGrid ? `${gridSize}mm ${gridSize}mm` : 'auto'
              }}
            >
              {labels.map((label) => (
                <div 
                  key={label.id}
                  className={cn(
                    "absolute border border-gray-400 bg-white cursor-move",
                    selectedLabelId === label.id && "border-primary border-2"
                  )}
                  style={{
                    left: `${label.x}mm`,
                    top: `${label.y}mm`,
                    width: `${label.width}mm`,
                    height: `${label.height}mm`
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLabelId(label.id);
                    setSelectedElement(null);
                  }}
                  onMouseDown={(e) => handleStartDrag(e, "label", label.id, label.x, label.y)}
                >
                  {label.elements.map((element) => (
                    <div
                      key={element.id}
                      className={cn(
                        "absolute border cursor-move", 
                        selectedElement === element.id 
                          ? "border-primary border-dashed bg-primary/5" 
                          : "border-gray-300 hover:border-gray-500"
                      )}
                      style={{
                        left: `${element.x}mm`,
                        top: `${element.y}mm`,
                        width: `${element.width}mm`,
                        height: `${element.height}mm`,
                        fontSize: `${element.fontSize}pt`,
                        textAlign: element.align as any,
                        display: 'flex',
                        alignItems: 'center',
                        overflow: 'hidden'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElement(element.id);
                      }}
                      onMouseDown={(e) => handleStartDrag(e, "element", element.id, element.x, element.y)}
                    >
                      <div className="w-full text-ellipsis overflow-hidden whitespace-nowrap px-1">
                        {getElementPreview(element.type)}
                      </div>
                    </div>
                  ))}
                  
                  <div className="absolute -top-5 left-0 text-xs bg-background border px-1 rounded-t opacity-60">
                    {label.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Controles de zoom */}
          <div className="zoom-controls">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setZoom(Math.min(zoom + 25, 500))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setZoom(Math.max(zoom - 25, 25))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
