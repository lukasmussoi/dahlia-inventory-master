
import { useState, useRef, useEffect } from "react"
import { 
  AlignCenter, 
  AlignLeft, 
  AlignRight, 
  Copy, 
  Grid, 
  Layers, 
  Plus, 
  Save, 
  Settings, 
  Trash, 
  X, 
  ZoomIn, 
  ZoomOut,
  LayoutGrid,
  CheckSquare,
  Minus,
  FileText,
  Download
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import "@/styles/etiqueta-editor.css"
import { generatePreviewPDF } from "@/utils/etiquetaGenerator"

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
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  
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
    const elementsCount = label.elements.length;
    if (elementsCount === 0) return;
    
    if (elementsCount === 1) {
      // Centralizar o único elemento
      const element = label.elements[0];
      element.x = Math.floor((label.width - element.width) / 2);
      element.y = Math.floor((label.height - element.height) / 2);
    } else if (elementsCount === 2) {
      // Organizar dois elementos um acima do outro
      const gap = 5;
      const totalHeight = label.elements.reduce((sum, el) => sum + el.height, 0) + gap;
      let currentY = Math.floor((label.height - totalHeight) / 2);
      
      for (let element of label.elements) {
        element.x = Math.floor((label.width - element.width) / 2);
        element.y = currentY;
        currentY += element.height + gap;
      }
    } else if (elementsCount === 3) {
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
  
  const handlePreview = async () => {
    if (labels.length === 0 || labels[0].elements.length === 0) {
      toast.error("Adicione pelo menos uma etiqueta com elementos para visualizar");
      return;
    }
    
    setIsGeneratingPdf(true);
    
    try {
      // Gerar PDF de pré-visualização
      const pdfUrl = await generatePreviewPDF(
        modelName || "Modelo sem nome",
        labels,
        pageFormat,
        pageSize
      );
      
      setPreviewPdfUrl(pdfUrl);
      setIsPreviewDialogOpen(true);
    } catch (error) {
      console.error("Erro ao gerar pré-visualização:", error);
      if (error instanceof Error) {
        toast.error(`Erro na pré-visualização: ${error.message}`);
      } else {
        toast.error("Não foi possível gerar a pré-visualização");
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  }
  
  const handleDownloadPdf = () => {
    if (!previewPdfUrl) return;
    
    const a = document.createElement("a");
    a.href = previewPdfUrl;
    a.download = `${modelName || "modelo-etiqueta"}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
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
            variant="default"
            size="sm"
            className="h-8 px-3"
            onClick={handlePreview}
            disabled={isGeneratingPdf}
          >
            <FileText className="h-4 w-4 mr-1" />
            <span className="text-xs">Pré-visualizar</span>
          </Button>
        </div>
      </div>
      
      {/* Conteúdo principal */}
      <div className="flex h-[calc(100vh-8rem)] max-h-[700px]">
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
                          Remover Elemento
                        </Button>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={handleOptimizeLayout}
                      >
                        <LayoutGrid className="h-4 w-4 mr-1" />
                        Organizar Elementos
                      </Button>
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
                    className="h-8 w-8 p-0"
                    onClick={handleAddLabel}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {labels.map((label) => (
                    <Card
                      key={label.id}
                      className={cn(
                        "p-3 cursor-pointer hover:bg-accent transition-colors",
                        selectedLabelId === label.id && "border-primary"
                      )}
                      onClick={() => {
                        setSelectedLabelId(label.id);
                        setSelectedElement(null);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 mr-2">
                          <Input 
                            value={label.name}
                            onChange={(e) => handleUpdateLabelName(label.id, e.target.value)}
                            className="h-8 text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateLabel(label.id);
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteLabel(label.id);
                            }}
                            disabled={labels.length <= 1}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center justify-between">
                          <span>Dimensões:</span>
                          <span>{label.width} × {label.height} mm</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span>Elementos:</span>
                          <span>{label.elements.length}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                
                {selectedLabelId !== null && (
                  <div className="pt-4 border-t mt-4">
                    <h3 className="font-medium text-sm mb-2">Dimensões da Etiqueta</h3>
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor="label-width" className="text-xs">Largura (mm)</Label>
                        <Input
                          id="label-width"
                          type="number"
                          value={getSelectedLabel()?.width || labelSize.width}
                          onChange={(e) => handleUpdateLabelSize("width", Number(e.target.value))}
                          min={10}
                          max={pageSize.width}
                          className="h-8"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <Label htmlFor="label-height" className="text-xs">Altura (mm)</Label>
                        <Input
                          id="label-height"
                          type="number"
                          value={getSelectedLabel()?.height || labelSize.height}
                          onChange={(e) => handleUpdateLabelSize("height", Number(e.target.value))}
                          min={10}
                          max={pageSize.height}
                          className="h-8"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === "config" && (
              <div className="space-y-4">
                <h3 className="font-medium text-sm">Configuração da Página</h3>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="page-format" className="text-xs">Formato</Label>
                    <Select
                      value={pageFormat}
                      onValueChange={handleUpdatePageFormat}
                    >
                      <SelectTrigger id="page-format" className="h-8">
                        <SelectValue placeholder="Selecione um formato" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A4">A4 (210 × 297 mm)</SelectItem>
                        <SelectItem value="A5">A5 (148 × 210 mm)</SelectItem>
                        <SelectItem value="Letter">Carta (216 × 279 mm)</SelectItem>
                        <SelectItem value="Personalizado">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {pageFormat === "Personalizado" && (
                    <>
                      <div className="space-y-1">
                        <Label htmlFor="page-width" className="text-xs">Largura da Página (mm)</Label>
                        <Input
                          id="page-width"
                          type="number"
                          value={pageSize.width}
                          onChange={(e) => setPageSize({ ...pageSize, width: Number(e.target.value) })}
                          min={50}
                          max={1000}
                          className="h-8"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <Label htmlFor="page-height" className="text-xs">Altura da Página (mm)</Label>
                        <Input
                          id="page-height"
                          type="number"
                          value={pageSize.height}
                          onChange={(e) => setPageSize({ ...pageSize, height: Number(e.target.value) })}
                          min={50}
                          max={1000}
                          className="h-8"
                        />
                      </div>
                    </>
                  )}
                </div>
                
                <div className="pt-4 border-t mt-4">
                  <h3 className="font-medium text-sm mb-2">Margens e Espaçamento</h3>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="margem-superior" className="text-xs">Margem Superior (mm)</Label>
                        <Input
                          id="margem-superior"
                          type="number"
                          value={10}
                          className="h-8"
                          min={0}
                          max={50}
                          disabled
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="margem-inferior" className="text-xs">Margem Inferior (mm)</Label>
                        <Input
                          id="margem-inferior"
                          type="number"
                          value={10}
                          className="h-8"
                          min={0}
                          max={50}
                          disabled
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="margem-esquerda" className="text-xs">Margem Esquerda (mm)</Label>
                        <Input
                          id="margem-esquerda"
                          type="number"
                          value={10}
                          className="h-8"
                          min={0}
                          max={50}
                          disabled
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="margem-direita" className="text-xs">Margem Direita (mm)</Label>
                        <Input
                          id="margem-direita"
                          type="number"
                          value={10}
                          className="h-8"
                          min={0}
                          max={50}
                          disabled
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="espacamento-h" className="text-xs">Espaçamento H. (mm)</Label>
                        <Input
                          id="espacamento-h"
                          type="number"
                          value={2}
                          className="h-8"
                          min={0}
                          max={20}
                          disabled
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="espacamento-v" className="text-xs">Espaçamento V. (mm)</Label>
                        <Input
                          id="espacamento-v"
                          type="number"
                          value={2}
                          className="h-8"
                          min={0}
                          max={20}
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === "preview" && (
              <div className="space-y-4">
                <h3 className="font-medium text-sm">Pré-visualização</h3>
                
                <div className="py-4 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Clique no botão abaixo para visualizar como sua etiqueta ficará no formato PDF.
                  </p>
                  
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={handlePreview}
                    disabled={isGeneratingPdf}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {isGeneratingPdf ? "Gerando..." : "Gerar PDF"}
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Rodapé da barra lateral */}
          <div className="p-4 border-t">
            <Button 
              variant="default" 
              className="w-full" 
              onClick={handleSave}
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Modelo
            </Button>
          </div>
        </div>
        
        {/* Área principal de edição */}
        <div className="flex-1 overflow-auto bg-gray-50 p-4">
          <div
            ref={editorRef}
            className={cn(
              "relative bg-white border shadow-sm mx-auto",
              showGrid && "etiqueta-grid"
            )}
            style={{
              width: `${pageSize.width * (zoom / 100)}px`,
              height: `${pageSize.height * (zoom / 100)}px`,
              backgroundSize: `${5 * (zoom / 100)}mm ${5 * (zoom / 100)}mm`
            }}
            onMouseMove={handleDrag}
            onMouseUp={handleEndDrag}
            onMouseLeave={handleEndDrag}
          >
            {/* Etiquetas */}
            {labels.map((label) => (
              <ContextMenu key={label.id}>
                <ContextMenuTrigger>
                  <div
                    className={cn(
                      "absolute border-2 bg-white",
                      selectedLabelId === label.id ? "border-primary" : "border-gray-200"
                    )}
                    style={{
                      left: `${label.x * (zoom / 100)}px`,
                      top: `${label.y * (zoom / 100)}px`,
                      width: `${label.width * (zoom / 100)}px`,
                      height: `${label.height * (zoom / 100)}px`,
                      cursor: "move"
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLabelId(label.id);
                      setSelectedElement(null);
                    }}
                    onMouseDown={(e) => handleStartDrag(e, "label", label.id, label.x, label.y)}
                  >
                    {/* Nome da etiqueta */}
                    <div 
                      className="absolute -top-6 left-0 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-t"
                      style={{ fontSize: `${10 * (zoom / 100)}px` }}
                    >
                      {label.name}
                    </div>
                    
                    {/* Elementos dentro da etiqueta */}
                    {label.elements.map((element) => (
                      <div
                        key={element.id}
                        className={cn(
                          "absolute border border-dashed",
                          selectedElement === element.id ? "selected-element" : "border-gray-300"
                        )}
                        style={{
                          left: `${element.x * (zoom / 100)}px`,
                          top: `${element.y * (zoom / 100)}px`,
                          width: `${element.width * (zoom / 100)}px`,
                          height: `${element.height * (zoom / 100)}px`,
                          cursor: "move"
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedElement(element.id);
                        }}
                        onMouseDown={(e) => handleStartDrag(e, "element", element.id, element.x, element.y)}
                      >
                        <div 
                          className="w-full h-full flex items-center p-1 overflow-hidden"
                          style={{ 
                            fontSize: `${element.fontSize * (zoom / 100)}px`,
                            justifyContent: element.align === "center" 
                              ? "center" 
                              : element.align === "right" 
                                ? "flex-end" 
                                : "flex-start",
                            textAlign: element.align as any
                          }}
                        >
                          {getElementPreview(element.type)}
                        </div>
                        
                        {/* Tipo do elemento */}
                        {selectedElement === element.id && (
                          <div 
                            className="absolute -top-5 left-0 bg-muted text-muted-foreground text-xs px-1 rounded"
                            style={{ fontSize: `${8 * (zoom / 100)}px` }}
                          >
                            {getElementName(element.type)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuLabel>{label.name}</ContextMenuLabel>
                  <ContextMenuSeparator />
                  <ContextMenuItem onClick={() => handleDuplicateLabel(label.id)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicar
                  </ContextMenuItem>
                  <ContextMenuItem 
                    onClick={() => handleDeleteLabel(label.id)}
                    disabled={labels.length <= 1}
                    className={labels.length <= 1 ? "text-muted" : "text-destructive"}
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Excluir
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </div>
        </div>
      </div>
      
      {/* Diálogo de pré-visualização */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Pré-visualização do PDF</DialogTitle>
            <DialogDescription>
              Veja como sua etiqueta aparecerá quando impressa.
            </DialogDescription>
          </DialogHeader>
          
          <div className="w-full mt-4 flex flex-col items-center">
            {previewPdfUrl ? (
              <>
                <iframe 
                  src={previewPdfUrl} 
                  className="w-full h-[60vh] border rounded"
                  title="Pré-visualização do PDF"
                />
                
                <div className="flex justify-center mt-4">
                  <Button variant="outline" onClick={handleDownloadPdf} className="flex items-center">
                    <Download className="h-4 w-4 mr-2" />
                    Baixar PDF
                  </Button>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                {isGeneratingPdf ? "Gerando PDF..." : "Nenhuma pré-visualização disponível."}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
