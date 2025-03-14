"use client"
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  defaultAlign?: "left" | "center" | "right";
}

export interface LabelElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  align: "left" | "center" | "right";
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
      align: campo.alinhamento as "left" | "center" | "right" || "left"
    })) || []
  }]);
  
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  
  const editorRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef({ 
    isDragging: false, 
    type: null as any, 
    id: null as any, 
    startX: 0, 
    startY: 0, 
    offsetX: 0, 
    offsetY: 0 
  });
  
  const elements: ElementType[] = [
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
  ];
  
  useEffect(() => {
    const timer = setTimeout(() => {
      document.getElementById("model-name-input")?.focus();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    if (!showPreviewDialog && previewPdfUrl) {
      URL.revokeObjectURL(previewPdfUrl);
    }
    return () => {
      if (previewPdfUrl) {
        URL.revokeObjectURL(previewPdfUrl);
      }
    };
  }, [showPreviewDialog, previewPdfUrl]);
  
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
    
    if (property === 'x' || property === 'y' || property === 'width' || property === 'height') {
      value = Number(value);
      
      if (property === 'x') {
        value = Math.max(0, Math.min(value, label.width - label.elements[elementIndex].width));
      }
      else if (property === 'width') {
        value = Math.max(10, Math.min(value, label.width - label.elements[elementIndex].x));
      }
      
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
  }
  
  const handleUpdateLabelSize = (dimension: "width" | "height", value: number) => {
    if (selectedLabelId === null) return;
    
    value = Math.max(10, Math.min(value, dimension === "width" ? pageSize.width : pageSize.height));
    
    const newLabelSize = { ...labelSize, [dimension]: value };
    setLabelSize(newLabelSize);
    
    const updatedLabels = [...labels];
    const labelIndex = updatedLabels.findIndex(l => l.id === selectedLabelId);
    if (labelIndex === -1) return;
    
    updatedLabels[labelIndex] = {
      ...updatedLabels[labelIndex],
      [dimension]: value
    };
    
    updatedLabels[labelIndex].elements = updatedLabels[labelIndex].elements.map(element => {
      let updatedElement = { ...element };
      
      if (dimension === "width" && element.x + element.width > value) {
        if (element.x < value) {
          updatedElement.width = value - element.x;
        } else {
          updatedElement.x = Math.max(0, value - element.width);
        }
      }
      
      if (dimension === "height" && element.y + element.height > value) {
        if (element.y < value) {
          updatedElement.height = value - element.y;
        } else {
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
    
    const newLabel: LabelType = {
      id: newLabelId,
      name: `Etiqueta ${newLabelId + 1}`,
      x: 20,
      y: 20 + (labels.length * 10),
      width: labelSize.width,
      height: labelSize.height,
      elements: []
    };
    
    setLabels(prevLabels => [...prevLabels, newLabel]);
    setSelectedLabelId(newLabelId);
    setSelectedElement(null);
    
    toast.success(`Nova etiqueta adicionada`);
  }
  
  const handleDuplicateLabel = (labelId: number) => {
    const labelToDuplicate = labels.find(l => l.id === labelId);
    if (!labelToDuplicate) return;
    
    const newLabelId = nextLabelId;
    setNextLabelId(prevId => prevId + 1);
    
    const newLabel: LabelType = {
      ...labelToDuplicate,
      id: newLabelId,
      name: `${labelToDuplicate.name} (Cópia)`,
      x: labelToDuplicate.x + 10,
      y: labelToDuplicate.y + 10,
      elements: labelToDuplicate.elements.map(element => ({
        ...element,
        id: `${element.id}-copy-${Date.now()}`
      }))
    };
    
    setLabels(prevLabels => [...prevLabels, newLabel]);
    setSelectedLabelId(newLabelId);
    setSelectedElement(null);
    
    toast.success(`Etiqueta duplicada`);
  }
  
  const handleDeleteLabel = (labelId: number) => {
    if (labels.length === 1) {
      toast.error("Deve haver pelo menos uma etiqueta");
      return;
    }
    
    setLabels(prevLabels => prevLabels.filter(l => l.id !== labelId));
    
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
    
    if (labels.length === 0) {
      toast.error("Por favor, adicione pelo menos uma etiqueta");
      return;
    }
    
    const emptyLabels = labels.filter(label => label.elements.length === 0);
    if (emptyLabels.length > 0) {
      toast.error(`A etiqueta "${emptyLabels[0].name}" não possui elementos. Adicione pelo menos um elemento em cada etiqueta.`);
      setSelectedLabelId(emptyLabels[0].id);
      return;
    }
    
    const primaryLabel = labels[0];
    
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
      orientacao: "retrato",
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
    
    const updatedLabels = [...labels];
    const labelIndex = updatedLabels.findIndex(l => l.id === selectedLabelId);
    if (labelIndex === -1) return;
    
    const label = updatedLabels[labelIndex];
    
    if (totalElements === 0) return;
    
    if (totalElements === 1) {
      const element = label.elements[0];
      element.x = Math.floor((label.width - element.width) / 2);
      element.y = Math.floor((label.height - element.height) / 2);
    } else if (totalElements === 2) {
      const gap = 5;
      const totalHeight = label.elements.reduce((sum, el) => sum + el.height, 0) + gap;
      let currentY = Math.floor((label.height - totalHeight) / 2);
      
      for (let element of label.elements) {
        element.x = Math.floor((label.width - element.width) / 2);
        element.y = currentY;
        currentY += element.height + gap;
      }
    } else if (totalElements === 3) {
      const nomeElement = label.elements.find(el => el.type === "nome");
      const codigoElement = label.elements.find(el => el.type === "codigo");
      const precoElement = label.elements.find(el => el.type === "preco");
      
      if (nomeElement && codigoElement && precoElement) {
        nomeElement.x = Math.floor((label.width - nomeElement.width) / 2);
        nomeElement.y = 2;
        
        codigoElement.x = Math.floor((label.width - codigoElement.width) / 2);
        codigoElement.y = nomeElement.y + nomeElement.height + 2;
        
        precoElement.x = Math.floor((label.width - precoElement.width) / 2);
        precoElement.y = codigoElement.y + codigoElement.height + 2;
      }
    }
    
    setLabels(updatedLabels);
    toast.success("Layout otimizado!");
  }
  
  const handleSetAlignment = (alignment: "left" | "center" | "right") => {
    if (!selectedElement) return;
    handleUpdateElement('align', alignment);
  }
  
  const handlePreview = async () => {
    try {
      if (labels.length === 0) {
        toast.error("Não há etiquetas para pré-visualizar");
        return;
      }
      
      if (!modelName.trim()) {
        toast.error("Por favor, informe um nome para o modelo antes de gerar a pré-visualização");
        document.getElementById("model-name-input")?.focus();
        return;
      }
      
      setIsGeneratingPdf(true);
      
      const pdfUrl = await generatePreviewPDF(modelName, labels, pageFormat, pageSize);
      
      setPreviewPdfUrl(pdfUrl);
      
      setShowPreviewDialog(true);
    } catch (error) {
      console.error("Erro ao gerar pré-visualização:", error);
      if (error instanceof Error) {
        toast.error(`Erro na pré-visualização: ${error.message}`);
      } else {
        toast.error("Erro ao gerar pré-visualização");
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };
  
  const handleDownloadPdf = () => {
    if (!previewPdfUrl) return;
    
    const a = document.createElement('a');
    a.href = previewPdfUrl;
    a.download = `${modelName || 'etiqueta'}.pdf`;
    a.click();
  };
  
  return (
    <div className="bg-background rounded-lg shadow-lg w-full max-w-5xl mx-auto overflow-hidden">
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
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
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
            onClick={handlePreview}
            disabled={isGeneratingPdf}
          >
            <FileText className="h-4 w-4 mr-1" />
            <span className="text-xs">Pré-visualizar</span>
          </Button>
        </div>
      </div>
      
      <div className="flex h-[calc(100vh-8rem)] max-h-[700px]">
        <div className="border-r w-64 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "elementos" && (
              <div className="space-y-4">
                <h3 className="font-medium text-sm">Adicionar Elementos</h3>
                <div className="space-y-2">
                  {elements.map((element) => {
                    const selectedLabel = getSelectedLabel();
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
                          <Trash className="h-4 w-4 mr-2" />
                          Remover Elemento
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
                    <PlusCircle className="h-3.5 w-3.5 mr-1" />
                    <span className="text-xs">Nova</span>
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {labels.map((label) => (
                    <div 
                      key={label.id}
                      className={`flex items-center justify-between p-2 border rounded cursor-pointer ${selectedLabelId === label.id ? 'bg-muted border-primary' : ''}`}
                      onClick={() => setSelectedLabelId(label.id)}
                    >
                      <div className="truncate flex-1 pr-2">
                        <span className="text-sm">{label.name}</span>
                        <div className="text-xs text-muted-foreground">
                          {label.width} × {label.height} mm
                        </div>
                      </div>
                      <div className="flex space-x-1 shrink-0">
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
                            min={5}
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
                        <LayoutGrid className="h-4 w-4 mr-2" />
                        Otimizar Layout
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === "config" && (
              <div className="space-y-4">
                <h3 className="font-medium text-sm">Configurações da Página</h3>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="page-format" className="text-xs">Formato da Página</Label>
                    <Select
                      value={pageFormat}
                      onValueChange={handleUpdatePageFormat}
                    >
                      <SelectTrigger id="page-format" className="h-8">
                        <SelectValue placeholder="Selecione o formato" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A4">A4 (210×297mm)</SelectItem>
                        <SelectItem value="A5">A5 (148×210mm)</SelectItem>
                        <SelectItem value="Letter">Carta (216×279mm)</SelectItem>
                        <SelectItem value="Personalizado">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {pageFormat === "Personalizado" && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="page-width" className="text-xs">Largura da Página (mm)</Label>
                        <Input
                          id="page-width"
                          type="number"
                          className="h-8"
                          value={pageSize.width}
                          onChange={(e) => setPageSize(prev => ({ ...prev, width: Number(e.target.value) }))}
                          min={50}
                          max={500}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="page-height" className="text-xs">Altura da Página (mm)</Label>
                        <Input
                          id="page-height"
                          type="number"
                          className="h-8"
                          value={pageSize.height}
                          onChange={(e) => setPageSize(prev => ({ ...prev, height: Number(e.target.value) }))}
                          min={50}
                          max={500}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="pt-4 border-t mt-4">
                  <h3 className="font-medium text-sm mb-2">Margens e Espaçamento</h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="margin-top" className="text-xs">Margem Superior (mm)</Label>
                        <Input
                          id="margin-top"
                          type="number"
                          className="h-8"
                          defaultValue={10}
                          min={0}
                          max={50}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="margin-bottom" className="text-xs">Margem Inferior (mm)</Label>
                        <Input
                          id="margin-bottom"
                          type="number"
                          className="h-8"
                          defaultValue={10}
                          min={0}
                          max={50}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="margin-left" className="text-xs">Margem Esquerda (mm)</Label>
                        <Input
                          id="margin-left"
                          type="number"
                          className="h-8"
                          defaultValue={10}
                          min={0}
                          max={50}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="margin-right" className="text-xs">Margem Direita (mm)</Label>
                        <Input
                          id="margin-right"
                          type="number"
                          className="h-8"
                          defaultValue={10}
                          min={0}
                          max={50}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="spacing-h" className="text-xs">Espaçamento Horizontal (mm)</Label>
                        <Input
                          id="spacing-h"
                          type="number"
                          className="h-8"
                          defaultValue={2}
                          min={0}
                          max={20}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="spacing-v" className="text-xs">Espaçamento Vertical (mm)</Label>
                        <Input
                          id="spacing-v"
                          type="number"
                          className="h-8"
                          defaultValue={2}
                          min={0}
                          max={20}
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
                
                <div className="border rounded p-3 bg-white">
                  <div className="text-xs text-muted-foreground mb-2">
                    Etiqueta: {getSelectedLabel()?.name || "Nenhuma selecionada"}
                  </div>
                  
                  {getSelectedLabel() && (
                    <div 
                      className="border border-dashed border-gray-300 relative bg-white"
                      style={{
                        width: `${getSelectedLabel()?.width || 0}px`,
                        height: `${getSelectedLabel()?.height || 0}px`,
                        transform: "scale(2)",
                        transformOrigin: "top left",
                        margin: "0 0 32px 0"
                      }}
                    >
                      {getSelectedLabel()?.elements.map((element) => (
                        <div
                          key={element.id}
                          className="absolute border border-transparent hover:border-blue-400"
                          style={{
                            left: element.x,
                            top: element.y,
                            width: element.width,
                            height: element.height,
                          }}
                        >
                          <div 
                            className="w-full h-full flex items-center p-0.5 overflow-hidden"
                            style={{ 
                              fontSize: element.fontSize / 2,
                              justifyContent: element.align === "left" ? "flex-start" : 
                                             element.align === "right" ? "flex-end" : "center"
                            }}
                          >
                            <span className="truncate">
                              {getElementPreview(element.type)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <Button 
                variant="default" 
                className="flex-1" 
                onClick={handleSave}
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={onClose}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        </div>
        
        <div 
          className="flex-1 overflow-auto bg-neutral-100 relative"
          onMouseMove={handleDrag}
          onMouseUp={handleEndDrag}
          onMouseLeave={handleEndDrag}
        >
          <div className="p-4 h-full">
            <div
              ref={editorRef}
              className={cn(
                "bg-white relative mx-auto border shadow-sm transition-all",
                showGrid && "etiqueta-grid"
              )}
              style={{
                width: pageSize.width,
                height: pageSize.height,
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top left",
              }}
            >
              {labels.map((label) => (
                <div
                  key={label.id}
                  className={cn(
                    "absolute border-2 cursor-move transition-all",
                    selectedLabelId === label.id 
                      ? "border-primary" 
                      : "border-neutral-300 hover:border-neutral-400"
                  )}
                  style={{
                    left: label.x,
                    top: label.y,
                    width: label.width,
                    height: label.height,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLabelId(label.id);
                    setSelectedElement(null);
                  }}
                  onMouseDown={(e) => handleStartDrag(e, "label", label.id, label.x, label.y)}
                >
                  <div className="absolute -top-5 left-0 text-xs font-medium bg-white px-1 border border-neutral-200 rounded">
                    {label.name}
                  </div>
                  
                  {label.elements.map((element) => (
                    <div
                      key={element.id}
                      className={cn(
                        "absolute border cursor-move transition-all",
                        selectedElement === element.id && selectedLabelId === label.id
                          ? "border-primary bg-primary/5"
                          : "border-dashed border-neutral-400 hover:border-neutral-600 hover:bg-neutral-50"
                      )}
                      style={{
                        left: element.x,
                        top: element.y,
                        width: element.width,
                        height: element.height,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLabelId(label.id);
                        setSelectedElement(element.id);
                      }}
                      onMouseDown={(e) => {
                        if (selectedLabelId === label.id) {
                          handleStartDrag(e, "element", element.id, element.x, element.y);
                        }
                      }}
                    >
                      <div 
                        className="w-full h-full flex items-center p-1 overflow-hidden"
                        style={{ 
                          fontSize: element.fontSize,
                          justifyContent: element.align === "left" ? "flex-start" : 
                                        element.align === "right" ? "flex-end" : "center"
                        }}
                      >
                        <span className="truncate">
                          {getElementPreview(element.type)}
                        </span>
                      </div>
                      
                      <div className="absolute -top-5 left-0 text-xs bg-white px-1 border border-neutral-200 rounded">
                        {getElementName(element.type)}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          
          <div className="absolute bottom-4 right-4 bg-white rounded-md shadow border flex">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-none rounded-l-md"
              onClick={() => setZoom(Math.max(50, zoom - 25))}
              disabled={zoom <= 50}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="flex items-center justify-center px-2 text-xs font-medium border-l border-r">
              {zoom}%
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-none rounded-r-md"
              onClick={() => setZoom(Math.min(500, zoom + 25))}
              disabled={zoom >= 500}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Pré-visualização do Modelo de Etiqueta</DialogTitle>
            <DialogDescription>
              Visualização de como ficarão as etiquetas quando impressas
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto my-4">
            {previewPdfUrl && (
              <iframe 
                src={previewPdfUrl} 
                width="100%" 
                height="500" 
                style={{ border: "1px solid #ddd" }}
                title="Pré-visualização do PDF"
              />
            )}
          </div>
          
          <DialogFooter className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setShowPreviewDialog(false)}
            >
              Fechar
            </Button>
            
            <Button
              variant="default"
              onClick={handleDownloadPdf}
              disabled={!previewPdfUrl}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Baixar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
