import { useState, useEffect, useRef, useCallback } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { 
  AlertCircle, 
  MoveIcon,
  PanelLeftIcon,
  GripVertical,
  Ruler,
  Settings,
  Copy,
  LayoutGrid,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CampoEtiqueta } from "@/types/etiqueta";

const MAX_ZOOM = 5; // 500%
const MIN_ZOOM = 0.3; // 30%

interface EtiquetaEditorProps {
  campos: CampoEtiqueta[];
  largura: number;
  altura: number;
  formatoPagina: string;
  orientacao: string;
  margemSuperior: number;
  margemInferior: number;
  margemEsquerda: number;
  margemDireita: number;
  espacamentoHorizontal: number;
  espacamentoVertical: number;
  larguraPagina?: number;
  alturaPagina?: number;
  onCamposChange: (campos: CampoEtiqueta[]) => void;
  onDimensoesChange?: (largura: number, altura: number) => void;
  onMargensChange?: (margemSuperior: number, margemInferior: number, margemEsquerda: number, margemDireita: number) => void;
  onEspacamentoChange?: (espacamentoHorizontal: number, espacamentoVertical: number) => void;
  onFormatoChange?: (formatoPagina: string, orientacao: string, larguraPagina?: number, alturaPagina?: number) => void;
  showPageView?: boolean;
}

function DraggableCampo({ campo, index, onSelect, isSelected }: { 
  campo: CampoEtiqueta; 
  index: number;
  onSelect: (index: number) => void;
  isSelected: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `campo-${campo.tipo}-${index}`,
  });

  const style = transform ? {
    transform: CSS.Transform.toString(transform),
  } : undefined;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(index);
  };

  return (
    <div 
      ref={setNodeRef} 
      {...listeners} 
      {...attributes}
      className={`cursor-move absolute etiqueta-item ${isSelected ? 'selected' : ''}`}
      style={{
        ...style,
        left: campo.x,
        top: campo.y,
        width: campo.largura,
        height: campo.altura,
      }}
      onClick={handleClick}
    >
      <div className="text-xs truncate">
        {campo.tipo === 'nome' ? 'Nome do Produto' :
        campo.tipo === 'codigo' ? 'Código de Barras' : 'Preço'}
      </div>
    </div>
  );
}

function ElementoPaleta({ tipo, onAdd }: { 
  tipo: 'nome' | 'codigo' | 'preco'; 
  onAdd: (tipo: 'nome' | 'codigo' | 'preco') => void;
}) {
  return (
    <div 
      className="cursor-pointer p-2 bg-white border rounded shadow-sm hover:bg-gray-50 flex items-center gap-2"
      onClick={() => onAdd(tipo)}
    >
      <GripVertical className="h-4 w-4 text-gray-400" />
      {tipo === 'nome' ? 'Nome do Produto' :
       tipo === 'codigo' ? 'Código de Barras' : 'Preço'}
    </div>
  );
}

