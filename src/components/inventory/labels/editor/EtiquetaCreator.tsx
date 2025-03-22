
import { useState, useRef, useEffect } from "react"
import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { generatePreviewPDF } from "@/utils/etiquetaGenerator"
import { EditorToolbar } from "./EditorToolbar"
import { ElementPanel } from "./ElementPanel"
import { LabelPanel } from "./LabelPanel"
import { ConfigPanel } from "./ConfigPanel"
import { PreviewDialog } from "./PreviewDialog"
import { VisualEditor } from "./VisualEditor"
import { ElementType, LabelType, EtiquetaCreatorProps } from "./types"

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
  const [pageOrientation, setPageOrientation] = useState(initialData?.orientacao || "retrato")
  const [labelSize, setLabelSize] = useState({ 
    width: initialData?.largura || 80, 
    height: initialData?.altura || 40 
  })
  const [pageMargins, setPageMargins] = useState({
    top: initialData?.margemSuperior || 10,
    bottom: initialData?.margemInferior || 10,
    left: initialData?.margemEsquerda || 10,
    right: initialData?.margemDireita || 10
  })
  const [labelSpacing, setLabelSpacing] = useState({
    horizontal: initialData?.espacamentoHorizontal || 2,
    vertical: initialData?.espacamentoVertical || 2
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
    
    const newElement = {
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
  
  // Função para atualizar margens da página
  const handleUpdatePageMargin = (margin: 'top' | 'bottom' | 'left' | 'right', value: number) => {
    // Limitar valor entre 0 e 200mm
    value = Math.max(0, Math.min(200, value));
    
    setPageMargins(prev => ({
      ...prev,
      [margin]: value
    }));
  }
  
  // Função para atualizar espaçamento entre etiquetas
  const handleUpdateLabelSpacing = (direction: 'horizontal' | 'vertical', value: number) => {
    // Limitar valor entre 0 e 200mm
    value = Math.max(0, Math.min(200, value));
    
    setLabelSpacing(prev => ({
      ...prev,
      [direction]: value
    }));
  }
  
  const handleUpdatePageFormat = (value: string) => {
    setPageFormat(value);
    
    // Define os tamanhos padrão com base no formato e orientação
    updatePageSizeBasedOnFormatAndOrientation(value, pageOrientation);
  }
  
  const handleUpdatePageOrientation = (value: string) => {
    setPageOrientation(value);
    
    // Atualiza as dimensões da página com base na nova orientação
    updatePageSizeBasedOnFormatAndOrientation(pageFormat, value);
  }
  
  const updatePageSizeBasedOnFormatAndOrientation = (format: string, orientation: string) => {
    let width, height;
    
    // Definir dimensões padrão baseadas no formato
    if (format === "A4") {
      width = 210;
      height = 297;
    } else if (format === "A5") {
      width = 148;
      height = 210;
    } else if (format === "Letter") {
      width = 216;
      height = 279;
    } else {
      // Para outros formatos, usar os valores atuais
      width = pageSize.width;
      height = pageSize.height;
    }
    
    // Inverter largura e altura se for paisagem
    if (orientation === "paisagem") {
      setPageSize({ width: height, height: width });
    } else {
      setPageSize({ width, height });
    }
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
      orientacao: pageOrientation,
      margemSuperior: pageMargins.top,
      margemInferior: pageMargins.bottom,
      margemEsquerda: pageMargins.left,
      margemDireita: pageMargins.right,
      espacamentoHorizontal: labelSpacing.horizontal,
      espacamentoVertical: labelSpacing.vertical,
      larguraPagina: pageSize.width,
      alturaPagina: pageSize.height
    };
    
    onSave(modelData);
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
        pageSize,
        pageMargins, // Usando as margens da página
        labelSpacing, // Usando espaçamento entre etiquetas
        autoAdjustDimensions,
        pageOrientation
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
      {/* Toolbar e cabeçalho */}
      <EditorToolbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        zoom={zoom}
        setZoom={setZoom}
        showGrid={showGrid}
        setShowGrid={setShowGrid}
        snapToGrid={snapToGrid}
        setSnapToGrid={setSnapToGrid}
        modelName={modelName}
        setModelName={setModelName}
        onClose={onClose}
        handlePreview={handlePreview}
        isGeneratingPdf={isGeneratingPdf}
      />
      
      {/* Conteúdo principal */}
      <div className="flex h-[calc(100vh-18rem)]">
        {/* Painel lateral */}
        <div className="w-72 border-r bg-muted/20 p-2 overflow-y-auto">
          {activeTab === "elementos" && (
            <ElementPanel
              elements={elements}
              selectedElement={selectedElement}
              selectedLabelId={selectedLabelId}
              labels={labels}
              handleAddElement={handleAddElement}
              handleDeleteElement={handleDeleteElement}
              handleUpdateElement={handleUpdateElement}
              handleSetAlignment={handleSetAlignment}
            />
          )}
          
          {activeTab === "etiquetas" && (
            <LabelPanel
              labels={labels}
              selectedLabelId={selectedLabelId}
              setSelectedLabelId={setSelectedLabelId}
              setSelectedElement={setSelectedElement}
              handleAddLabel={handleAddLabel}
              handleDuplicateLabel={handleDuplicateLabel}
              handleDeleteLabel={handleDeleteLabel}
              handleUpdateLabelName={handleUpdateLabelName}
              handleUpdateLabelSize={handleUpdateLabelSize}
              handleOptimizeLayout={handleOptimizeLayout}
            />
          )}
          
          {activeTab === "config" && (
            <ConfigPanel
              pageFormat={pageFormat}
              handleUpdatePageFormat={handleUpdatePageFormat}
              pageOrientation={pageOrientation}
              handleUpdatePageOrientation={handleUpdatePageOrientation}
              pageMargins={pageMargins}
              handleUpdatePageMargin={handleUpdatePageMargin}
              labelSpacing={labelSpacing}
              handleUpdateLabelSpacing={handleUpdateLabelSpacing}
              pageSize={pageSize}
              setPageSize={setPageSize}
              gridSize={gridSize}
              setGridSize={setGridSize}
              autoAdjustDimensions={autoAdjustDimensions}
              onToggleAutoAdjust={onToggleAutoAdjust}
            />
          )}
        </div>
        
        {/* Editor Visual */}
        <VisualEditor
          editorRef={editorRef}
          pageSize={pageSize}
          zoom={zoom}
          showGrid={showGrid}
          gridSize={gridSize}
          pageMargins={pageMargins}
          labels={labels}
          selectedLabelId={selectedLabelId}
          selectedElement={selectedElement}
          handleDrag={handleDrag}
          handleEndDrag={handleEndDrag}
          handleStartDrag={handleStartDrag}
          setSelectedLabelId={setSelectedLabelId}
          setSelectedElement={setSelectedElement}
        />
      </div>
      
      {/* Rodapé */}
      <div className="flex justify-between p-3 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Salvar
        </Button>
      </div>
      
      {/* Diálogo de Pré-visualização */}
      <PreviewDialog
        isOpen={isPreviewDialogOpen}
        onOpenChange={setIsPreviewDialogOpen}
        previewPdfUrl={previewPdfUrl}
        modelName={modelName}
        handleDownloadPdf={handleDownloadPdf}
      />
    </div>
  );
}
