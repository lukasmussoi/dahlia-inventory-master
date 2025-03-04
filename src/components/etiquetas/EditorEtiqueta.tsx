
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, Save, Move, X, Plus, ChevronsLeft, ChevronsUp, ChevronsRight, ChevronsDown } from "lucide-react";
import { EtiquetaCustomController } from "@/controllers/etiquetaCustomController";
import { ModeloEtiqueta, CampoEtiqueta } from "@/models/etiquetaCustomModel";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface EditorEtiquetaProps {
  modelo?: ModeloEtiqueta | null;
  onSalvar: () => void;
  onCancelar: () => void;
}

// Função para gerar um modelo padrão vazio
const gerarModeloPadrao = (): Omit<ModeloEtiqueta, 'id' | 'criado_em' | 'atualizado_em' | 'criado_por'> => ({
  descricao: '',
  tipo: 'produto',
  largura: 90,
  altura: 30,
  espacamentoHorizontal: 0,
  espacamentoVertical: 0,
  formatoPagina: 'A4',
  orientacao: 'retrato',
  margemSuperior: 10,
  margemInferior: 10,
  margemEsquerda: 10,
  margemDireita: 10,
  campos: []
});

export default function EditorEtiqueta({ modelo, onSalvar, onCancelar }: EditorEtiquetaProps) {
  const [novoModelo, setNovoModelo] = useState<Omit<ModeloEtiqueta, 'id' | 'criado_em' | 'atualizado_em' | 'criado_por'>>(
    modelo || gerarModeloPadrao()
  );
  const [camposDisponiveis, setCamposDisponiveis] = useState<string[]>([]);
  const [campoSelecionado, setCampoSelecionado] = useState<CampoEtiqueta | null>(null);
  const [campoPersonalizado, setCampoPersonalizado] = useState<string>('');
  const [formatoPersonalizado, setFormatoPersonalizado] = useState(false);
  const etiquetaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Carregar campos disponíveis quando o tipo muda
  useEffect(() => {
    const campos = EtiquetaCustomController.getCamposDisponiveis(novoModelo.tipo);
    setCamposDisponiveis(campos);
  }, [novoModelo.tipo]);

  // Atualizar visualização da página quando as dimensões mudam
  useEffect(() => {
    if (canvasRef.current) {
      desenharVisualizacaoPagina();
    }
  }, [
    novoModelo.largura, 
    novoModelo.altura, 
    novoModelo.espacamentoHorizontal, 
    novoModelo.espacamentoVertical,
    novoModelo.formatoPagina,
    novoModelo.orientacao,
    novoModelo.larguraPagina,
    novoModelo.alturaPagina,
    novoModelo.margemSuperior,
    novoModelo.margemInferior,
    novoModelo.margemEsquerda,
    novoModelo.margemDireita
  ]);

  const handleChangeCampo = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { name: string, value: any }) => {
    if (!campoSelecionado) return;
    
    const name = 'name' in e ? e.name : e.target.name;
    const value = 'value' in e ? e.value : e.target.value;
    
    const camposAtualizados = novoModelo.campos.map(campo => 
      campo.id === campoSelecionado.id ? { ...campo, [name]: value } : campo
    );
    
    setNovoModelo({ ...novoModelo, campos: camposAtualizados });
    setCampoSelecionado(prev => prev ? { ...prev, [name]: value } : null);
  };
  
  const handleChangeModelo = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | { name: string, value: any }) => {
    const name = 'name' in e ? e.name : e.target.name;
    const value = 'value' in e ? e.value : e.target.value;
    
    // Para campos numéricos, converte para número
    const numericFields = [
      'largura', 'altura', 'espacamentoHorizontal', 'espacamentoVertical',
      'larguraPagina', 'alturaPagina', 'margemSuperior', 'margemInferior',
      'margemEsquerda', 'margemDireita'
    ];
    
    const parsedValue = numericFields.includes(name) ? parseFloat(value) : value;
    setNovoModelo({ ...novoModelo, [name]: parsedValue });
    
    // Verifica se precisa mostrar campos de formato personalizado
    if (name === 'formatoPagina') {
      setFormatoPersonalizado(value === 'personalizado');
    }
  };

  const adicionarCampo = (tipo: string) => {
    let valor = '';
    
    if (tipo === 'textoGenerico' && campoPersonalizado) {
      valor = campoPersonalizado;
      setCampoPersonalizado('');
    }
    
    const novoCampo = EtiquetaCustomController.gerarCampoNovo(tipo, valor);
    setNovoModelo({
      ...novoModelo,
      campos: [...novoModelo.campos, novoCampo]
    });
    toast.success('Campo adicionado. Arraste-o para posicionar na etiqueta.');
  };

  const removerCampo = () => {
    if (!campoSelecionado) return;
    
    const camposAtualizados = novoModelo.campos.filter(campo => 
      campo.id !== campoSelecionado.id
    );
    
    setNovoModelo({ ...novoModelo, campos: camposAtualizados });
    setCampoSelecionado(null);
    toast.success('Campo removido.');
  };

  const moverCampo = (direcao: 'esquerda' | 'direita' | 'cima' | 'baixo') => {
    if (!campoSelecionado) return;
    
    const incremento = 1;
    let novaPosX = campoSelecionado.x;
    let novaPosY = campoSelecionado.y;
    
    switch (direcao) {
      case 'esquerda':
        novaPosX = Math.max(0, campoSelecionado.x - incremento);
        break;
      case 'direita':
        novaPosX = Math.min(novoModelo.largura - campoSelecionado.largura, campoSelecionado.x + incremento);
        break;
      case 'cima':
        novaPosY = Math.max(0, campoSelecionado.y - incremento);
        break;
      case 'baixo':
        novaPosY = Math.min(novoModelo.altura - campoSelecionado.altura, campoSelecionado.y + incremento);
        break;
    }
    
    if (novaPosX !== campoSelecionado.x || novaPosY !== campoSelecionado.y) {
      const camposAtualizados = novoModelo.campos.map(campo => 
        campo.id === campoSelecionado.id ? { ...campo, x: novaPosX, y: novaPosY } : campo
      );
      
      setNovoModelo({ ...novoModelo, campos: camposAtualizados });
      setCampoSelecionado({ ...campoSelecionado, x: novaPosX, y: novaPosY });
    }
  };

  const handleSalvar = async () => {
    try {
      if (!novoModelo.descricao) {
        toast.error('A descrição da etiqueta é obrigatória');
        return;
      }
      
      if (modelo && modelo.id) {
        await EtiquetaCustomController.atualizarModelo(modelo.id, novoModelo);
      } else {
        await EtiquetaCustomController.salvarModelo(novoModelo);
      }
      
      onSalvar();
    } catch (error) {
      console.error('Erro ao salvar etiqueta:', error);
    }
  };

  const desenharVisualizacaoPagina = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Definir dimensões do canvas
    const escala = 0.5; // Escala para caber na tela
    let larguraPagina = 210; // A4 padrão em mm
    let alturaPagina = 297;
    
    if (novoModelo.formatoPagina === 'personalizado' && novoModelo.larguraPagina && novoModelo.alturaPagina) {
      larguraPagina = novoModelo.larguraPagina;
      alturaPagina = novoModelo.alturaPagina;
    } else if (novoModelo.formatoPagina === 'A3') {
      larguraPagina = 297;
      alturaPagina = 420;
    } else if (novoModelo.formatoPagina === 'A5') {
      larguraPagina = 148;
      alturaPagina = 210;
    } else if (novoModelo.formatoPagina === 'A2') {
      larguraPagina = 420;
      alturaPagina = 594;
    }
    
    // Trocar largura e altura se for paisagem
    if (novoModelo.orientacao === 'paisagem') {
      [larguraPagina, alturaPagina] = [alturaPagina, larguraPagina];
    }
    
    canvas.width = larguraPagina * escala;
    canvas.height = alturaPagina * escala;
    
    // Desenhar fundo branco
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar margem
    ctx.strokeStyle = '#ccc';
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(
      novoModelo.margemEsquerda * escala,
      novoModelo.margemSuperior * escala,
      (larguraPagina - novoModelo.margemEsquerda - novoModelo.margemDireita) * escala,
      (alturaPagina - novoModelo.margemSuperior - novoModelo.margemInferior) * escala
    );
    
    // Calcular número de etiquetas que cabem na página
    const larguraEtiqueta = novoModelo.largura + novoModelo.espacamentoHorizontal;
    const alturaEtiqueta = novoModelo.altura + novoModelo.espacamentoVertical;
    
    const areaUtil = {
      largura: larguraPagina - novoModelo.margemEsquerda - novoModelo.margemDireita,
      altura: alturaPagina - novoModelo.margemSuperior - novoModelo.margemInferior
    };
    
    const etiquetasPorLinha = Math.floor(areaUtil.largura / larguraEtiqueta);
    const etiquetasPorColuna = Math.floor(areaUtil.altura / alturaEtiqueta);
    
    // Desenhar grade de etiquetas
    ctx.strokeStyle = '#888';
    ctx.setLineDash([]);
    
    for (let coluna = 0; coluna < etiquetasPorLinha; coluna++) {
      for (let linha = 0; linha < etiquetasPorColuna; linha++) {
        const x = (novoModelo.margemEsquerda + coluna * larguraEtiqueta) * escala;
        const y = (novoModelo.margemSuperior + linha * alturaEtiqueta) * escala;
        
        ctx.strokeRect(
          x, y,
          novoModelo.largura * escala,
          novoModelo.altura * escala
        );
      }
    }
  };

  // Início da área de arrastar e soltar (drag and drop)
  const onDragStart = (e: React.DragEvent, campo: CampoEtiqueta) => {
    setCampoSelecionado(campo);
    e.dataTransfer.setData('campo_id', campo.id);
  };
  
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const campoId = e.dataTransfer.getData('campo_id');
    const campo = novoModelo.campos.find(c => c.id === campoId);
    
    if (campo && etiquetaRef.current) {
      const rect = etiquetaRef.current.getBoundingClientRect();
      const escala = novoModelo.largura / rect.width; // Fator de escala do elemento visual para mm
      
      let novoX = (e.clientX - rect.left) * escala;
      let novoY = (e.clientY - rect.top) * escala;
      
      // Garantir que o campo não ultrapasse os limites da etiqueta
      novoX = Math.max(0, Math.min(novoModelo.largura - campo.largura, novoX));
      novoY = Math.max(0, Math.min(novoModelo.altura - campo.altura, novoY));
      
      const camposAtualizados = novoModelo.campos.map(c => 
        c.id === campoId ? { ...c, x: novoX, y: novoY } : c
      );
      
      setNovoModelo({ ...novoModelo, campos: camposAtualizados });
      setCampoSelecionado({ ...campo, x: novoX, y: novoY });
    }
  };
  
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const onClickCampo = (campo: CampoEtiqueta) => {
    setCampoSelecionado(campo.id === campoSelecionado?.id ? null : campo);
  };
  // Fim da área de arrastar e soltar

  const getNomeTipoCampo = (tipo: string): string => {
    const mapa: {[key: string]: string} = {
      'texto': 'Texto',
      'preco': 'Preço',
      'codigo': 'Código',
      'codigoBarras': 'Código de Barras',
      'data': 'Data',
      'imagem': 'Imagem',
      'textoGenerico': 'Texto Genérico'
    };
    return mapa[tipo] || tipo;
  };

  const getTipoLabel = (tipo: string): string => {
    switch (tipo) {
      case 'produto': return 'Produto';
      case 'contato': return 'Contato';
      case 'notaFiscal': return 'Nota Fiscal';
      case 'ordemServico': return 'Ordem de Serviço';
      case 'venda': return 'Pedido de Venda';
      default: return tipo;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {modelo?.id ? 'Editar Etiqueta' : 'Nova Etiqueta'}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancelar} className="flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Button>
          <Button onClick={handleSalvar} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Salvar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-12">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="descricao">Descrição</Label>
                      <Input
                        id="descricao"
                        name="descricao"
                        value={novoModelo.descricao}
                        onChange={handleChangeModelo}
                        placeholder="Nome da etiqueta"
                      />
                    </div>
                  </div>
                </div>
                <div className="md:col-span-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="tipo">Tipo</Label>
                      <Select
                        value={novoModelo.tipo}
                        onValueChange={(value) => handleChangeModelo({ name: 'tipo', value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de etiqueta" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="produto">Produto</SelectItem>
                          <SelectItem value="contato">Contato</SelectItem>
                          <SelectItem value="notaFiscal">Nota Fiscal</SelectItem>
                          <SelectItem value="ordemServico">Ordem de Serviço</SelectItem>
                          <SelectItem value="venda">Pedido de Venda</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-12">
          <Tabs defaultValue="etiqueta">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="etiqueta">Etiqueta</TabsTrigger>
              <TabsTrigger value="pagina">Página</TabsTrigger>
            </TabsList>
            
            <TabsContent value="etiqueta" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-3">
                  <Card className="h-full">
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-medium mb-4">Campos</h3>
                      <div className="space-y-4">
                        <div className="max-h-80 overflow-y-auto border rounded-md p-2">
                          {camposDisponiveis.map((campo) => (
                            <div 
                              key={campo}
                              className="mb-2 p-2 bg-gray-100 rounded cursor-pointer hover:bg-gray-200 flex justify-between items-center"
                              onClick={() => {
                                if (campo === 'textoGenerico') {
                                  // Não fazer nada para texto genérico aqui
                                } else {
                                  adicionarCampo(campo)
                                }
                              }}
                            >
                              {campo}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  adicionarCampo(campo);
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        
                        {camposDisponiveis.includes('textoGenerico') && (
                          <div className="space-y-2">
                            <Label htmlFor="campoPersonalizado">Texto Personalizado</Label>
                            <div className="flex space-x-2">
                              <Input
                                id="campoPersonalizado"
                                value={campoPersonalizado}
                                onChange={(e) => setCampoPersonalizado(e.target.value)}
                                placeholder="Digite um texto..."
                              />
                              <Button
                                variant="outline"
                                onClick={() => adicionarCampo('textoGenerico')}
                                disabled={!campoPersonalizado}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="md:col-span-6">
                  <Card className="h-full">
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-medium mb-4">Visualização</h3>
                      <div className="flex justify-center">
                        <div 
                          ref={etiquetaRef}
                          className="border-2 border-dashed border-gray-300 relative"
                          style={{
                            width: `${novoModelo.largura * 2}px`,
                            height: `${novoModelo.altura * 2}px`,
                            backgroundColor: 'white'
                          }}
                          onDrop={onDrop}
                          onDragOver={onDragOver}
                        >
                          {novoModelo.campos.map((campo) => (
                            <div
                              key={campo.id}
                              className={cn(
                                "absolute border-2 cursor-move flex items-center justify-center p-1 bg-white",
                                campoSelecionado?.id === campo.id ? "border-blue-500" : "border-gray-200"
                              )}
                              style={{
                                left: `${campo.x * 2}px`,
                                top: `${campo.y * 2}px`,
                                width: `${campo.largura * 2}px`,
                                height: `${campo.altura * 2}px`,
                                fontFamily: campo.fonte || 'Arial',
                                fontSize: `${(campo.tamanhoFonte || 12) * 2}px`,
                                fontWeight: campo.negrito ? 'bold' : 'normal',
                                fontStyle: campo.italico ? 'italic' : 'normal'
                              }}
                              draggable
                              onDragStart={(e) => onDragStart(e, campo)}
                              onClick={() => onClickCampo(campo)}
                            >
                              {campo.tipo === 'codigoBarras' ? (
                                <div className="flex flex-col items-center">
                                  <div className="bg-gray-800 h-8 w-32"></div>
                                  {campo.mostrarCodigo && <span className="text-xs mt-1">12345678</span>}
                                </div>
                              ) : campo.tipo === 'textoGenerico' ? (
                                campo.valor
                              ) : (
                                campo.rotulo ? `${campo.rotulo}: ${campo.tipo}` : campo.tipo
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="md:col-span-3">
                  <Card className="h-full">
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-medium mb-4">
                        Opções - {campoSelecionado ? getNomeTipoCampo(campoSelecionado.tipo) : 'Geral'}
                      </h3>
                      
                      {!campoSelecionado ? (
                        // Opções gerais da etiqueta
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="largura">Largura (mm)</Label>
                            <Input
                              id="largura"
                              name="largura"
                              type="number"
                              value={novoModelo.largura}
                              onChange={handleChangeModelo}
                            />
                          </div>
                          <div>
                            <Label htmlFor="altura">Altura (mm)</Label>
                            <Input
                              id="altura"
                              name="altura"
                              type="number"
                              value={novoModelo.altura}
                              onChange={handleChangeModelo}
                            />
                          </div>
                        </div>
                      ) : (
                        // Opções do campo selecionado
                        <div className="space-y-4">
                          {/* Controles de posicionamento */}
                          <div className="grid grid-cols-3 gap-2 mb-4">
                            <div className="col-span-3 text-center mb-2">
                              <Label>Posicionamento</Label>
                            </div>
                            <div className="col-span-1"></div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => moverCampo('cima')}
                            >
                              <ChevronsUp className="h-4 w-4" />
                            </Button>
                            <div className="col-span-1"></div>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => moverCampo('esquerda')}
                            >
                              <ChevronsLeft className="h-4 w-4" />
                            </Button>
                            <div className="col-span-1 flex items-center justify-center">
                              <Move className="h-4 w-4 text-gray-400" />
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => moverCampo('direita')}
                            >
                              <ChevronsRight className="h-4 w-4" />
                            </Button>
                            
                            <div className="col-span-1"></div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => moverCampo('baixo')}
                            >
                              <ChevronsDown className="h-4 w-4" />
                            </Button>
                            <div className="col-span-1"></div>
                          </div>
                          
                          <div>
                            <Label htmlFor="campo-largura">Largura (mm)</Label>
                            <Input
                              id="campo-largura"
                              name="largura"
                              type="number"
                              value={campoSelecionado.largura}
                              onChange={handleChangeCampo}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="campo-altura">Altura (mm)</Label>
                            <Input
                              id="campo-altura"
                              name="altura"
                              type="number"
                              value={campoSelecionado.altura}
                              onChange={handleChangeCampo}
                            />
                          </div>
                          
                          {(['texto', 'preco', 'textoGenerico'].includes(campoSelecionado.tipo)) && (
                            <>
                              <div>
                                <Label htmlFor="campo-fonte">Fonte</Label>
                                <Select
                                  value={campoSelecionado.fonte || 'helvetica'}
                                  onValueChange={(value) => handleChangeCampo({ name: 'fonte', value })}
                                >
                                  <SelectTrigger id="campo-fonte">
                                    <SelectValue placeholder="Selecione a fonte" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="helvetica">Helvetica</SelectItem>
                                    <SelectItem value="courier">Courier</SelectItem>
                                    <SelectItem value="times">Times New Roman</SelectItem>
                                    <SelectItem value="arial">Arial</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <Label htmlFor="campo-tamanhoFonte">Tamanho da Fonte</Label>
                                <Input
                                  id="campo-tamanhoFonte"
                                  name="tamanhoFonte"
                                  type="number"
                                  value={campoSelecionado.tamanhoFonte || 12}
                                  onChange={handleChangeCampo}
                                />
                              </div>
                              
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id="campo-negrito"
                                    checked={campoSelecionado.negrito}
                                    onCheckedChange={(checked) => 
                                      handleChangeCampo({ name: 'negrito', value: checked })
                                    }
                                  />
                                  <Label htmlFor="campo-negrito">Negrito</Label>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id="campo-italico"
                                    checked={campoSelecionado.italico}
                                    onCheckedChange={(checked) => 
                                      handleChangeCampo({ name: 'italico', value: checked })
                                    }
                                  />
                                  <Label htmlFor="campo-italico">Itálico</Label>
                                </div>
                              </div>
                            </>
                          )}
                          
                          {campoSelecionado.tipo === 'codigoBarras' && (
                            <>
                              <div>
                                <Label htmlFor="campo-formatoCodigoBarras">Formato</Label>
                                <Select
                                  value={campoSelecionado.formatoCodigoBarras || 'CODE128'}
                                  onValueChange={(value) => 
                                    handleChangeCampo({ name: 'formatoCodigoBarras', value })
                                  }
                                >
                                  <SelectTrigger id="campo-formatoCodigoBarras">
                                    <SelectValue placeholder="Selecione o formato" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="CODE128">CODE128</SelectItem>
                                    <SelectItem value="EAN13">EAN13</SelectItem>
                                    <SelectItem value="EAN8">EAN8</SelectItem>
                                    <SelectItem value="UPC">UPC</SelectItem>
                                    <SelectItem value="CODE39">CODE39</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id="campo-mostrarCodigo"
                                  checked={campoSelecionado.mostrarCodigo}
                                  onCheckedChange={(checked) => 
                                    handleChangeCampo({ name: 'mostrarCodigo', value: checked })
                                  }
                                />
                                <Label htmlFor="campo-mostrarCodigo">Mostrar código em texto</Label>
                              </div>
                            </>
                          )}
                          
                          {(['texto', 'preco'].includes(campoSelecionado.tipo)) && (
                            <div>
                              <Label htmlFor="campo-rotulo">Rótulo</Label>
                              <Input
                                id="campo-rotulo"
                                name="rotulo"
                                value={campoSelecionado.rotulo || ''}
                                onChange={handleChangeCampo}
                                placeholder="ex: Preço:"
                              />
                            </div>
                          )}
                          
                          {campoSelecionado.tipo === 'preco' && (
                            <div>
                              <Label htmlFor="campo-moeda">Moeda</Label>
                              <Select
                                value={campoSelecionado.moeda || 'R$'}
                                onValueChange={(value) => 
                                  handleChangeCampo({ name: 'moeda', value })
                                }
                              >
                                <SelectTrigger id="campo-moeda">
                                  <SelectValue placeholder="Selecione a moeda" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">Nenhuma</SelectItem>
                                  <SelectItem value="R$">BRL (R$)</SelectItem>
                                  <SelectItem value="$">USD ($)</SelectItem>
                                  <SelectItem value="€">EUR (€)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                          
                          {campoSelecionado.tipo === 'textoGenerico' && (
                            <div>
                              <Label htmlFor="campo-valor">Texto</Label>
                              <Input
                                id="campo-valor"
                                name="valor"
                                value={campoSelecionado.valor || ''}
                                onChange={handleChangeCampo}
                                placeholder="Texto personalizado"
                              />
                            </div>
                          )}
                          
                          <div className="pt-4">
                            <Button 
                              variant="destructive" 
                              onClick={removerCampo}
                              className="w-full"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Remover Campo
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="pagina" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="espacamentoHorizontal">Espaçamento Horizontal (mm)</Label>
                          <Input
                            id="espacamentoHorizontal"
                            name="espacamentoHorizontal"
                            type="number"
                            step="0.1"
                            value={novoModelo.espacamentoHorizontal}
                            onChange={handleChangeModelo}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="espacamentoVertical">Espaçamento Vertical (mm)</Label>
                          <Input
                            id="espacamentoVertical"
                            name="espacamentoVertical"
                            type="number"
                            step="0.1"
                            value={novoModelo.espacamentoVertical}
                            onChange={handleChangeModelo}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="formatoPagina">Formato da Página</Label>
                          <Select
                            value={novoModelo.formatoPagina}
                            onValueChange={(value) => 
                              handleChangeModelo({ name: 'formatoPagina', value })
                            }
                          >
                            <SelectTrigger id="formatoPagina">
                              <SelectValue placeholder="Selecione o formato" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="A4">A4</SelectItem>
                              <SelectItem value="A5">A5</SelectItem>
                              <SelectItem value="A3">A3</SelectItem>
                              <SelectItem value="A2">A2</SelectItem>
                              <SelectItem value="personalizado">Personalizado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {formatoPersonalizado && (
                          <>
                            <div>
                              <Label htmlFor="larguraPagina">Largura da Página (mm)</Label>
                              <Input
                                id="larguraPagina"
                                name="larguraPagina"
                                type="number"
                                step="0.1"
                                value={novoModelo.larguraPagina || 210}
                                onChange={handleChangeModelo}
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="alturaPagina">Altura da Página (mm)</Label>
                              <Input
                                id="alturaPagina"
                                name="alturaPagina"
                                type="number"
                                step="0.1"
                                value={novoModelo.alturaPagina || 297}
                                onChange={handleChangeModelo}
                              />
                            </div>
                          </>
                        )}
                        
                        <div>
                          <Label htmlFor="orientacao">Orientação</Label>
                          <Select
                            value={novoModelo.orientacao}
                            onValueChange={(value) => 
                              handleChangeModelo({ name: 'orientacao', value })
                            }
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
                        
                        <Separator className="my-4" />
                        
                        <div>
                          <Label htmlFor="margemSuperior">Margem Superior (mm)</Label>
                          <Input
                            id="margemSuperior"
                            name="margemSuperior"
                            type="number"
                            step="0.1"
                            value={novoModelo.margemSuperior}
                            onChange={handleChangeModelo}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="margemInferior">Margem Inferior (mm)</Label>
                          <Input
                            id="margemInferior"
                            name="margemInferior"
                            type="number"
                            step="0.1"
                            value={novoModelo.margemInferior}
                            onChange={handleChangeModelo}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="margemEsquerda">Margem Esquerda (mm)</Label>
                          <Input
                            id="margemEsquerda"
                            name="margemEsquerda"
                            type="number"
                            step="0.1"
                            value={novoModelo.margemEsquerda}
                            onChange={handleChangeModelo}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="margemDireita">Margem Direita (mm)</Label>
                          <Input
                            id="margemDireita"
                            name="margemDireita"
                            type="number"
                            step="0.1"
                            value={novoModelo.margemDireita}
                            onChange={handleChangeModelo}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="md:col-span-8">
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-medium mb-4">Visualização da Página</h3>
                      <div className="flex justify-center">
                        <canvas 
                          ref={canvasRef} 
                          className="border"
                          style={{ maxWidth: '100%', height: 'auto' }}
                        />
                      </div>
                      <div className="mt-2 text-center text-sm text-gray-500">
                        <p>A visualização mostra como as etiquetas serão distribuídas na folha. A grade indica a posição das etiquetas.</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