export function EtiquetaEditor({
  campos,
  largura,
  altura,
  formatoPagina,
  orientacao,
  margemSuperior,
  margemInferior,
  margemEsquerda,
  margemDireita,
  espacamentoHorizontal,
  espacamentoVertical,
  larguraPagina,
  alturaPagina,
  onCamposChange,
  onDimensoesChange,
  onMargensChange,
  onEspacamentoChange,
  onFormatoChange,
  showPageView = false
}: EtiquetaEditorProps) {
  const [warning, setWarning] = useState<string | null>(null);
  const [selectedCampoIndex, setSelectedCampoIndex] = useState<number | null>(null);
  const [localLargura, setLocalLargura] = useState(largura);
  const [localAltura, setLocalAltura] = useState(altura);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("etiqueta");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  
  const [localFormatoPagina, setLocalFormatoPagina] = useState(formatoPagina);
  const [localOrientacao, setLocalOrientacao] = useState(orientacao);
  const [localMargemSuperior, setLocalMargemSuperior] = useState(margemSuperior);
  const [localMargemInferior, setLocalMargemInferior] = useState(margemInferior);
  const [localMargemEsquerda, setLocalMargemEsquerda] = useState(margemEsquerda);
  const [localMargemDireita, setLocalMargemDireita] = useState(margemDireita);
  const [localEspacamentoHorizontal, setLocalEspacamentoHorizontal] = useState(espacamentoHorizontal);
  const [localEspacamentoVertical, setLocalEspacamentoVertical] = useState(espacamentoVertical);
  const [localLarguraPagina, setLocalLarguraPagina] = useState(larguraPagina || 210);
  const [localAlturaPagina, setLocalAlturaPagina] = useState(alturaPagina || 297);
  
  const pageViewRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  
  const { setNodeRef } = useDroppable({
    id: 'etiqueta-area',
  });

  useEffect(() => {
    setLocalLargura(largura);
    setLocalAltura(altura);
    setLocalFormatoPagina(formatoPagina);
    setLocalOrientacao(orientacao);
    setLocalMargemSuperior(margemSuperior);
    setLocalMargemInferior(margemInferior);
    setLocalMargemEsquerda(margemEsquerda);
    setLocalMargemDireita(margemDireita);
    setLocalEspacamentoHorizontal(espacamentoHorizontal);
    setLocalEspacamentoVertical(espacamentoVertical);
    setLocalLarguraPagina(larguraPagina || 210);
    setLocalAlturaPagina(alturaPagina || 297);
  }, [
    largura, 
    altura, 
    formatoPagina, 
    orientacao, 
    margemSuperior, 
    margemInferior, 
    margemEsquerda,
    margemDireita,
    espacamentoHorizontal,
    espacamentoVertical,
    larguraPagina,
    alturaPagina
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          handleZoomIn();
        } else if (e.key === '-') {
          e.preventDefault();
          handleZoomOut();
        } else if (e.key === '0') {
          e.preventDefault();
          handleResetZoom();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [zoomLevel]);

  const handleDimensoesChange = () => {
    if (onDimensoesChange) {
      onDimensoesChange(localLargura, localAltura);
    }
    
    const camposAjustados = campos.map(campo => {
      let ajustado = { ...campo };
      
      if (campo.x + campo.largura > localLargura) {
        if (campo.x < localLargura) {
          ajustado.largura = localLargura - campo.x;
        } else {
          ajustado.x = Math.max(0, localLargura - campo.largura);
        }
      }
      
      if (campo.y + campo.altura > localAltura) {
        if (campo.y < localAltura) {
          ajustado.altura = localAltura - campo.y;
        } else {
          ajustado.y = Math.max(0, localAltura - campo.altura);
        }
      }
      
      return ajustado;
    });
    
    onCamposChange(camposAjustados);
  };

  const handlePaginaChange = () => {
    if (onFormatoChange) {
      onFormatoChange(
        localFormatoPagina, 
        localOrientacao, 
        localFormatoPagina === "Personalizado" ? localLarguraPagina : undefined,
        localFormatoPagina === "Personalizado" ? localAlturaPagina : undefined
      );
    }
    
    if (onMargensChange) {
      onMargensChange(
        localMargemSuperior,
        localMargemInferior,
        localMargemEsquerda,
        localMargemDireita
      );
    }
    
    if (onEspacamentoChange) {
      onEspacamentoChange(
        localEspacamentoHorizontal,
        localEspacamentoVertical
      );
    }
    
    validarEtiquetaNaPagina();
  };

  const validarEtiquetaNaPagina = () => {
    const areaUtilLargura = localLarguraPagina - localMargemEsquerda - localMargemDireita;
    const areaUtilAltura = localAlturaPagina - localMargemSuperior - localMargemInferior;
    
    if (localLargura > areaUtilLargura) {
      setWarning(`A largura da etiqueta (${localLargura}mm) excede a área útil da página (${areaUtilLargura}mm). Por favor, reduza a largura da etiqueta ou aumente a largura da página.`);
      return false;
    }
    
    if (localAltura > areaUtilAltura) {
      setWarning(`A altura da etiqueta (${localAltura}mm) excede a área útil da página (${areaUtilAltura}mm). Por favor, reduza a altura da etiqueta ou aumente a altura da página.`);
      return false;
    }
    
    setWarning(null);
    return true;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setIsDragging(true);
    const { active } = event;
    const idParts = String(active.id).split('-');
    const index = Number(idParts[2]);
    
    if (!isNaN(index) && index >= 0 && index < campos.length) {
      setSelectedCampoIndex(index);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragging(false);
    const { active, delta } = event;
    const idParts = String(active.id).split('-');
    const tipo = idParts[1] as 'nome' | 'codigo' | 'preco';
    const index = Number(idParts[2]);
    
    if (isNaN(index) || index < 0 || index >= campos.length) return;

    const novosCampos = [...campos];
    const campo = novosCampos[index];
    
    const novoX = campo.x + delta.x / zoomLevel;
    const novoY = campo.y + delta.y / zoomLevel;
    
    if (novoX < 0 || novoX + campo.largura > localLargura || 
        novoY < 0 || novoY + campo.altura > localAltura) {
      
      const xAjustado = Math.max(0, Math.min(novoX, localLargura - campo.largura));
      const yAjustado = Math.max(0, Math.min(novoY, localAltura - campo.altura));
      
      novosCampos[index] = {
        ...campo,
        x: xAjustado,
        y: yAjustado,
      };
      
      setWarning("O elemento foi ajustado para ficar dentro dos limites da etiqueta");
      setTimeout(() => setWarning(null), 3000);
    } else {
      novosCampos[index] = {
        ...campo,
        x: novoX,
        y: novoY,
      };
      setWarning(null);
    }
    
    onCamposChange(novosCampos);
  };

  const handleCampoSelect = (index: number) => {
    setSelectedCampoIndex(index);
  };

  const handleEditorAreaClick = () => {
    setSelectedCampoIndex(null);
  };

  const handleUpdateCampo = (campoIndex: number, propriedade: string, valor: number) => {
    if (campoIndex === null || campoIndex < 0 || campoIndex >= campos.length) return;

    const novosCampos = [...campos];
    const campo = { ...novosCampos[campoIndex] };

    switch (propriedade) {
      case 'x':
        if (valor < 0 || valor + campo.largura > localLargura) {
          const valorAjustado = Math.max(0, Math.min(valor, localLargura - campo.largura));
          setWarning(`A posição X foi ajustada para ${valorAjustado}mm para manter o elemento dentro da etiqueta`);
          campo.x = valorAjustado;
        } else {
          campo.x = valor;
          setWarning(null);
        }
        break;
      case 'y':
        if (valor < 0 || valor + campo.altura > localAltura) {
          const valorAjustado = Math.max(0, Math.min(valor, localAltura - campo.altura));
          setWarning(`A posição Y foi ajustada para ${valorAjustado}mm para manter o elemento dentro da etiqueta`);
          campo.y = valorAjustado;
        } else {
          campo.y = valor;
          setWarning(null);
        }
        break;
      case 'tamanhoFonte':
        if (valor < 5 || valor > 24) {
          const valorAjustado = Math.max(5, Math.min(valor, 24));
          setWarning(`O tamanho da fonte foi ajustado para ${valorAjustado}pt (entre 5pt e 24pt)`);
          campo.tamanhoFonte = valorAjustado;
        } else {
          campo.tamanhoFonte = valor;
          setWarning(null);
        }
        break;
      case 'largura':
        if (valor <= 0 || campo.x + valor > localLargura) {
          const valorAjustado = Math.max(1, Math.min(valor, localLargura - campo.x));
          setWarning(`A largura foi ajustada para ${valorAjustado}mm para manter o elemento dentro da etiqueta`);
          campo.largura = valorAjustado;
        } else {
          campo.largura = valor;
          setWarning(null);
        }
        break;
      case 'altura':
        if (valor <= 0 || campo.y + valor > localAltura) {
          const valorAjustado = Math.max(1, Math.min(valor, localAltura - campo.y));
          setWarning(`A altura foi ajustada para ${valorAjustado}mm para manter o elemento dentro da etiqueta`);
          campo.altura = valorAjustado;
        } else {
          campo.altura = valor;
          setWarning(null);
        }
        break;
    }

    novosCampos[campoIndex] = campo;
    onCamposChange(novosCampos);
  };

  const handleAddElemento = (tipo: 'nome' | 'codigo' | 'preco') => {
    const existente = campos.find(c => c.tipo === tipo);
    if (existente) {
      setWarning("Este elemento já existe na etiqueta");
      setTimeout(() => setWarning(null), 3000);
      return;
    }
    
    let novoCampo: CampoEtiqueta;
    switch (tipo) {
      case 'nome':
        novoCampo = { tipo, x: 2, y: 4, largura: Math.min(40, localLargura - 4), altura: Math.min(10, localAltura - 8), tamanhoFonte: 7 };
        break;
      case 'codigo':
        novoCampo = { tipo, x: 2, y: 15, largura: Math.min(40, localLargura - 4), altura: Math.min(6, localAltura - 18), tamanhoFonte: 8 };
        break;
      case 'preco':
        novoCampo = { tipo, x: Math.max(2, localLargura - 22), y: 4, largura: Math.min(20, localLargura / 4), altura: Math.min(10, localAltura - 8), tamanhoFonte: 10 };
        break;
    }
    
    const novosCampos = [...campos, novoCampo];
    setWarning(null);
    onCamposChange(novosCampos);
    setSelectedCampoIndex(novosCampos.length - 1);
  };

  const removerElementoSelecionado = () => {
    if (selectedCampoIndex !== null && selectedCampoIndex >= 0 && selectedCampoIndex < campos.length) {
      const novosCampos = [...campos];
      novosCampos.splice(selectedCampoIndex, 1);
      onCamposChange(novosCampos);
      setSelectedCampoIndex(null);
    }
  };

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => {
      const newZoom = Math.min(prev + 0.2, MAX_ZOOM);
      return parseFloat(newZoom.toFixed(1));
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => {
      const newZoom = Math.max(prev - 0.2, MIN_ZOOM);
      return parseFloat(newZoom.toFixed(1));
    });
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoomLevel(1);
  }, []);

  const calcularEtiquetasPorPagina = () => {
    const areaUtilLargura = localLarguraPagina - localMargemEsquerda - localMargemDireita;
    const areaUtilAltura = localAlturaPagina - localMargemSuperior - localMargemInferior;
    
    const etiquetasPorLinha = Math.floor((areaUtilLargura + localEspacamentoHorizontal) / (localLargura + localEspacamentoHorizontal));
    const etiquetasPorColuna = Math.floor((areaUtilAltura + localEspacamentoVertical) / (localAltura + localEspacamentoVertical));
    
    return {
      etiquetasPorLinha,
      etiquetasPorColuna,
      total: etiquetasPorLinha * etiquetasPorColuna
    };
  };

  const renderizarPaginaCompleta = () => {
    const { etiquetasPorLinha, etiquetasPorColuna } = calcularEtiquetasPorPagina();
    
    const escala = 0.7 * zoomLevel;
    const larguraPaginaEscalada = localLarguraPagina * escala;
    const alturaPaginaEscalada = localAlturaPagina * escala;
    
    const margemSuperiorEscalada = localMargemSuperior * escala;
    const margemInferiorEscalada = localMargemInferior * escala;
    const margemEsquerdaEscalada = localMargemEsquerda * escala;
    const margemDireitaEscalada = localMargemDireita * escala;
    
    const larguraEtiquetaEscalada = localLargura * escala;
    const alturaEtiquetaEscalada = localAltura * escala;
    
    const espacamentoHorizontalEscalado = localEspacamentoHorizontal * escala;
    const espacamentoVerticalEscalado = localEspacamentoVertical * escala;
    
    if (etiquetasPorLinha <= 0 || etiquetasPorColuna <= 0) {
      return (
        <div className="bg-white p-4 rounded border">
          <div className="text-center text-amber-600 p-4 border border-amber-200 bg-amber-50 rounded">
            <AlertCircle className="h-5 w-5 mx-auto mb-2" />
            <h3 className="font-medium">Não é possível exibir a página</h3>
            <p className="text-sm mt-1">
              As dimensões da etiqueta são muito grandes para a área útil da página com as margens atuais.
              Ajuste o tamanho da etiqueta ou as margens da página.
            </p>
          </div>
        </div>
      );
    }
    
    const etiquetas = [];
    
    for (let linha = 0; linha < etiquetasPorColuna; linha++) {
      for (let coluna = 0; coluna < etiquetasPorLinha; coluna++) {
        const posX = margemEsquerdaEscalada + coluna * (larguraEtiquetaEscalada + espacamentoHorizontalEscalado);
        const posY = margemSuperiorEscalada + linha * (alturaEtiquetaEscalada + espacamentoVerticalEscalado);
        
        etiquetas.push(
          <div 
            key={`etiqueta-${linha}-${coluna}`}
            className={`absolute border ${linha === 0 && coluna === 0 ? 
              'border-blue-500 bg-blue-50/30' : 'border-dashed border-gray-400'} 
              ${showGrid ? 'etiqueta-grid' : ''}`}
            style={{
              left: `${posX}px`,
              top: `${posY}px`,
              width: `${larguraEtiquetaEscalada}px`,
              height: `${alturaEtiquetaEscalada}px`,
              backgroundSize: `${5 * escala}px ${5 * escala}px`
            }}
          >
            {linha === 0 && coluna === 0 && (
              <>
                {campos.map((campo, index) => (
                  <div
                    key={`campo-preview-${index}`}
                    className="absolute border border-dotted border-gray-400"
                    style={{
                      left: campo.x * escala,
                      top: campo.y * escala,
                      width: campo.largura * escala,
                      height: campo.altura * escala,
                      fontSize: campo.tamanhoFonte * escala,
                      overflow: 'hidden'
                    }}
                  >
                    <div className="text-xs truncate overflow-ellipsis p-1">
                      {campo.tipo === 'nome' ? 'Nome do Produto' :
                      campo.tipo === 'codigo' ? 'Código de Barras' : 'Preço'}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        );
      }
    }
    
    return (
      <div className="bg-white border rounded p-4 mt-4 etiqueta-editor-container">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            Visualização da Página
          </h3>
          <div className="text-sm text-gray-500">
            {etiquetasPorLinha} × {etiquetasPorColuna} = {etiquetasPorLinha * etiquetasPorColuna} etiquetas por página
          </div>
        </div>
        
        <div className="overflow-auto max-h-[50vh] relative">
          <div 
            ref={pageViewRef}
            className="relative etiqueta-page-background mx-auto"
            style={{
              width: `${larguraPaginaEscalada}px`,
              height: `${alturaPaginaEscalada}px`,
            }}
          >
            <div
              className="absolute border-2 border-gray-300 border-dashed"
              style={{
                left: `${margemEsquerdaEscalada}px`,
                top: `${margemSuperiorEscalada}px`,
                width: `${larguraPaginaEscalada - margemEsquerdaEscalada - margemDireitaEscalada}px`,
                height: `${alturaPaginaEscalada - margemSuperiorEscalada - margemInferiorEscalada}px`,
              }}
            />
            
            {etiquetas}
          </div>
        </div>
        
        <div className="flex justify-between mt-3">
          <div className="text-sm text-gray-500">
            A primeira etiqueta (destacada em azul) mostra o conteúdo configurado no editor.
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowGrid(!showGrid)}
              className="h-8 px-2"
            >
              {showGrid ? "Ocultar Grade" : "Mostrar Grade"}
            </Button>
          </div>
        </div>
        
        <div className="zoom-controls">
          <button onClick={handleZoomIn} title="Aproximar">
            <ZoomIn className="h-4 w-4" />
          </button>
          <button onClick={handleZoomOut} title="Afastar">
            <ZoomOut className="h-4 w-4" />
          </button>
          <button onClick={handleResetZoom} title="Redefinir Zoom">
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  const renderizarEditorEtiqueta = () => {
    return (
      <DndContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
        <div className="flex gap-4">
          <div className="w-48 space-y-4 p-4 bg-gray-50 rounded border">
            <div className="flex items-center gap-2 font-medium mb-2">
              <PanelLeftIcon className="h-4 w-4" />
              <h3>Elementos Disponíveis</h3>
            </div>
            <div className="space-y-2">
              {['nome', 'codigo', 'preco'].filter(tipo => 
                !campos.some(c => c.tipo === tipo)
              ).map(tipo => (
                <ElementoPaleta 
                  key={tipo} 
                  tipo={tipo as 'nome' | 'codigo' | 'preco'} 
                  onAdd={handleAddElemento} 
                />
              ))}
            </div>
            
            {campos.length > 0 && (
              <>
                <div className="border-t my-3"></div>
                <div className="font-medium mb-2">Elementos na Etiqueta</div>
                <div className="space-y-2">
                  {campos.map((campo, index) => (
                    <div 
                      key={`list-${campo.tipo}-${index}`}
                      className={`p-2 rounded cursor-pointer ${selectedCampoIndex === index ? 'bg-blue-50 border border-blue-200' : 'bg-white border'}`}
                      onClick={() => handleCampoSelect(index)}
                    >
                      <div className="text-sm flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        {campo.tipo === 'nome' ? 'Nome do Produto' :
                         campo.tipo === 'codigo' ? 'Código de Barras' : 'Preço'}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          
          <div className="flex-1 flex flex-col">
            <div className="bg-white border rounded p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium flex items-center gap-2">
                  <MoveIcon className="h-4 w-4" />
                  Área de Edição
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="largura-etiqueta" className="text-sm whitespace-nowrap">Largura (mm):</Label>
                    <Input
                      id="largura-etiqueta"
                      type="number"
                      className="w-20 h-8"
                      value={localLargura}
                      onChange={(e) => setLocalLargura(Number(e.target.value))}
                      onBlur={handleDimensoesChange}
                      min={10}
                      max={210}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="altura-etiqueta" className="text-sm whitespace-nowrap">Altura (mm):</Label>
                    <Input
                      id="altura-etiqueta"
                      type="number"
                      className="w-20 h-8"
                      value={localAltura}
                      onChange={(e) => setLocalAltura(Number(e.target.value))}
                      onBlur={handleDimensoesChange}
                      min={5}
                      max={297}
                    />
                  </div>
                </div>
              </div>
              
              <div className="relative mx-auto" ref={editorContainerRef}>
                <div 
                  ref={setNodeRef}
                  className={`relative ${showGrid ? 'etiqueta-grid' : ''} border rounded overflow-hidden ${isDragging ? 'border-blue-400' : 'border-gray-300'}`}
                  style={{
                    width: `${localLargura * zoomLevel}px`,
                    height: `${localAltura * zoomLevel}px`,
                    backgroundSize: `${10 * zoomLevel}px ${10 * zoomLevel}px`
                  }}
                  onClick={handleEditorAreaClick}
                >
                  {campos.map((campo, index) => (
                    <DraggableCampo
                      key={`${campo.tipo}-${index}`}
                      campo={{
                        ...campo,
                        x: campo.x * zoomLevel,
                        y: campo.y * zoomLevel,
                        largura: campo.largura * zoomLevel,
                        altura: campo.altura * zoomLevel
                      }}
                      index={index}
                      onSelect={handleCampoSelect}
                      isSelected={selectedCampoIndex === index}
                    />
                  ))}
                </div>
                
                <div className="zoom-controls">
                  <button 
                    onClick={handleZoomOut} 
                    title="Diminuir Zoom (Ctrl -)"
                    type="button"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  
                  <div className="zoom-level">
                    {Math.round(zoomLevel * 100)}%
                  </div>
                  
                  <button 
                    onClick={handleZoomIn} 
                    title="Aumentar Zoom (Ctrl +)"
                    type="button"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  
                  <button 
                    onClick={handleResetZoom} 
                    title="Redefinir Zoom (Ctrl 0)"
                    type="button"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 mt-2 text-center">
                Tamanho real da etiqueta: {localLargura}mm × {localAltura}mm
                {zoomLevel !== 1 && ` (zoom: ${Math.round(zoomLevel * 100)}%)`}
              </div>
            </div>
            
            {selectedCampoIndex !== null && selectedCampoIndex >= 0 && selectedCampoIndex < campos.length && (
              <div className="bg-white border rounded p-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium mb-4">Propriedades do Elemento</h3>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={removerElementoSelecionado}
                    className="h-7 px-2"
                  >
                    Remover
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Posição X (mm)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-1.5 border rounded"
                      value={campos[selectedCampoIndex].x}
                      onChange={(e) => handleUpdateCampo(selectedCampoIndex, 'x', Number(e.target.value))}
                      min={0}
                      max={localLargura - campos[selectedCampoIndex].largura}
                      step={0.5}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Posição Y (mm)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-1.5 border rounded"
                      value={campos[selectedCampoIndex].y}
                      onChange={(e) => handleUpdateCampo(selectedCampoIndex, 'y', Number(e.target.value))}
                      min={0}
                      max={localAltura - campos[selectedCampoIndex].altura}
                      step={0.5}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Largura (mm)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-1.5 border rounded"
                      value={campos[selectedCampoIndex].largura}
                      onChange={(e) => handleUpdateCampo(selectedCampoIndex, 'largura', Number(e.target.value))}
                      min={1}
                      max={localLargura - campos[selectedCampoIndex].x}
                      step={0.5}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Altura (mm)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-1.5 border rounded"
                      value={campos[selectedCampoIndex].altura}
                      onChange={(e) => handleUpdateCampo(selectedCampoIndex, 'altura', Number(e.target.value))}
                      min={1}
                      max={localAltura - campos[selectedCampoIndex].y}
                      step={0.5}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tamanho da Fonte (pt)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-1.5 border rounded"
                      value={campos[selectedCampoIndex].tamanhoFonte}
                      onChange={(e) => handleUpdateCampo(selectedCampoIndex, 'tamanhoFonte', Number(e.target.value))}
                      min={5}
                      max={24}
                      step={0.5}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DndContext>
    );
  };

  const renderizarConfigPagina = () => {
    return (
      <div className="space-y-4">
        <Tabs defaultValue="formato" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="formato" className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Formato da Página
            </TabsTrigger>
            <TabsTrigger value="margens" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Margens e Espaçamentos
            </TabsTrigger>
            <TabsTrigger value="visualizacao" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Visualização
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="formato" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="formato-pagina">Formato da Página</Label>
                <Select 
                  value={localFormatoPagina} 
                  onValueChange={(valor) => {
                    setLocalFormatoPagina(valor);
                    
                    if (valor === "A4") {
                      setLocalLarguraPagina(210);
                      setLocalAlturaPagina(297);
                    } else if (valor === "Letter") {
                      setLocalLarguraPagina(216);
                      setLocalAlturaPagina(279);
                    } else if (valor === "Legal") {
                      setLocalLarguraPagina(216);
                      setLocalAlturaPagina(356);
                    }
                    
                    setTimeout(handlePaginaChange, 0);
                  }}
                >
                  <SelectTrigger id="formato-pagina">
                    <SelectValue placeholder="Selecione o formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4</SelectItem>
                    <SelectItem value="Letter">Letter</SelectItem>
                    <SelectItem value="Legal">Legal</SelectItem>
                    <SelectItem value="Personalizado">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="orientacao">Orientação</Label>
                <Select 
                  value={localOrientacao} 
                  onValueChange={(valor) => {
                    setLocalOrientacao(valor);
                    
                    if (valor !== localOrientacao) {
                      const temp = localLarguraPagina;
                      setLocalLarguraPagina(localAlturaPagina);
                      setLocalAlturaPagina(temp);
                    }
                    
                    setTimeout(handlePaginaChange, 0);
                  }}
                >
                  <SelectTrigger id="orientacao">
                    <SelectValue placeholder="Selecione a orientação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retrato">Retrato</SelectItem>
                    <SelectItem value="paisagem">Paisagem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {localFormatoPagina === "Personalizado" && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="largura-pagina">Largura da Página (mm)</Label>
                  <Input
                    id="largura-pagina"
                    type="number"
                    value={localLarguraPagina}
                    onChange={(e) => setLocalLarguraPagina(Number(e.target.value))}
                    onBlur={handlePaginaChange}
                    min={50}
                    max={420}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="altura-pagina">Altura da Página (mm)</Label>
                  <Input
                    id="altura-pagina"
                    type="number"
                    value={localAlturaPagina}
                    onChange={(e) => setLocalAlturaPagina(Number(e.target.value))}
                    onBlur={handlePaginaChange}
                    min={50}
                    max={420}
                  />
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="margens" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="margem-superior">Margem Superior (mm)</Label>
                <Input
                  id="margem-superior"
                  type="number"
                  value={localMargemSuperior}
                  onChange={(e) => setLocalMargemSuperior(Number(e.target.value))}
                  onBlur={handlePaginaChange}
                  min={0}
                  max={50}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="margem-inferior">Margem Inferior (mm)</Label>
                <Input
                  id="margem-inferior"
                  type="number"
                  value={localMargemInferior}
                  onChange={(e) => setLocalMargemInferior(Number(e.target.value))}
                  onBlur={handlePaginaChange}
                  min={0}
                  max={50}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="margem-esquerda">Margem Esquerda (mm)</Label>
                <Input
                  id="margem-esquerda"
                  type="number"
                  value={localMargemEsquerda}
                  onChange={(e) => setLocalMargemEsquerda(Number(e.target.value))}
                  onBlur={handlePaginaChange}
                  min={0}
                  max={50}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="margem-direita">Margem Direita (mm)</Label>
                <Input
                  id="margem-direita"
                  type="number"
                  value={localMargemDireita}
                  onChange={(e) => setLocalMargemDireita(Number(e.target.value))}
                  onBlur={handlePaginaChange}
                  min={0}
                  max={50}
                />
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="espacamento-horizontal">Espaçamento Horizontal (mm)</Label>
                <Input
                  id="espacamento-horizontal"
                  type="number"
                  value={localEspacamentoHorizontal}
                  onChange={(e) => setLocalEspacamentoHorizontal(Number(e.target.value))}
                  onBlur={handlePaginaChange}
                  min={0}
                  max={20}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="espacamento-vertical">Espaçamento Vertical (mm)</Label>
                <Input
                  id="espacamento-vertical"
                  type="number"
                  value={localEspacamentoVertical}
                  onChange={(e) => setLocalEspacamentoVertical(Number(e.target.value))}
                  onBlur={handlePaginaChange}
                  min={0}
                  max={20}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="visualizacao">
            {renderizarPaginaCompleta()}
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {showPageView ? (
        <>
          {renderizarConfigPagina()}
          {renderizarPaginaCompleta()}
        </>
      ) : (
        renderizarEditorEtiqueta()
      )}

      {warning && (
        <Alert variant="warning" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atenção</AlertTitle>
          <AlertDescription>{warning}</AlertDescription>
        </Alert>
      )}

      <div className="p-3 bg-gray-50 border rounded mt-4">
        <h4 className="text-sm font-medium mb-2">Dicas de uso:</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Arraste os elementos para posicioná-los na etiqueta</li>
          <li>• Clique em um elemento para editar suas propriedades</li>
          <li>• Use os controles de zoom (até 500%) para ajustar a visualização</li>
          <li>• Utilize Ctrl + (+) para aumentar, Ctrl + (-) para diminuir e Ctrl + 0 para redefinir o zoom</li>
          <li>• Configure a página e as margens para optimizar a impressão</li>
          <li>• Visualize a disposição das etiquetas na página antes de salvar</li>
        </ul>
      </div>
    </div>
  );
}

