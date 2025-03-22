import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle, Save, Info, ZoomIn, ZoomOut, RotateCw, Tag, Tags, Layout, File, LayoutGrid } from "lucide-react";
import { useEtiquetaZoom } from "./useEtiquetaZoom";
import { generatePreviewPDF } from "@/utils/etiquetaGenerator";
import { validarDimensoesEtiqueta } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ModeloEtiqueta, CampoEtiqueta } from "@/types/etiqueta";
import ZoomControls from "./ZoomControls";
import "@/styles/etiqueta-editor.css";

interface CampoDrag {
  isDragging: boolean;
  initialX: number;
  initialY: number;
  offsetX: number;
  offsetY: number;
}

interface EtiquetaCreatorProps {
  onClose: () => void;
  onSave: (data: ModeloEtiqueta) => void;
  initialData?: ModeloEtiqueta;
  isLoading?: boolean;
}

const formatoOptions = [
  { value: "A4", label: "A4 (210 x 297 mm)" },
  { value: "Letter", label: "Carta (216 x 279 mm)" },
  { value: "Legal", label: "Ofício (216 x 356 mm)" },
  { value: "Personalizado", label: "Personalizado" }
];

const tiposCampo = [
  { value: "nome", label: "Nome do Produto" },
  { value: "codigo", label: "Código de Barras" },
  { value: "preco", label: "Preço" }
];

