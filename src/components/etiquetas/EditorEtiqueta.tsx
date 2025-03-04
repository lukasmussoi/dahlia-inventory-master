
import React, { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CheckIcon, DragHandleDots2Icon, TrashIcon } from "@radix-ui/react-icons";
import { CampoEtiqueta, ModeloEtiqueta } from "@/models/etiquetaCustomModel";
import { EtiquetaCustomController } from "@/controllers/etiquetaCustomController";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { AuthModel } from "@/models/authModel";

interface EditorEtiquetaProps {
  modelo: ModeloEtiqueta | null;
  onSalvar: () => void;
  onCancelar: () => void;
}

const EditorEtiqueta: React.FC<EditorEtiquetaProps> = ({ modelo, onSalvar, onCancelar }) => {
  const [tab, setTab] = useState("etiqueta");
  const [tipoEtiqueta, setTipoEtiqueta] = useState<string>(modelo?.tipo || "produto");
  const [descricao, setDescricao] = useState<string>(modelo?.descricao || "");
  const [largura, setLargura] = useState<number>(modelo?.largura || 90);
  const [altura, setAltura] = useState<number>(modelo?.altura || 29);
  const [formatoPagina, setFormatoPagina] = useState<string>(modelo?.formatoPagina || "A4");
  const [orientacao, setOrientacao] = useState<string>(modelo?.orientacao || "retrato");
  const [larguraPagina, setLarguraPagina] = useState<number | undefined>(modelo?.larguraPagina);
  const [alturaPagina, setAlturaPagina] = useState<number | undefined>(modelo?.alturaPagina);
  const [margemSuperior, setMargemSuperior] = useState<number>(modelo?.margemSuperior || 10);
  const [margemInferior, setMargemInferior] = useState<number>(modelo?.margemInferior || 10);
  const [margemEsquerda, setMargemEsquerda] = useState<number>(modelo?.margemEsquerda || 10);
  const [margemDireita, setMargemDireita] = useState<number>(modelo?.margemDireita || 10);
  const [espacamentoHorizontal, setEspacamentoHorizontal] = useState<number>(modelo?.espacamentoHorizontal || 0);
  const [espacamentoVertical, setEspacamentoVertical] = useState<number>(modelo?.espacamentoVertical || 0);
  const [campos, setCampos] = useState<CampoEtiqueta[]>(modelo?.campos || []);
  const [campoSelecionado, setCampoSelecionado] = useState<CampoEtiqueta | null>(null);
  const [camposDisponiveis, setCamposDisponiveis] = useState<string[]>([]);
  const etiquetaCanvasRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Carregar campos disponíveis para o tipo selecionado
    const camposDisponiveis = EtiquetaCustomController.getCamposDisponiveis(tipoEtiqueta);
    setCamposDisponiveis(camposDisponiveis);
  }, [tipoEtiqueta]);

  const salvarMutation = useMutation({
    mutationFn: async () => {
      setIsSubmitting(true);
      try {
        const user = await AuthModel.getCurrentUser();
        if (!user) {
          toast.error('Usuário não autenticado');
          return null;
        }

        const etiquetaData: Omit<ModeloEtiqueta, 'id' | 'criado_em' | 'atualizado_em'> = {
          descricao,
          tipo: tipoEtiqueta as any,
          largura,
          altura,
          espacamentoHorizontal,
          espacamentoVertical,
          formatoPagina: formatoPagina as any,
          orientacao: orientacao as any,
          larguraPagina: formatoPagina === "personalizado" ? larguraPagina : undefined,
          alturaPagina: formatoPagina === "personalizado" ? alturaPagina : undefined,
          margemSuperior,
          margemInferior,
          margemEsquerda,
          margemDireita,
          campos,
          criado_por: user.id
        };

        if (modelo?.id) {
          // Atualizar modelo existente
          return await EtiquetaCustomController.atualizarModelo(modelo.id, etiquetaData);
        } else {
          // Criar novo modelo
          return await EtiquetaCustomController.salvarModelo(etiquetaData);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    onSuccess: () => {
      toast.success(modelo?.id ? 'Modelo atualizado com sucesso' : 'Modelo criado com sucesso');
      onSalvar();
    },
    onError: (error: any) => {
      toast.error(`Erro ao salvar modelo: ${error.message}`);
    }
  });

  const handleSalvar = () => {
    if (!descricao.trim()) {
      toast.error('A descrição é obrigatória');
      return;
    }
    
    salvarMutation.mutate();
  };

  const adicionarCampo = (tipo: string) => {
    const novoCampo = EtiquetaCustomController.gerarCampoNovo(tipo);
    setCampos([...campos, novoCampo]);
    setCampoSelecionado(novoCampo);
  };

  const removerCampo = (id: string) => {
    const novosCampos = campos.filter(campo => campo.id !== id);
    setCampos(novosCampos);
    if (campoSelecionado?.id === id) {
      setCampoSelecionado(null);
    }
  };

  const atualizarCampo = (campoAtualizado: CampoEtiqueta) => {
    const novosCampos = campos.map(campo => 
      campo.id === campoAtualizado.id ? campoAtualizado : campo
    );
    setCampos(novosCampos);
    setCampoSelecionado(campoAtualizado);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {modelo?.id ? 'Editar Modelo de Etiqueta' : 'Novo Modelo de Etiqueta'}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados Básicos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Input 
                  id="descricao"
                  value={descricao} 
                  onChange={(e) => setDescricao(e.target.value)} 
                  placeholder="Nome do modelo de etiqueta" 
                />
              </div>
              <div>
                <Label htmlFor="tipo">Tipo</Label>
                <Select 
                  value={tipoEtiqueta} 
                  onValueChange={setTipoEtiqueta}
                  disabled={!!modelo?.id} // Não permitir mudar o tipo em edição
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
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
          </CardContent>
        </Card>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="etiqueta">Etiqueta</TabsTrigger>
            <TabsTrigger value="pagina">Página</TabsTrigger>
          </TabsList>
          
          <TabsContent value="etiqueta" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuração da Etiqueta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <Label htmlFor="largura">Largura (mm)</Label>
                    <Input 
                      id="largura"
                      type="number" 
                      value={largura} 
                      onChange={(e) => setLargura(Number(e.target.value))} 
                    />
                  </div>
                  <div>
                    <Label htmlFor="altura">Altura (mm)</Label>
                    <Input 
                      id="altura"
                      type="number" 
                      value={altura} 
                      onChange={(e) => setAltura(Number(e.target.value))} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="text-sm font-medium mb-3">Campos Disponíveis</h3>
                    <div className="space-y-2">
                      {camposDisponiveis.map((campo) => (
                        <Button 
                          key={campo} 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => adicionarCampo(campo)}
                        >
                          {campo}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <div 
                      ref={etiquetaCanvasRef}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-4 h-[300px] relative overflow-hidden bg-white"
                      style={{ 
                        width: '100%',
                        height: '300px'
                      }}
                    >
                      {campos.map((campo) => (
                        <div
                          key={campo.id}
                          className={`absolute cursor-move p-2 border ${campoSelecionado?.id === campo.id ? 'border-blue-500' : 'border-gray-300'} bg-white rounded select-none`}
                          style={{
                            left: `${campo.x}px`,
                            top: `${campo.y}px`,
                            width: `${campo.largura}px`,
                            height: `${campo.altura}px`,
                          }}
                          onClick={() => setCampoSelecionado(campo)}
                        >
                          <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
                            <span>{campo.tipo}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={(e) => {
                                e.stopPropagation();
                                removerCampo(campo.id);
                              }}
                            >
                              <TrashIcon className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="text-sm truncate">{campo.valor || 'Texto de exemplo'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {campoSelecionado && (
              <Card>
                <CardHeader>
                  <CardTitle>Propriedades do Campo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="campo-tipo">Tipo</Label>
                      <Input 
                        id="campo-tipo"
                        value={campoSelecionado.tipo} 
                        disabled 
                      />
                    </div>
                    <div>
                      <Label htmlFor="campo-rotulo">Rótulo</Label>
                      <Input 
                        id="campo-rotulo"
                        value={campoSelecionado.rotulo || ''}
                        onChange={(e) => {
                          atualizarCampo({
                            ...campoSelecionado,
                            rotulo: e.target.value
                          });
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="campo-x">Posição X</Label>
                      <Input 
                        id="campo-x"
                        type="number"
                        value={campoSelecionado.x}
                        onChange={(e) => {
                          atualizarCampo({
                            ...campoSelecionado,
                            x: Number(e.target.value)
                          });
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="campo-y">Posição Y</Label>
                      <Input 
                        id="campo-y"
                        type="number"
                        value={campoSelecionado.y}
                        onChange={(e) => {
                          atualizarCampo({
                            ...campoSelecionado,
                            y: Number(e.target.value)
                          });
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="campo-largura">Largura</Label>
                      <Input 
                        id="campo-largura"
                        type="number"
                        value={campoSelecionado.largura}
                        onChange={(e) => {
                          atualizarCampo({
                            ...campoSelecionado,
                            largura: Number(e.target.value)
                          });
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="campo-altura">Altura</Label>
                      <Input 
                        id="campo-altura"
                        type="number"
                        value={campoSelecionado.altura}
                        onChange={(e) => {
                          atualizarCampo({
                            ...campoSelecionado,
                            altura: Number(e.target.value)
                          });
                        }}
                      />
                    </div>

                    {(campoSelecionado.tipo === 'texto' || campoSelecionado.tipo === 'preco') && (
                      <>
                        <div>
                          <Label htmlFor="campo-fonte">Fonte</Label>
                          <Select 
                            value={campoSelecionado.fonte || 'helvetica'}
                            onValueChange={(value) => {
                              atualizarCampo({
                                ...campoSelecionado,
                                fonte: value
                              });
                            }}
                          >
                            <SelectTrigger id="campo-fonte">
                              <SelectValue placeholder="Selecione a fonte" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="helvetica">Helvetica</SelectItem>
                              <SelectItem value="Courier">Courier</SelectItem>
                              <SelectItem value="monospace">Monospace</SelectItem>
                              <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="campo-tamanho-fonte">Tamanho da Fonte</Label>
                          <Input 
                            id="campo-tamanho-fonte"
                            type="number"
                            value={campoSelecionado.tamanhoFonte || 12}
                            onChange={(e) => {
                              atualizarCampo({
                                ...campoSelecionado,
                                tamanhoFonte: Number(e.target.value)
                              });
                            }}
                          />
                        </div>
                      </>
                    )}

                    {campoSelecionado.tipo === 'codigoBarras' && (
                      <>
                        <div>
                          <Label htmlFor="campo-formato-codigo">Formato do Código de Barras</Label>
                          <Select 
                            value={campoSelecionado.formatoCodigoBarras || 'CODE128'}
                            onValueChange={(value) => {
                              atualizarCampo({
                                ...campoSelecionado,
                                formatoCodigoBarras: value
                              });
                            }}
                          >
                            <SelectTrigger id="campo-formato-codigo">
                              <SelectValue placeholder="Selecione o formato" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CODE128">CODE128</SelectItem>
                              <SelectItem value="EAN13">EAN13</SelectItem>
                              <SelectItem value="UPC">UPC</SelectItem>
                              <SelectItem value="CODE39">CODE39</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor="campo-mostrar-codigo">Mostrar Código em Texto</Label>
                          <Switch 
                            id="campo-mostrar-codigo"
                            checked={campoSelecionado.mostrarCodigo || false}
                            onCheckedChange={(checked) => {
                              atualizarCampo({
                                ...campoSelecionado,
                                mostrarCodigo: checked
                              });
                            }}
                          />
                        </div>
                      </>
                    )}

                    {campoSelecionado.tipo === 'preco' && (
                      <div>
                        <Label htmlFor="campo-moeda">Moeda</Label>
                        <Select 
                          value={campoSelecionado.moeda || 'R$'}
                          onValueChange={(value) => {
                            atualizarCampo({
                              ...campoSelecionado,
                              moeda: value
                            });
                          }}
                        >
                          <SelectTrigger id="campo-moeda">
                            <SelectValue placeholder="Selecione a moeda" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="R$">Real (R$)</SelectItem>
                            <SelectItem value="$">Dólar ($)</SelectItem>
                            <SelectItem value="€">Euro (€)</SelectItem>
                            <SelectItem value="£">Libra (£)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {campoSelecionado.tipo === 'textoGenerico' && (
                      <div className="col-span-2">
                        <Label htmlFor="campo-valor">Texto</Label>
                        <Textarea 
                          id="campo-valor"
                          value={campoSelecionado.valor || ''}
                          onChange={(e) => {
                            atualizarCampo({
                              ...campoSelecionado,
                              valor: e.target.value
                            });
                          }}
                          rows={3}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="pagina">
            <Card>
              <CardHeader>
                <CardTitle>Configuração da Página</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="formato-pagina">Formato da Página</Label>
                    <Select 
                      value={formatoPagina} 
                      onValueChange={setFormatoPagina}
                    >
                      <SelectTrigger id="formato-pagina">
                        <SelectValue placeholder="Selecione o formato" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A2">A2</SelectItem>
                        <SelectItem value="A3">A3</SelectItem>
                        <SelectItem value="A4">A4</SelectItem>
                        <SelectItem value="A5">A5</SelectItem>
                        <SelectItem value="personalizado">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="orientacao">Orientação</Label>
                    <Select 
                      value={orientacao} 
                      onValueChange={setOrientacao}
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
                  
                  <div>
                    <Label htmlFor="espacamento-horizontal">Espaçamento Horizontal (mm)</Label>
                    <Input 
                      id="espacamento-horizontal"
                      type="number" 
                      value={espacamentoHorizontal} 
                      onChange={(e) => setEspacamentoHorizontal(Number(e.target.value))} 
                    />
                  </div>

                  <div>
                    <Label htmlFor="espacamento-vertical">Espaçamento Vertical (mm)</Label>
                    <Input 
                      id="espacamento-vertical"
                      type="number" 
                      value={espacamentoVertical} 
                      onChange={(e) => setEspacamentoVertical(Number(e.target.value))} 
                    />
                  </div>
                </div>

                {formatoPagina === "personalizado" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label htmlFor="largura-pagina">Largura da Página (mm)</Label>
                      <Input 
                        id="largura-pagina"
                        type="number" 
                        value={larguraPagina || ''} 
                        onChange={(e) => setLarguraPagina(Number(e.target.value))} 
                      />
                    </div>
                    <div>
                      <Label htmlFor="altura-pagina">Altura da Página (mm)</Label>
                      <Input 
                        id="altura-pagina"
                        type="number" 
                        value={alturaPagina || ''} 
                        onChange={(e) => setAlturaPagina(Number(e.target.value))} 
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <Label htmlFor="margem-superior">Margem Superior (mm)</Label>
                    <Input 
                      id="margem-superior"
                      type="number" 
                      value={margemSuperior} 
                      onChange={(e) => setMargemSuperior(Number(e.target.value))} 
                    />
                  </div>
                  <div>
                    <Label htmlFor="margem-inferior">Margem Inferior (mm)</Label>
                    <Input 
                      id="margem-inferior"
                      type="number" 
                      value={margemInferior} 
                      onChange={(e) => setMargemInferior(Number(e.target.value))} 
                    />
                  </div>
                  <div>
                    <Label htmlFor="margem-esquerda">Margem Esquerda (mm)</Label>
                    <Input 
                      id="margem-esquerda"
                      type="number" 
                      value={margemEsquerda} 
                      onChange={(e) => setMargemEsquerda(Number(e.target.value))} 
                    />
                  </div>
                  <div>
                    <Label htmlFor="margem-direita">Margem Direita (mm)</Label>
                    <Input 
                      id="margem-direita"
                      type="number" 
                      value={margemDireita} 
                      onChange={(e) => setMargemDireita(Number(e.target.value))} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancelar}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSalvar} 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : (modelo?.id ? 'Atualizar' : 'Criar')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditorEtiqueta;
