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
  Download,
  RotateCw
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
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import "@/styles/etiqueta-editor.css"
import { generatePreviewPDF } from "@/utils/etiquetaGenerator"
import type { ModeloEtiqueta } from "@/types/etiqueta"

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
  autoAdjustDimensions?: boolean;
  onToggleAutoAdjust?: () => void;
}

export default function EtiquetaCreator({ 
  onClose, 
  onSave, 
  initialData,
  autoAdjustDimensions = false,
  onToggleAutoAdjust
}: EtiquetaCreatorProps) {
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
  const [pageOrientation, setPageOrientation] = useState<"retrato" | "paisagem">(initialData?.orientacao || "retrato")
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

  // Efeito para atualizar as dimensões da página com base na orientação
  useEffect(() => {
    // Se a orientação mudar, inverter dimensões da página
    if (pageOrientation === "paisagem") {
      // Garantir que largura > altura para paisagem
      if (pageSize.width < pageSize.height) {
        setPageSize({
          width: pageSize.height,
          height: pageSize.width
        });
      }
    } else {
      // Garantir que altura > largura para retrato
      if (pageSize.height < pageSize.width) {
        setPageSize({
          width: pageSize.height,
          height: pageSize.width
        });
      }
    }
  }, [pageOrientation]);
  
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
      setPageSize(pageOrientation === "retrato" 
        ? { width: 210, height: 297 }
        : { width: 297, height: 210 });
    } else if (value === "A5") {
      setPageSize(pageOrientation === "retrato" 
        ? { width: 148, height: 210 }
        : { width: 210, height: 148 });
    } else if (value === "Letter") {
      setPageSize(pageOrientation === "retrato" 
        ? { width: 216, height: 279 }
        : { width: 279, height: 216 });
    }
  }
  
  const handleToggleOrientation = () => {
    // Inverter orientação
    const newOrientation = pageOrientation === "retrato" ? "paisagem" : "retrato";
    setPageOrientation(newOrientation);
    
    // Inverter dimensões da página
    setPageSize({
      width: pageSize.height,
      height: pageSize.width
    });
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
      orientacao: pageOrientation, // Usar a orientação definida
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
      // Verificar se as dimensões são válidas antes de gerar o PDF
      const orientacaoAtual = pageOrientation;
      
      // Calcular área útil disponível (considerar orientação correta)
      let larguraDisponivel = pageSize.width;
      let alturaDisponivel = pageSize.height;
      
      // Margens padrão (podem ser configuráveis no futuro)
      const margemSuperior = 10;
      const margemInferior = 10;
      const margemEsquerda = 10;
      const margemDireita = 10;
      
      // Área útil
      const areaUtilLargura = larguraDisponivel - margemEsquerda - margemDireita;
      const areaUtilAltura = alturaDisponivel - margemSuperior - margemInferior;
      
      console.log("Verificando dimensões:", {
        etiqueta: { largura: labels[0].width, altura: labels[0].height },
        pagina: { 
          largura: pageSize.width, 
          altura: pageSize.height,
          orientacao: pageOrientation
        },
        areaUtil: { largura: areaUtilLargura, altura: areaUtilAltura }
      });
      
      // Verificar se a etiqueta cabe na área útil
      if (labels[0].width > areaUtilLargura) {
        toast.error(`A largura da etiqueta (${labels[0].width}mm) excede a área útil disponível (${areaUtilLargura}mm).`);
        setIsGeneratingPdf(false);
        return;
      }
      
      if (labels[0].height > areaUtilAltura) {
        toast.error(`A altura da etiqueta (${labels[0].height}mm) excede a área útil disponível (${areaUtilAltura}mm).`);
        setIsGeneratingPdf(false);
        return;
      }
      
      // Criar um objeto modelo temporário para a pré-visualização
      const tempModelo: ModeloEtiqueta = {
        nome: modelName || "Modelo sem nome",
        descricao: modelName || "Modelo sem nome",
        largura: labels[0].width,
        altura: labels[0].height,
        formatoPagina: pageFormat,
        orientacao: pageOrientation,
        margemSuperior: margemSuperior,
        margemInferior: margemInferior,
        margemEsquerda: margemEsquerda,
        margemDireita: margemDireita,
        espacamentoHorizontal: 2,
        espacamentoVertical: 2,
        larguraPagina: pageSize.width,
        alturaPagina: pageSize.height,
        campos: labels[0].elements.map(el => ({
          tipo: el.type as 'nome' | 'codigo' | 'preco',
          x: el.x,
          y: el.y,
          largura: el.width,
          altura: el.height,
          tamanhoFonte: el.fontSize
        }))
      };
      
      console.log("Gerando prévia com modelo:", tempModelo);
      
      // Gerar PDF de pré-visualização
      const pdfUrl = await generatePreviewPDF(tempModelo);
      
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
      <div className="flex h-[calc(100vh-18rem)]">
        {/* Painel lateral */}
        <div className="w-72 border-r bg-muted/20 p-2 overflow-y-auto">
          {activeTab === "elementos" && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium mb-3">Elementos Disponíveis</h3>
              
              {elements.map(element => (
                <Card 
                  key={element.id}
                  className="p-2 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleAddElement(element.id)}
                >
                  <div className="text-sm font-medium mb-1">{element.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Clique para adicionar à etiqueta
                  </div>
                </Card>
              ))}
              
              {selectedElement && (
                <div className="mt-6 border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium">Propriedades do Elemento</h3>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-6 px-2"
                      onClick={handleDeleteElement}
                    >
                      <Trash className="h-3 w-3 mr-1" />
                      <span className="text-xs">Remover</span>
                    </Button>
                  </div>
                  
                  {getSelectedElementDetails() && (
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs" htmlFor="element-type">Tipo</Label>
                        <div className="text-sm font-medium" id="element-type">
                          {getElementName(getSelectedElementDetails()!.type)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs" htmlFor="element-x">Posição X</Label>
                          <Input
                            id="element-x"
                            type="number"
                            className="h-7 text-sm"
                            value={getSelectedElementDetails()!.x}
                            onChange={(e) => handleUpdateElement('x', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs" htmlFor="element-y">Posição Y</Label>
                          <Input
                            id="element-y"
                            type="number"
                            className="h-7 text-sm"
                            value={getSelectedElementDetails()!.y}
                            onChange={(e) => handleUpdateElement('y', e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs" htmlFor="element-width">Largura</Label>
                          <Input
                            id="element-width"
                            type="number"
                            className="h-7 text-sm"
                            value={getSelectedElementDetails()!.width}
                            onChange={(e) => handleUpdateElement('width', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs" htmlFor="element-height">Altura</Label>
                          <Input
                            id="element-height"
                            type="number"
                            className="h-7 text-sm"
                            value={getSelectedElementDetails()!.height}
                            onChange={(e) => handleUpdateElement('height', e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-xs" htmlFor="element-font">Tam. Fonte</Label>
                        <Input
                          id="element-font"
                          type="number"
                          className="h-7 text-sm"
                          value={getSelectedElementDetails()!.fontSize}
                          onChange={(e) => handleUpdateElement('fontSize', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs" htmlFor="element-align">Alinhamento</Label>
                        <div className="flex gap-1 mt-1">
                          <Button
                            variant={getSelectedElementDetails()!.align === "left" ? "default" : "outline"}
                            size="sm"
                            className="h-7 px-2 flex-1"
                            onClick={() => handleSetAlignment("left")}
                          >
                            <AlignLeft className="h-3 w-3" />
                          </Button>
                          <Button
                            variant={getSelectedElementDetails()!.align === "center" ? "default" : "outline"}
                            size="sm"
                            className="h-7 px-2 flex-1"
                            onClick={() => handleSetAlignment("center")}
                          >
                            <AlignCenter className="h-3 w-3" />
                          </Button>
                          <Button
                            variant={getSelectedElementDetails()!.align === "right" ? "default" : "outline"}
                            size="sm"
                            className="h-7 px-2 flex-1"
                            onClick={() => handleSetAlignment("right")}
                          >
                            <AlignRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {activeTab === "etiquetas" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Etiquetas</h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2"
                  onClick={handleAddLabel}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  <span className="text-xs">Adicionar</span>
                </Button>
              </div>
              
              <div className="space-y-2">
                {labels.map(label => (
                  <ContextMenu key={label.id}>
                    <ContextMenuTrigger>
                      <Card 
                        className={`p-2 cursor-pointer border-2 transition-colors ${selectedLabelId === label.id ? 'border-primary' : 'border-transparent hover:border-primary/30'}`}
                        onClick={() => setSelectedLabelId(label.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">{label.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {label.width}x{label.height}mm
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {label.elements.length} elementos
                        </div>
                      </Card>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuLabel>Opções da Etiqueta</ContextMenuLabel>
                      <ContextMenuSeparator />
                      <ContextMenuItem onClick={() => handleDuplicateLabel(label.id)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicar
                      </ContextMenuItem>
                      <ContextMenuItem 
                        className="text-destructive focus:text-destructive" 
                        onClick={() => handleDeleteLabel(label.id)}
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Excluir
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
              </div>
              
              {selectedLabelId !== null && getSelectedLabel() && (
                <div className="pt-4 border-t mt-4">
                  <h3 className="text-sm font-medium mb-3">Propriedades da Etiqueta</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs" htmlFor="label-name">Nome</Label>
                      <Input
                        id="label-name"
                        type="text"
                        className="h-7 text-sm"
                        value={getSelectedLabel()!.name}
                        onChange={(e) => handleUpdateLabelName(getSelectedLabel()!.id, e.target.value)}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs" htmlFor="label-width">Largura (mm)</Label>
                        <Input
                          id="label-width"
                          type="number"
                          className="h-7 text-sm"
                          value={getSelectedLabel()!.width}
                          onChange={(e) => handleUpdateLabelSize("width", Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs" htmlFor="label-height">Altura (mm)</Label>
                        <Input
                          id="label-height"
                          type="number"
                          className="h-7 text-sm"
                          value={getSelectedLabel()!.height}
                          onChange={(e) => handleUpdateLabelSize("height", Number(e.target.value))}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs" htmlFor="label-x">Posição X (mm)</Label>
                        <Input
                          id="label-x"
                          type="number"
                          className="h-7 text-sm"
                          value={getSelectedLabel()!.x}
                          onChange={(e) => {
                            const updatedLabels = [...labels];
                            const labelIndex = updatedLabels.findIndex(l => l.id === selectedLabelId);
                            if (labelIndex !== -1) {
                              const value = Number(e.target.value);
                              const maxX = pageSize.width - getSelectedLabel()!.width;
                              updatedLabels[labelIndex].x = Math.max(0, Math.min(value, maxX));
                              setLabels(updatedLabels);
                            }
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs" htmlFor="label-y">Posição Y (mm)</Label>
                        <Input
                          id="label-y"
                          type="number"
                          className="h-7 text-sm"
                          value={getSelectedLabel()!.y}
                          onChange={(e) => {
                            const updatedLabels = [...labels];
                            const labelIndex = updatedLabels.findIndex(l => l.id === selectedLabelId);
                            if (labelIndex !== -1) {
                              const value = Number(e.target.value);
                              const maxY = pageSize.height - getSelectedLabel()!.height;
                              updatedLabels[labelIndex].y = Math.max(0, Math.min(value, maxY));
                              setLabels(updatedLabels);
                            }
                          }}
                        />
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8"
                      onClick={handleOptimizeLayout}
                    >
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Otimizar Layout
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === "config" && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium mb-3">Configurações da Página</h3>
              
              <div>
                <Label className="text-xs" htmlFor="page-format">Formato da Página</Label>
                <Select
                  value={pageFormat}
                  onValueChange={handleUpdatePageFormat}
                >
                  <SelectTrigger id="page-format" className="h-8 text-sm">
                    <SelectValue placeholder="Formato da página" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4 (210×297mm)</SelectItem>
                    <SelectItem value="A5">A5 (148×210mm)</SelectItem>
                    <SelectItem value="Letter">Carta (216×279mm)</SelectItem>
                    <SelectItem value="Personalizado">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-xs mb-1 block">Orientação da Página</Label>
                <ToggleGroup type="single" variant="outline" className="justify-start">
                  <ToggleGroupItem 
                    value="retrato" 
                    aria-label="Retrato"
                    className={pageOrientation === "retrato" ? "bg-muted" : ""}
                    onClick={() => setPageOrientation("retrato")}
                  >
                    Retrato
                  </ToggleGroupItem>
                  <ToggleGroupItem 
                    value="paisagem" 
                    aria-label="Paisagem"
                    className={pageOrientation === "paisagem" ? "bg-muted" : ""}
                    onClick={() => setPageOrientation("paisagem")}
                  >
                    Paisagem
                  </ToggleGroupItem>
                </ToggleGroup>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 h-8"
                  onClick={handleToggleOrientation}
                >
                  <RotateCw className="h-4 w-4 mr-2" />
                  Alternar Orientação
                </Button>
              </div>
              
              {pageFormat === "Personalizado" && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs" htmlFor="page-width">Largura da Página (mm)</Label>
                      <Input
                        id="page-width"
                        type="number"
                        className="h-7 text-sm"
                        value={pageSize.width}
                        onChange={(e) => setPageSize({ ...pageSize, width: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs" htmlFor="page-height">Altura da Página (mm)</Label>
                      <Input
                        id="page-height"
                        type="number"
                        className="h-7 text-sm"
                        value={pageSize.height}
                        onChange={(e) => setPageSize({ ...pageSize, height: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="border-t pt-3 mt-4">
                <h3 className="text-sm font-medium mb-2">Dimensões da Etiqueta Padrão</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs" htmlFor="default-width">Largura (mm)</Label>
                    <Input
                      id="default-width"
                      type="number"
                      className="h-7 text-sm"
                      value={labelSize.width}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        setLabelSize({ ...labelSize, width: value });
                      }}
                    />
                  </div>
                  <div>
                    <Label className="text-xs" htmlFor="default-height">Altura (mm)</Label>
                    <Input
                      id="default-height"
                      type="number"
                      className="h-7 text-sm"
                      value={labelSize.height}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        setLabelSize({ ...labelSize, height: value });
                      }}
                    />
                  </div>
                </div>
              </div>
              
              {autoAdjustDimensions !== undefined && onToggleAutoAdjust && (
                <div className="border-t pt-3 mt-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto-adjust"
                      checked={autoAdjustDimensions}
                      onCheckedChange={onToggleAutoAdjust}
                    />
                    <Label htmlFor="auto-adjust" className="text-sm cursor-pointer">
                      Ajustar dimensões automaticamente
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Quando ativado, as dimensões da etiqueta serão ajustadas automaticamente para caber na página
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Área principal */}
        <div className="flex-1 overflow-hidden bg-neutral-100 flex flex-col">
          <div className="flex-1 overflow-auto p-4">
            <div
              ref={editorRef}
              className={`relative bg-white shadow mx-auto border border-gray-300 overflow-auto ${showGrid ? 'bg-grid' : ''}`}
              style={{
                width: `${pageSize.width * (zoom / 100)}px`,
                height: `${pageSize.height * (zoom / 100)}px`,
                transformOrigin: 'top left',
                scale: `${zoom / 100}`,
              }}
              onMouseMove={handleDrag}
              onMouseUp={handleEndDrag}
              onMouseLeave={handleEndDrag}
            >
              {/* Etiquetas */}
              {labels.map(label => (
                <div
                  key={label.id}
                  className={`absolute border-2 transition-colors ${
                    selectedLabelId === label.id ? 'border-primary' : 'border-dashed border-gray-400'
                  }`}
                  style={{
                    left: `${label.x}px`,
                    top: `${label.y}px`,
                    width: `${label.width}px`,
                    height: `${label.height}px`,
                    cursor: 'move',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLabelId(label.id);
                    setSelectedElement(null);
                  }}
                  onMouseDown={(e) => handleStartDrag(e, "label", label.id, label.x, label.y)}
                >
                  {/* Elementos dentro da etiqueta */}
                  {label.elements.map(element => (
                    <div
                      key={element.id}
                      className={`absolute cursor-move ${selectedElement === element.id ? 'outline outline-2 outline-blue-500' : ''}`}
                      style={{
                        left: `${element.x}px`,
                        top: `${element.y}px`,
                        width: `${element.width}px`,
                        height: `${element.height}px`,
                        fontSize: `${element.fontSize}px`,
                        textAlign: element.align as any,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElement(element.id);
                      }}
                      onMouseDown={(e) => selectedLabelId === label.id && handleStartDrag(e, "element", element.id, element.x, element.y)}
                    >
                      <div className="w-full h-full overflow-hidden flex items-center">
                        <div className="w-full truncate">
                          {getElementPreview(element.type)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-3 border-t bg-background flex justify-between items-center">
            <div className="text-sm">
              {pageOrientation === "retrato" ? "Retrato" : "Paisagem"}: {pageSize.width}×{pageSize.height}mm
              {selectedLabelId !== null && getSelectedLabel() && (
                <span className="ml-2">
                  | Etiqueta: {getSelectedLabel()!.width}×{getSelectedLabel()!.height}mm
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Salvar Modelo
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Diálogo de pré-visualização */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Pré-visualização do Modelo de Etiqueta</DialogTitle>
            <DialogDescription>
              Esta é uma prévia do PDF que será gerado para impressão.
            </DialogDescription>
          </DialogHeader>
          
          <div className="h-[70vh] bg-gray-100 rounded overflow-hidden">
            {previewPdfUrl && (
              <iframe 
                src={previewPdfUrl} 
                className="w-full h-full" 
                title="Pré-visualização de PDF"
              />
            )}
          </div>
          
          <div className="flex justify-end space-x-2 mt-2">
            <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>
              Fechar
            </Button>
            <Button onClick={handleDownloadPdf}>
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