export default function EtiquetaCreator({ onClose, onSave, initialData, isLoading }: EtiquetaCreatorProps) {
  const [modelo, setModelo] = useState<ModeloEtiqueta>(() => {
    if (initialData) return { ...initialData };
    
    return {
      nome: "",
      descricao: "",
      largura: 80,
      altura: 30,
      formatoPagina: "A4",
      orientacao: "retrato",
      margemSuperior: 0,
      margemInferior: 0,
      margemEsquerda: 0,
      margemDireita: 0,
      espacamentoHorizontal: 0,
      espacamentoVertical: 0,
      larguraPagina: 210,
      alturaPagina: 297,
      campos: [
        { tipo: 'nome', x: 2, y: 4, largura: 40, altura: 10, tamanhoFonte: 7 },
        { tipo: 'codigo', x: 20, y: 1, largura: 40, altura: 6, tamanhoFonte: 8 },
        { tipo: 'preco', x: 70, y: 4, largura: 20, altura: 10, tamanhoFonte: 10 },
      ]
    };
  });

  const [campoDrag, setCampoDrag] = useState<CampoDrag>({
    isDragging: false,
    initialX: 0,
    initialY: 0,
    offsetX: 0,
    offsetY: 0
  });

  const [campoSelecionado, setCampoSelecionado] = useState<number | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showPageView, setShowPageView] = useState(false);
  const [validacaoEtiqueta, setValidacaoEtiqueta] = useState<{valido: boolean, mensagem?: string} | null>(null);
  const [areaUtil, setAreaUtil] = useState<{largura: number, altura: number} | null>(null);
  const [autoAjustar, setAutoAjustar] = useState(true);

  const etiquetaRef = useRef<HTMLDivElement>(null);
  const paginaRef = useRef<HTMLDivElement>(null);

  const { zoomLevel, setZoomLevel, handleZoomIn, handleZoomOut, handleResetZoom } = useEtiquetaZoom(1);

  useEffect(() => {
    validarDimensoes();
  }, [
    modelo.formatoPagina, 
    modelo.orientacao, 
    modelo.largura, 
    modelo.altura, 
    modelo.margemSuperior, 
    modelo.margemInferior,
    modelo.margemEsquerda,
    modelo.margemDireita,
    modelo.larguraPagina,
    modelo.alturaPagina
  ]);

  const validarDimensoes = () => {
    if (!modelo.formatoPagina) return;
    
    let larguraPagina = modelo.larguraPagina || 0;
    let alturaPagina = modelo.alturaPagina || 0;
    
    if (modelo.formatoPagina !== "Personalizado") {
      switch (modelo.formatoPagina) {
        case "A4":
          larguraPagina = 210;
          alturaPagina = 297;
          break;
        case "Letter":
          larguraPagina = 216;
          alturaPagina = 279;
          break;
        case "Legal":
          larguraPagina = 216;
          alturaPagina = 356;
          break;
        default:
          larguraPagina = 210;
          alturaPagina = 297;
      }
    }
    
    if (!larguraPagina || !alturaPagina) return;
    
    const resultado = validarDimensoesEtiqueta(
      modelo.largura || 0,
      modelo.altura || 0,
      {
        largura: larguraPagina,
        altura: alturaPagina,
        margemSuperior: modelo.margemSuperior || 0,
        margemInferior: modelo.margemInferior || 0,
        margemEsquerda: modelo.margemEsquerda || 0,
        margemDireita: modelo.margemDireita || 0,
        orientacao: modelo.orientacao || 'retrato'
      }
    );
    
    setValidacaoEtiqueta({
      valido: resultado.valido,
      mensagem: resultado.mensagem
    });
    
    if (resultado.areaUtil) {
      setAreaUtil(resultado.areaUtil);
    }
  };

  const iniciarArraste = (index: number, e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    const campo = modelo.campos[index];
    
    setCampoSelecionado(index);
    setCampoDrag({
      isDragging: true,
      initialX: e.clientX,
      initialY: e.clientY,
      offsetX: 0,
      offsetY: 0
    });
  };

  const arrastarCampo = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!campoDrag.isDragging || campoSelecionado === null) return;
    
    const offsetX = e.clientX - campoDrag.initialX;
    const offsetY = e.clientY - campoDrag.initialY;
    
    setCampoDrag(prev => ({
      ...prev,
      offsetX,
      offsetY
    }));
  };

  const finalizarArraste = () => {
    if (!campoDrag.isDragging || campoSelecionado === null) return;
    
    const zoom = zoomLevel;
    const campo = modelo.campos[campoSelecionado];
    
    const novoX = Math.max(0, campo.x + (campoDrag.offsetX / zoom));
    const novoY = Math.max(0, campo.y + (campoDrag.offsetY / zoom));
    
    const camposAtualizados = [...modelo.campos];
    camposAtualizados[campoSelecionado] = {
      ...campo,
      x: novoX,
      y: novoY
    };
    
    setModelo(prev => ({
      ...prev,
      campos: camposAtualizados
    }));
    
    setCampoDrag({
      isDragging: false,
      initialX: 0,
      initialY: 0,
      offsetX: 0,
      offsetY: 0
    });
  };

  const atualizarCampo = (index: number, chave: keyof CampoEtiqueta, valor: any) => {
    const novosCampos = [...modelo.campos];
    novosCampos[index] = {
      ...novosCampos[index],
      [chave]: valor
    };
    
    setModelo(prev => ({
      ...prev,
      campos: novosCampos
    }));
  };

  const adicionarCampo = (tipo: 'nome' | 'codigo' | 'preco') => {
    const novoCampo: CampoEtiqueta = {
      tipo: tipo,
      x: 10,
      y: 10,
      largura: tipo === 'codigo' ? 40 : 20,
      altura: tipo === 'codigo' ? 10 : 8,
      tamanhoFonte: 8
    };
    
    setModelo(prev => ({
      ...prev,
      campos: [...prev.campos, novoCampo]
    }));
    
    setCampoSelecionado(modelo.campos.length);
  };

  const removerCampoSelecionado = () => {
    if (campoSelecionado === null) return;
    
    const novosCampos = modelo.campos.filter((_, index) => index !== campoSelecionado);
    
    setModelo(prev => ({
      ...prev,
      campos: novosCampos
    }));
    
    setCampoSelecionado(null);
  };

  const atualizarModelo = (chave: keyof ModeloEtiqueta, valor: any) => {
    setModelo(prev => ({
      ...prev,
      [chave]: valor
    }));
  };

  const gerarPreview = async () => {
    try {
      const url = await generatePreviewPDF(modelo);
      setPreviewUrl(url);
      setShowPreview(true);
    } catch (error) {
      console.error("Erro ao gerar pré-visualização:", error);
      if (error instanceof Error) {
        setValidacaoEtiqueta({
          valido: false,
          mensagem: `Erro ao gerar pré-visualização: ${error.message}`
        });
      } else {
        setValidacaoEtiqueta({
          valido: false,
          mensagem: "Erro desconhecido ao gerar pré-visualização"
        });
      }
    }
  };

  const calcularDimensoesPagina = () => {
    let larguraPagina = modelo.larguraPagina || 210;
    let alturaPagina = modelo.alturaPagina || 297;
    
    if (modelo.formatoPagina !== "Personalizado") {
      switch (modelo.formatoPagina) {
        case "A4":
          larguraPagina = 210;
          alturaPagina = 297;
          break;
        case "Letter":
          larguraPagina = 216;
          alturaPagina = 279;
          break;
        case "Legal":
          larguraPagina = 216;
          alturaPagina = 356;
          break;
        default:
          larguraPagina = 210;
          alturaPagina = 297;
      }
    }
    
    if (modelo.orientacao === 'paisagem') {
      return { 
        largura: alturaPagina, 
        altura: larguraPagina 
      };
    }
    
    return { 
      largura: larguraPagina, 
      altura: alturaPagina 
    };
  };

  const calcularEtiquetasPorPagina = () => {
    if (!areaUtil) return { etiquetasPorLinha: 0, etiquetasPorColuna: 0 };
    
    const espacamentoH = modelo.espacamentoHorizontal || 0;
    const espacamentoV = modelo.espacamentoVertical || 0;
    
    const etiquetasPorLinha = Math.floor((areaUtil.largura + espacamentoH) / (modelo.largura + espacamentoH));
    const etiquetasPorColuna = Math.floor((areaUtil.altura + espacamentoV) / (modelo.altura + espacamentoV));
    
    return { etiquetasPorLinha, etiquetasPorColuna };
  };

  const salvarModelo = () => {
    validarDimensoes();
    
    if (validacaoEtiqueta && !validacaoEtiqueta.valido) {
      return;
    }
    
    if (!modelo.nome.trim()) {
      setValidacaoEtiqueta({
        valido: false,
        mensagem: "O nome do modelo é obrigatório"
      });
      return;
    }
    
    onSave(modelo);
  };

  const renderizarVisualizacaoPagina = () => {
    if (!areaUtil) return null;
    
    const dimensoesPagina = calcularDimensoesPagina();
    const { etiquetasPorLinha, etiquetasPorColuna } = calcularEtiquetasPorPagina();
    
    const etiquetas = [];
    for (let coluna = 0; coluna < etiquetasPorLinha; coluna++) {
      for (let linha = 0; linha < etiquetasPorColuna; linha++) {
        const x = modelo.margemEsquerda + coluna * (modelo.largura + (modelo.espacamentoHorizontal || 0));
        const y = modelo.margemSuperior + linha * (modelo.altura + (modelo.espacamentoVertical || 0));
        
        etiquetas.push(
          <div 
            key={`etiqueta-${coluna}-${linha}`}
            className="absolute border border-dashed border-gray-300"
            style={{
              left: x * zoomLevel,
              top: y * zoomLevel,
              width: modelo.largura * zoomLevel,
              height: modelo.altura * zoomLevel,
              backgroundColor: 'rgba(255, 255, 255, 0.8)'
            }}
          />
        );
      }
    }
    
    return (
      <div className="flex justify-center my-4 overflow-auto">
        <div 
          ref={paginaRef}
          className="relative bg-white shadow-md border"
          style={{
            width: dimensoesPagina.largura * zoomLevel,
            height: dimensoesPagina.altura * zoomLevel,
          }}
        >
          <div 
            className="absolute border border-dashed border-blue-300"
            style={{
              left: modelo.margemEsquerda * zoomLevel,
              top: modelo.margemSuperior * zoomLevel,
              width: areaUtil.largura * zoomLevel,
              height: areaUtil.altura * zoomLevel,
              backgroundColor: 'rgba(59, 130, 246, 0.05)'
            }}
          />
          
          {etiquetas}
        </div>
      </div>
    );
  };

  const renderizarPosicaoElementos = () => {
    return modelo.campos.map((campo, index) => {
      const isSelected = index === campoSelecionado;
      
      let posX = campo.x;
      let posY = campo.y;
      
      if (isSelected && campoDrag.isDragging) {
        posX = campo.x + (campoDrag.offsetX / zoomLevel);
        posY = campo.y + (campoDrag.offsetY / zoomLevel);
      }
      
      return (
        <div
          key={`campo-${index}`}
          className={cn(
            "absolute border-2 border-gray-200 bg-white/70 hover:bg-white/90 cursor-move rounded-sm",
            isSelected ? "selected-element" : ""
          )}
          style={{
            left: posX * zoomLevel,
            top: posY * zoomLevel,
            width: campo.largura * zoomLevel,
            height: campo.altura * zoomLevel,
            zIndex: isSelected ? 10 : 1
          }}
          onClick={(e) => {
            e.stopPropagation();
            setCampoSelecionado(index);
          }}
          onMouseDown={(e) => iniciarArraste(index, e)}
        >
          <div className="w-full h-full flex items-center justify-center p-1 overflow-hidden">
            {campo.tipo === 'nome' && (
              <div className="truncate text-center" style={{ fontSize: campo.tamanhoFonte * zoomLevel }}>
                Nome do Produto
              </div>
            )}
            {campo.tipo === 'codigo' && (
              <div className="text-center flex items-center justify-center" style={{ fontSize: campo.tamanhoFonte * zoomLevel }}>
                <svg width={campo.largura * zoomLevel * 0.8} height={campo.altura * zoomLevel * 0.6} className="mx-auto">
                  <rect x="0" y="0" width="100%" height="80%" fill="#ECECEC" />
                  {Array.from({ length: 15 }).map((_, i) => (
                    <rect 
                      key={i} 
                      x={i * 6} 
                      y="0" 
                      width="3" 
                      height="80%" 
                      fill={i % 3 === 0 ? "#333" : "#666"} 
                    />
                  ))}
                </svg>
                <span className="text-[6px] absolute bottom-0 left-0 right-0 text-center">123456789</span>
              </div>
            )}
            {campo.tipo === 'preco' && (
              <div className="truncate text-center font-bold" style={{ fontSize: campo.tamanhoFonte * zoomLevel }}>
                R$ 99,90
              </div>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      <Tabs defaultValue="editor" className="flex flex-col h-full">
        <TabsList className="w-full grid grid-cols-3 mb-4">
          <TabsTrigger value="editor" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Editor de Etiqueta
          </TabsTrigger>
          <TabsTrigger value="pageLayout" className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            Layout da Página
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <File className="h-4 w-4" />
            Pré-visualização
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="editor" className="h-full overflow-auto">
            <div className="grid grid-cols-8 gap-4 h-full">
              <div className="col-span-3 space-y-4 overflow-auto pr-2">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome do Modelo</Label>
                      <Input 
                        id="nome" 
                        value={modelo.nome} 
                        onChange={(e) => atualizarModelo('nome', e.target.value)}
                        placeholder="Ex: Etiqueta padrão de jóias"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="descricao">Descrição</Label>
                      <Textarea 
                        id="descricao" 
                        value={modelo.descricao} 
                        onChange={(e) => atualizarModelo('descricao', e.target.value)}
                        placeholder="Descrição do modelo de etiqueta"
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <h3 className="text-base font-medium flex items-center gap-1">
                      Dimensões da Etiqueta
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Defina o tamanho da etiqueta em milímetros</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="largura">Largura (mm)</Label>
                        <Input 
                          id="largura" 
                          type="number" 
                          value={modelo.largura} 
                          onChange={(e) => atualizarModelo('largura', Number(e.target.value))}
                          min={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="altura">Altura (mm)</Label>
                        <Input 
                          id="altura" 
                          type="number" 
                          value={modelo.altura} 
                          onChange={(e) => atualizarModelo('altura', Number(e.target.value))}
                          min={1}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <h3 className="text-base font-medium flex items-center gap-1">
                      Configurações da Página
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Configurações da página para impressão</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="formatoPagina">Formato da Página</Label>
                      <Select 
                        value={modelo.formatoPagina} 
                        onValueChange={(value) => atualizarModelo('formatoPagina', value)}
                      >
                        <SelectTrigger id="formatoPagina">
                          <SelectValue placeholder="Selecione o formato" />
                        </SelectTrigger>
                        <SelectContent>
                          {formatoOptions.map((formato) => (
                            <SelectItem key={formato.value} value={formato.value}>
                              {formato.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {modelo.formatoPagina === "Personalizado" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="larguraPagina">Largura da Página (mm)</Label>
                          <Input 
                            id="larguraPagina" 
                            type="number" 
                            value={modelo.larguraPagina} 
                            onChange={(e) => atualizarModelo('larguraPagina', Number(e.target.value))}
                            min={1}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="alturaPagina">Altura da Página (mm)</Label>
                          <Input 
                            id="alturaPagina" 
                            type="number" 
                            value={modelo.alturaPagina} 
                            onChange={(e) => atualizarModelo('alturaPagina', Number(e.target.value))}
                            min={1}
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="orientacao">Orientação</Label>
                      <Select 
                        value={modelo.orientacao} 
                        onValueChange={(value: 'retrato' | 'paisagem') => atualizarModelo('orientacao', value)}
                      >
                        <SelectTrigger id="orientacao">
                          <SelectValue placeholder="Selecione a orientação" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="retrato">Retrato (vertical)</SelectItem>
                          <SelectItem value="paisagem">Paisagem (horizontal)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <h3 className="text-base font-medium flex items-center gap-1">
                      Margens da Página
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Margens entre o conteúdo e as bordas da página</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="margemSuperior">Margem Superior (mm)</Label>
                        <Input 
                          id="margemSuperior" 
                          type="number" 
                          value={modelo.margemSuperior} 
                          onChange={(e) => atualizarModelo('margemSuperior', Number(e.target.value))}
                          min={0}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="margemInferior">Margem Inferior (mm)</Label>
                        <Input 
                          id="margemInferior" 
                          type="number" 
                          value={modelo.margemInferior} 
                          onChange={(e) => atualizarModelo('margemInferior', Number(e.target.value))}
                          min={0}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="margemEsquerda">Margem Esquerda (mm)</Label>
                        <Input 
                          id="margemEsquerda" 
                          type="number" 
                          value={modelo.margemEsquerda} 
                          onChange={(e) => atualizarModelo('margemEsquerda', Number(e.target.value))}
                          min={0}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="margemDireita">Margem Direita (mm)</Label>
                        <Input 
                          id="margemDireita" 
                          type="number" 
                          value={modelo.margemDireita} 
                          onChange={(e) => atualizarModelo('margemDireita', Number(e.target.value))}
                          min={0}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <h3 className="text-base font-medium flex items-center gap-1">
                      Espaçamento entre Etiquetas
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Espaço entre etiquetas quando várias são impressas em uma página</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="espacamentoHorizontal">Horizontal (mm)</Label>
                        <Input 
                          id="espacamentoHorizontal" 
                          type="number" 
                          value={modelo.espacamentoHorizontal} 
                          onChange={(e) => atualizarModelo('espacamentoHorizontal', Number(e.target.value))}
                          min={0}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="espacamentoVertical">Vertical (mm)</Label>
                        <Input 
                          id="espacamentoVertical" 
                          type="number" 
                          value={modelo.espacamentoVertical} 
                          onChange={(e) => atualizarModelo('espacamentoVertical', Number(e.target.value))}
                          min={0}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="col-span-5 space-y-4">
                {validacaoEtiqueta && !validacaoEtiqueta.valido && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Problema nas dimensões</AlertTitle>
                    <AlertDescription>
                      {validacaoEtiqueta.mensagem}
                    </AlertDescription>
                  </Alert>
                )}

                {areaUtil && (
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm font-medium">
                      <strong>Área útil disponível:</strong> {areaUtil.largura.toFixed(1)} x {areaUtil.altura.toFixed(1)} mm
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Esta é a área disponível na página após aplicar as margens.
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 bg-muted p-2 rounded-md">
                  <span className="text-sm font-medium">Adicionar Elemento:</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => adicionarCampo('nome')}
                    className="gap-1"
                  >
                    <Tag className="h-4 w-4" />
                    Nome
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => adicionarCampo('codigo')}
                    className="gap-1"
                  >
                    <Tags className="h-4 w-4" />
                    Código
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => adicionarCampo('preco')}
                    className="gap-1"
                  >
                    <Tag className="h-4 w-4" />
                    Preço
                  </Button>
                  
                  {campoSelecionado !== null && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={removerCampoSelecionado}
                      className="ml-auto text-red-500 hover:text-red-700"
                    >
                      Remover Elemento
                    </Button>
                  )}
                </div>

                {campoSelecionado !== null && (
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <h3 className="text-base font-medium">
                        Propriedades do Elemento: {tiposCampo.find(t => t.value === modelo.campos[campoSelecionado].tipo)?.label}
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="campo-x">Posição X (mm)</Label>
                          <Input 
                            id="campo-x" 
                            type="number" 
                            value={modelo.campos[campoSelecionado].x} 
                            onChange={(e) => atualizarCampo(campoSelecionado, 'x', Number(e.target.value))}
                            min={0}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="campo-y">Posição Y (mm)</Label>
                          <Input 
                            id="campo-y" 
                            type="number" 
                            value={modelo.campos[campoSelecionado].y} 
                            onChange={(e) => atualizarCampo(campoSelecionado, 'y', Number(e.target.value))}
                            min={0}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="campo-largura">Largura (mm)</Label>
                          <Input 
                            id="campo-largura" 
                            type="number" 
                            value={modelo.campos[campoSelecionado].largura} 
                            onChange={(e) => atualizarCampo(campoSelecionado, 'largura', Number(e.target.value))}
                            min={1}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="campo-altura">Altura (mm)</Label>
                          <Input 
                            id="campo-altura" 
                            type="number" 
                            value={modelo.campos[campoSelecionado].altura} 
                            onChange={(e) => atualizarCampo(campoSelecionado, 'altura', Number(e.target.value))}
                            min={1}
                          />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="campo-tamanhoFonte">Tamanho da Fonte (pt)</Label>
                          <div className="flex items-center gap-4">
                            <Slider 
                              id="campo-tamanhoFonte"
                              min={5}
                              max={24}
                              step={1}
                              value={[modelo.campos[campoSelecionado].tamanhoFonte]}
                              onValueChange={(value) => atualizarCampo(campoSelecionado, 'tamanhoFonte', value[0])}
                              className="flex-1"
                            />
                            <span className="w-8 text-center">{modelo.campos[campoSelecionado].tamanhoFonte}pt</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="bg-white border rounded-md shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between p-2 bg-muted">
                    <h3 className="text-sm font-medium">Visualização da Etiqueta</h3>
                    <ZoomControls 
                      zoomLevel={zoomLevel} 
                      onZoomIn={handleZoomIn} 
                      onZoomOut={handleZoomOut} 
                      onResetZoom={handleResetZoom}
                    />
                  </div>
                  
                  <div className="relative p-4 overflow-auto min-h-[300px] etiqueta-content">
                    <div 
                      className="relative mx-auto bg-white border shadow-sm etiqueta-grid"
                      style={{
                        width: modelo.largura * zoomLevel, 
                        height: modelo.altura * zoomLevel
                      }}
                      ref={etiquetaRef}
                      onClick={() => setCampoSelecionado(null)}
                      onMouseMove={arrastarCampo}
                      onMouseUp={finalizarArraste}
                      onMouseLeave={finalizarArraste}
                    >
                      {renderizarPosicaoElementos()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pageLayout" className="h-full overflow-auto">
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <h3 className="text-base font-medium">Configurações da Página</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Formato</Label>
                        <div className="text-sm">{modelo.formatoPagina === "Personalizado" 
                          ? `Personalizado (${modelo.larguraPagina} x ${modelo.alturaPagina} mm)` 
                          : formatoOptions.find(f => f.value === modelo.formatoPagina)?.label
                        }</div>
                      </div>
                      <div className="space-y-2">
                        <Label>Orientação</Label>
                        <div className="text-sm">{modelo.orientacao === "retrato" ? "Retrato (vertical)" : "Paisagem (horizontal)"}</div>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <Label>Margens (mm)</Label>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                          <div>Superior: {modelo.margemSuperior}</div>
                          <div>Inferior: {modelo.margemInferior}</div>
                          <div>Esquerda: {modelo.margemEsquerda}</div>
                          <div>Direita: {modelo.margemDireita}</div>
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <Label>Espaçamento entre Etiquetas (mm)</Label>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                          <div>Horizontal: {modelo.espacamentoHorizontal}</div>
                          <div>Vertical: {modelo.espacamentoVertical}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="col-span-2">
                  <CardContent className="pt-6 space-y-4">
                    <h3 className="text-base font-medium">Informações do Layout</h3>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Tamanho da Etiqueta</Label>
                        <div className="text-sm font-medium mt-1">{modelo.largura} x {modelo.altura} mm</div>
                      </div>
                      
                      {areaUtil && (
                        <div>
                          <Label>Área Útil Disponível</Label>
                          <div className="text-sm font-medium mt-1">{areaUtil.largura.toFixed(1)} x {areaUtil.altura.toFixed(1)} mm</div>
                        </div>
                      )}
                      
                      {areaUtil && (
                        <div>
                          <Label>Etiquetas por Página</Label>
                          <div className="text-sm font-medium mt-1">
                            {calcularEtiquetasPorPagina().etiquetasPorLinha * calcularEtiquetasPorPagina().etiquetasPorColuna} 
                            &nbsp;({calcularEtiquetasPorPagina().etiquetasPorLinha} x {calcularEtiquetasPorPagina().etiquetasPorColuna})
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium">Visualização do Layout da Página</h4>
                        <ZoomControls 
                          zoomLevel={zoomLevel} 
                          onZoomIn={handleZoomIn} 
                          onZoomOut={handleZoomOut} 
                          onResetZoom={handleResetZoom}
                        />
                      </div>
                      
                      {renderizarVisualizacaoPagina()}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="h-full overflow-auto">
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-medium">Pré-visualização da Etiqueta</h3>
                    <Button 
                      variant="outline" 
                      onClick={gerarPreview}
                    >
                      Gerar PDF de Pré-visualização
                    </Button>
                  </div>
                  
                  <div className="border border-dashed border-gray-300 relative bg-white p-4 rounded-md">
                    <div 
                      className="mx-auto border border-gray-200 shadow-sm"
                      style={{
                        width: modelo.largura * 3,
                        height: modelo.altura * 3,
                      }}
                    >
                      {modelo.campos.map((campo, index) => (
                        <div
                          key={`preview-${index}`}
                          className="absolute"
                          style={{
                            left: campo.x * 3,
                            top: campo.y * 3,
                            width: campo.largura * 3,
                            height: campo.altura * 3,
                          }}
                        >
                          <div className="w-full h-full flex items-center justify-center p-1">
                            <div 
                              className="text-center truncate w-full"
                              style={{ fontSize: campo.tamanhoFonte * 3 }}
                            >
                              {campo.tipo === 'nome' ? 'Pingente Coroa Cristal' :
                              campo.tipo === 'codigo' ? '123456789' : 
                              'R$ 59,90'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 text-sm text-gray-500 text-center">
                      Esta é uma prévia aproximada de como sua etiqueta aparecerá quando impressa.
                    </div>
                  </div>
                  
                  {showPreview && previewUrl && (
                    <div className="mt-4">
                      <div className="border rounded-md overflow-hidden">
                        <div className="bg-muted px-4 py-2 flex justify-between items-center">
                          <h3 className="text-sm font-medium">PDF de Pré-visualização</h3>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setShowPreview(false)}
                          >
                            Fechar
                          </Button>
                        </div>
                        <iframe
                          src={previewUrl}
                          className="w-full h-[500px] border-0"
                          title="Pré-visualização do PDF"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-background border-t mt-4">
        <Button 
          variant="outline" 
          onClick={onClose}
        >
          Cancelar
        </Button>
        <Button 
          onClick={salvarModelo}
          disabled={isLoading || (validacaoEtiqueta && !validacaoEtiqueta.valido)}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isLoading ? "Salvando..." : (modelo.id ? "Atualizar Modelo" : "Salvar Modelo")}
        </Button>
      </div>
    </div>
  );
}
