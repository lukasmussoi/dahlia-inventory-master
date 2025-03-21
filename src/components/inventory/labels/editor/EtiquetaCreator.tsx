
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
  RotateCcw
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
  autoAdjustDimensions?: boolean;
  onToggleAutoAdjust?: () => void;
}

export function EtiquetaCreator({ 
  onClose, 
  onSave, 
  initialData,
  autoAdjustDimensions = false,
  onToggleAutoAdjust
}: EtiquetaCreatorProps) {
  // Estados para configurações da etiqueta
  const [etiquetaNome, setEtiquetaNome] = useState<string>(initialData?.nome || "Nova Etiqueta");
  const [etiquetaLargura, setEtiquetaLargura] = useState<number>(initialData?.largura || 90);
  const [etiquetaAltura, setEtiquetaAltura] = useState<number>(initialData?.altura || 40);
  const [formatoPagina, setFormatoPagina] = useState<string>(initialData?.formatoPagina || "A4");
  const [orientacaoPagina, setOrientacaoPagina] = useState<string>(initialData?.orientacao || "retrato");
  const [margemSuperior, setMargemSuperior] = useState<number>(initialData?.margemSuperior || 10);
  const [margemInferior, setMargemInferior] = useState<number>(initialData?.margemInferior || 10);
  const [margemEsquerda, setMargemEsquerda] = useState<number>(initialData?.margemEsquerda || 10);
  const [margemDireita, setMargemDireita] = useState<number>(initialData?.margemDireita || 10);
  const [espacamentoHorizontal, setEspacamentoHorizontal] = useState<number>(initialData?.espacamentoHorizontal || 2);
  const [espacamentoVertical, setEspacamentoVertical] = useState<number>(initialData?.espacamentoVertical || 2);
  const [larguraPagina, setLarguraPagina] = useState<number>(initialData?.larguraPagina || 210);
  const [alturaPagina, setAlturaPagina] = useState<number>(initialData?.alturaPagina || 297);
  
  // Estado para elementos da etiqueta
  const [elementos, setElementos] = useState<LabelElement[]>(initialData?.campos || []);
  const [elementoSelecionado, setElementoSelecionado] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<string>("configuracoes");
  const [showSettingsDialog, setShowSettingsDialog] = useState<boolean>(false);
  const [showElementDialog, setShowElementDialog] = useState<boolean>(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState<boolean>(false);
  
  // Tipos de elementos disponíveis
  const tiposElementos: ElementType[] = [
    { 
      id: "codigo", 
      name: "Código", 
      defaultWidth: 60, 
      defaultHeight: 10, 
      defaultFontSize: 12,
      defaultAlign: "center" 
    },
    { 
      id: "nome", 
      name: "Nome", 
      defaultWidth: 80, 
      defaultHeight: 10, 
      defaultFontSize: 12,
      defaultAlign: "left" 
    },
    { 
      id: "preco", 
      name: "Preço", 
      defaultWidth: 40, 
      defaultHeight: 10, 
      defaultFontSize: 12,
      defaultAlign: "right" 
    },
    { 
      id: "barcode", 
      name: "Código de Barras", 
      defaultWidth: 80, 
      defaultHeight: 20, 
      defaultFontSize: 10,
      defaultAlign: "center"
    }
  ];
  
  // Função para adicionar um novo elemento
  const adicionarElemento = (tipo: string) => {
    const tipoElemento = tiposElementos.find(t => t.id === tipo);
    if (!tipoElemento) return;
    
    const novoElemento: LabelElement = {
      id: `${tipo}_${Date.now()}`,
      type: tipo,
      x: Math.max(0, (etiquetaLargura - tipoElemento.defaultWidth) / 2),
      y: Math.max(0, (etiquetaAltura - tipoElemento.defaultHeight) / 2),
      width: Math.min(tipoElemento.defaultWidth, etiquetaLargura),
      height: Math.min(tipoElemento.defaultHeight, etiquetaAltura),
      fontSize: tipoElemento.defaultFontSize,
      align: tipoElemento.defaultAlign || "left"
    };
    
    setElementos([...elementos, novoElemento]);
    setElementoSelecionado(novoElemento.id);
  };
  
  // Função para mover um elemento
  const moverElemento = (id: string, x: number, y: number) => {
    setElementos(elementos.map(el => {
      if (el.id === id) {
        // Garantir que o elemento não saia dos limites da etiqueta
        const novoX = Math.max(0, Math.min(etiquetaLargura - el.width, x));
        const novoY = Math.max(0, Math.min(etiquetaAltura - el.height, y));
        return { ...el, x: novoX, y: novoY };
      }
      return el;
    }));
  };
  
  // Função para redimensionar um elemento
  const redimensionarElemento = (id: string, width: number, height: number) => {
    setElementos(elementos.map(el => {
      if (el.id === id) {
        // Garantir dimensões mínimas e máximas
        const novoWidth = Math.max(10, Math.min(etiquetaLargura - el.x, width));
        const novoHeight = Math.max(5, Math.min(etiquetaAltura - el.y, height));
        return { ...el, width: novoWidth, height: novoHeight };
      }
      return el;
    }));
  };
  
  // Função para atualizar propriedades de um elemento
  const atualizarElemento = (id: string, propriedades: Partial<LabelElement>) => {
    setElementos(elementos.map(el => {
      if (el.id === id) {
        return { ...el, ...propriedades };
      }
      return el;
    }));
  };
  
  // Função para remover um elemento
  const removerElemento = (id: string) => {
    setElementos(elementos.filter(el => el.id !== id));
    setElementoSelecionado(null);
  };
  
  // Elemento selecionado atual
  const elementoAtual = elementoSelecionado 
    ? elementos.find(el => el.id === elementoSelecionado) 
    : null;
  
  // Salvamento da etiqueta
  const salvarEtiqueta = () => {
    if (!etiquetaNome.trim()) {
      toast.error("O nome da etiqueta é obrigatório");
      return;
    }
    
    if (elementos.length === 0) {
      toast.error("Adicione pelo menos um elemento à etiqueta");
      return;
    }
    
    const dadosEtiqueta = {
      nome: etiquetaNome,
      largura: etiquetaLargura,
      altura: etiquetaAltura,
      formatoPagina,
      orientacao: orientacaoPagina,
      margemSuperior,
      margemInferior,
      margemEsquerda,
      margemDireita,
      espacamentoHorizontal,
      espacamentoVertical,
      larguraPagina: formatoPagina === "Personalizado" ? larguraPagina : undefined,
      alturaPagina: formatoPagina === "Personalizado" ? alturaPagina : undefined,
      campos: elementos
    };
    
    onSave(dadosEtiqueta);
  };
  
  // Lidar com preview da etiqueta
  const handlePreview = () => {
    if (elementos.length === 0) {
      toast.error("Adicione pelo menos um elemento à etiqueta");
      return;
    }
    
    setShowPreviewDialog(true);
    
    // Gerar preview em PDF
    setTimeout(() => {
      try {
        const dadosEtiqueta = {
          nome: etiquetaNome,
          largura: etiquetaLargura,
          altura: etiquetaAltura,
          formatoPagina,
          orientacao: orientacaoPagina,
          margemSuperior,
          margemInferior,
          margemEsquerda,
          margemDireita,
          espacamentoHorizontal,
          espacamentoVertical,
          larguraPagina: formatoPagina === "Personalizado" ? larguraPagina : undefined,
          alturaPagina: formatoPagina === "Personalizado" ? alturaPagina : undefined,
          campos: elementos
        };
        
        // Converter dados para o formato esperado pelo gerador de PDF
        const labels = [{
          x: 0,
          y: 0,
          width: etiquetaLargura,
          height: etiquetaAltura,
          elements: elementos.map(el => ({
            type: el.type,
            x: el.x,
            y: el.y,
            width: el.width,
            height: el.height,
            fontSize: el.fontSize,
            align: el.align
          }))
        }];
        
        const pageSize = {
          width: formatoPagina === "Personalizado" ? larguraPagina : 
                 formatoPagina === "A4" ? 210 : 
                 formatoPagina === "A5" ? 148 : 
                 formatoPagina === "Letter" ? 216 : 210,
          height: formatoPagina === "Personalizado" ? alturaPagina : 
                  formatoPagina === "A4" ? 297 : 
                  formatoPagina === "A5" ? 210 : 
                  formatoPagina === "Letter" ? 279 : 297
        };
        
        const margins = {
          top: margemSuperior,
          right: margemDireita,
          bottom: margemInferior,
          left: margemEsquerda
        };
        
        const spacing = {
          horizontal: espacamentoHorizontal,
          vertical: espacamentoVertical
        };
        
        generatePreviewPDF(
          etiquetaNome,
          labels,
          formatoPagina,
          pageSize,
          margins,
          spacing,
          autoAdjustDimensions,
          orientacaoPagina
        ).then(pdfUrl => {
          const previewFrame = document.getElementById('previewFrame') as HTMLIFrameElement;
          if (previewFrame) {
            previewFrame.src = pdfUrl;
          }
        }).catch(error => {
          console.error("Erro ao gerar preview:", error);
          toast.error("Erro ao gerar preview da etiqueta");
        });
      } catch (error) {
        console.error("Erro ao gerar preview:", error);
        toast.error("Erro ao gerar preview da etiqueta");
      }
    }, 500);
  };

  // Referência para controlar zoom
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  
  const incrementarZoom = () => {
    setZoomLevel(prevZoom => Math.min(prevZoom + 0.1, 2));
  };
  
  const decrementarZoom = () => {
    setZoomLevel(prevZoom => Math.max(prevZoom - 0.1, 0.5));
  };
  
  const resetarZoom = () => {
    setZoomLevel(1);
  };
  
  // Referência para a área de desenho
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Lidar com clique na área de desenho
  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setElementoSelecionado(null);
    }
  };
  
  // Renderização do editor
  return (
    <div className="etiqueta-editor-container h-[75vh] flex flex-col">
      <div className="flex justify-between items-center mb-4 p-2 border-b">
        <div className="flex items-center gap-2">
          <Input
            className="w-64"
            placeholder="Nome da etiqueta"
            value={etiquetaNome}
            onChange={(e) => setEtiquetaNome(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => setShowSettingsDialog(true)}>
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Configurações</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handlePreview}>
                  <FileText className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Pré-visualizar</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button variant="outline" onClick={onClose} className="text-destructive">
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          
          <Button onClick={salvarEtiqueta}>
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r p-4 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
              <TabsTrigger value="elementos">Elementos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="configuracoes" className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="largura">Largura (mm)</Label>
                <Input
                  id="largura"
                  type="number"
                  min="10"
                  max="300"
                  value={etiquetaLargura}
                  onChange={(e) => setEtiquetaLargura(Number(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="altura">Altura (mm)</Label>
                <Input
                  id="altura"
                  type="number"
                  min="5"
                  max="300"
                  value={etiquetaAltura}
                  onChange={(e) => setEtiquetaAltura(Number(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="formatoPagina">Formato da página</Label>
                <Select 
                  value={formatoPagina} 
                  onValueChange={setFormatoPagina}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4 (210×297mm)</SelectItem>
                    <SelectItem value="A5">A5 (148×210mm)</SelectItem>
                    <SelectItem value="Letter">Carta (216×279mm)</SelectItem>
                    <SelectItem value="Legal">Ofício (216×356mm)</SelectItem>
                    <SelectItem value="Personalizado">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {formatoPagina === "Personalizado" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="larguraPagina">Largura da página (mm)</Label>
                    <Input
                      id="larguraPagina"
                      type="number"
                      min="50"
                      max="1000"
                      value={larguraPagina}
                      onChange={(e) => setLarguraPagina(Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="alturaPagina">Altura da página (mm)</Label>
                    <Input
                      id="alturaPagina"
                      type="number"
                      min="50"
                      max="1000"
                      value={alturaPagina}
                      onChange={(e) => setAlturaPagina(Number(e.target.value))}
                    />
                  </div>
                </>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="orientacaoPagina">Orientação da página</Label>
                <Select 
                  value={orientacaoPagina} 
                  onValueChange={setOrientacaoPagina}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a orientação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retrato">Retrato</SelectItem>
                    <SelectItem value="paisagem">Paisagem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {onToggleAutoAdjust && (
                <div className="flex items-center space-x-2 pt-2">
                  <Switch 
                    id="auto-adjust" 
                    checked={autoAdjustDimensions}
                    onCheckedChange={onToggleAutoAdjust}
                  />
                  <Label htmlFor="auto-adjust">Ajustar dimensões automaticamente</Label>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="elementos" className="mt-2">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Adicionar elementos</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {tiposElementos.map((tipo) => (
                    <Button
                      key={tipo.id}
                      variant="outline"
                      className="justify-start h-auto py-2"
                      onClick={() => adicionarElemento(tipo.id)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {tipo.name}
                    </Button>
                  ))}
                </div>
                
                {elementos.length > 0 && (
                  <>
                    <div className="flex justify-between items-center mt-6">
                      <h3 className="text-sm font-medium">Elementos adicionados</h3>
                    </div>
                    
                    <div className="space-y-2">
                      {elementos.map((el) => {
                        const tipoEl = tiposElementos.find(t => t.id === el.type);
                        return (
                          <Card
                            key={el.id}
                            className={cn(
                              "p-3 cursor-pointer",
                              elementoSelecionado === el.id && "border-primary bg-primary/5"
                            )}
                            onClick={() => setElementoSelecionado(el.id)}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">
                                {tipoEl?.name || el.type}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removerElemento(el.id);
                                }}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="flex-1 p-4 overflow-auto relative bg-slate-100" onClick={handleEditorClick}>
          <div className="zoom-controls">
            <Button variant="ghost" size="icon" onClick={incrementarZoom}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={decrementarZoom}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={resetarZoom}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex justify-center items-center min-h-full">
            <div 
              className="etiqueta-page-background"
              style={{
                width: `${etiquetaLargura * zoomLevel}mm`,
                height: `${etiquetaAltura * zoomLevel}mm`,
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'top left'
              }}
              ref={editorRef}
            >
              <div 
                className={cn("etiqueta-grid relative w-full h-full")}
                style={{
                  backgroundSize: `${5 * zoomLevel}mm ${5 * zoomLevel}mm`
                }}
              >
                {elementos.map((elemento) => {
                  const isSelected = elementoSelecionado === elemento.id;
                  return (
                    <div
                      key={elemento.id}
                      className={cn(
                        "etiqueta-item absolute",
                        isSelected && "selected"
                      )}
                      style={{
                        left: `${elemento.x}mm`,
                        top: `${elemento.y}mm`,
                        width: `${elemento.width}mm`,
                        height: `${elemento.height}mm`,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setElementoSelecionado(elemento.id);
                      }}
                    >
                      <div className="flex items-center justify-center w-full h-full overflow-hidden">
                        {elemento.type === "codigo" && <span style={{fontSize: `${elemento.fontSize}px`}} className={cn("text-center w-full truncate", `text-${elemento.align}`)}>ABC123</span>}
                        {elemento.type === "nome" && <span style={{fontSize: `${elemento.fontSize}px`}} className={cn("text-center w-full truncate", `text-${elemento.align}`)}>Nome do Produto</span>}
                        {elemento.type === "preco" && <span style={{fontSize: `${elemento.fontSize}px`}} className={cn("text-center w-full truncate", `text-${elemento.align}`)}>R$ 99,90</span>}
                        {elemento.type === "barcode" && <div className="flex items-center justify-center w-full h-full">Código de Barras</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        
        <div className="w-72 border-l p-4 overflow-y-auto">
          <h3 className="font-medium mb-4">Propriedades</h3>
          
          {elementoAtual ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="el-tipo">Tipo</Label>
                <Input id="el-tipo" value={tiposElementos.find(t => t.id === elementoAtual.type)?.name || elementoAtual.type} readOnly />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="el-x">X (mm)</Label>
                  <Input
                    id="el-x"
                    type="number"
                    min="0"
                    max={etiquetaLargura - elementoAtual.width}
                    value={elementoAtual.x}
                    onChange={(e) => moverElemento(elementoAtual.id, Number(e.target.value), elementoAtual.y)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="el-y">Y (mm)</Label>
                  <Input
                    id="el-y"
                    type="number"
                    min="0"
                    max={etiquetaAltura - elementoAtual.height}
                    value={elementoAtual.y}
                    onChange={(e) => moverElemento(elementoAtual.id, elementoAtual.x, Number(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="el-width">Largura (mm)</Label>
                  <Input
                    id="el-width"
                    type="number"
                    min="10"
                    max={etiquetaLargura - elementoAtual.x}
                    value={elementoAtual.width}
                    onChange={(e) => redimensionarElemento(elementoAtual.id, Number(e.target.value), elementoAtual.height)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="el-height">Altura (mm)</Label>
                  <Input
                    id="el-height"
                    type="number"
                    min="5"
                    max={etiquetaAltura - elementoAtual.y}
                    value={elementoAtual.height}
                    onChange={(e) => redimensionarElemento(elementoAtual.id, elementoAtual.width, Number(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="el-font-size">Tamanho da fonte (px)</Label>
                <Input
                  id="el-font-size"
                  type="number"
                  min="8"
                  max="36"
                  value={elementoAtual.fontSize}
                  onChange={(e) => atualizarElemento(elementoAtual.id, { fontSize: Number(e.target.value) })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="el-align">Alinhamento</Label>
                <div className="flex space-x-1">
                  <Button
                    type="button"
                    variant={elementoAtual.align === "left" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => atualizarElemento(elementoAtual.id, { align: "left" })}
                  >
                    <AlignLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={elementoAtual.align === "center" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => atualizarElemento(elementoAtual.id, { align: "center" })}
                  >
                    <AlignCenter className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={elementoAtual.align === "right" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => atualizarElemento(elementoAtual.id, { align: "right" })}
                  >
                    <AlignRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              Selecione um elemento para editar suas propriedades
            </div>
          )}
        </div>
      </div>
      
      {/* Diálogo de configurações avançadas */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurações avançadas</DialogTitle>
            <DialogDescription>
              Configure margens e espaçamento para impressão.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="margemSuperior">Margem superior (mm)</Label>
                <Input
                  id="margemSuperior"
                  type="number"
                  min="0"
                  value={margemSuperior}
                  onChange={(e) => setMargemSuperior(Number(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="margemInferior">Margem inferior (mm)</Label>
                <Input
                  id="margemInferior"
                  type="number"
                  min="0"
                  value={margemInferior}
                  onChange={(e) => setMargemInferior(Number(e.target.value))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="margemEsquerda">Margem esquerda (mm)</Label>
                <Input
                  id="margemEsquerda"
                  type="number"
                  min="0"
                  value={margemEsquerda}
                  onChange={(e) => setMargemEsquerda(Number(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="margemDireita">Margem direita (mm)</Label>
                <Input
                  id="margemDireita"
                  type="number"
                  min="0"
                  value={margemDireita}
                  onChange={(e) => setMargemDireita(Number(e.target.value))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="espacamentoHorizontal">Espaçamento horizontal (mm)</Label>
                <Input
                  id="espacamentoHorizontal"
                  type="number"
                  min="0"
                  value={espacamentoHorizontal}
                  onChange={(e) => setEspacamentoHorizontal(Number(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="espacamentoVertical">Espaçamento vertical (mm)</Label>
                <Input
                  id="espacamentoVertical"
                  type="number"
                  min="0"
                  value={espacamentoVertical}
                  onChange={(e) => setEspacamentoVertical(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de pré-visualização */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Pré-visualização da etiqueta</DialogTitle>
            <DialogDescription>
              Visualize como a etiqueta ficará após a impressão.
            </DialogDescription>
          </DialogHeader>
          
          <div className="h-[60vh] flex items-center justify-center bg-slate-100">
            <iframe 
              id="previewFrame" 
              title="Preview da etiqueta" 
              className="w-full h-full border"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
