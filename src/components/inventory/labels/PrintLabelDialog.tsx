
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, AlertTriangle, Printer, X, FileEdit, Settings } from "lucide-react";
import { LabelModel } from "@/models/labelModel";
import { generatePdfLabel } from "@/utils/pdfUtils";
import { EtiquetaCustomModel } from "@/models/etiquetaCustomModel";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import type { ModeloEtiqueta } from "@/types/etiqueta";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";

interface PrintLabelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: any; // Tipo do item a ser impresso
}

export function PrintLabelDialog({ isOpen, onClose, item }: PrintLabelDialogProps) {
  const navigate = useNavigate();
  const [labelModel, setLabelModel] = useState("Padrão");
  const [copies, setCopies] = useState("1");
  const [startRow, setStartRow] = useState("1");
  const [startColumn, setStartColumn] = useState("1");
  const [multiplyByStock, setMultiplyByStock] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [modelosCustom, setModelosCustom] = useState<ModeloEtiqueta[]>([]);
  const [selectedModeloId, setSelectedModeloId] = useState<string | undefined>(undefined);
  const [selectedModelo, setSelectedModelo] = useState<ModeloEtiqueta | null>(null);
  const [modeloWarning, setModeloWarning] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("configuracao");

  // Load custom models when dialog opens
  useEffect(() => {
    const loadModelosCustom = async () => {
      try {
        console.log("Carregando modelos de etiquetas personalizadas...");
        const modelos = await EtiquetaCustomModel.getAll();
        console.log("Modelos carregados:", modelos);
        setModelosCustom(modelos);
      } catch (error) {
        console.error("Erro ao carregar modelos:", error);
        toast.error("Erro ao carregar modelos de etiquetas");
      }
    };
    
    if (isOpen) {
      loadModelosCustom();
    }
  }, [isOpen]);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCopies("1");
      setStartRow("1");
      setStartColumn("1");
      setMultiplyByStock(false);
      setSelectedModeloId(undefined);
      setSelectedModelo(null);
      setModeloWarning(null);
      setActiveTab("configuracao");
    }
  }, [isOpen]);

  // Carregar detalhes do modelo selecionado
  useEffect(() => {
    setModeloWarning(null);
    
    if (selectedModeloId) {
      const carregarModeloSelecionado = async () => {
        try {
          console.log("Carregando detalhes do modelo:", selectedModeloId);
          const modelo = await EtiquetaCustomModel.getById(selectedModeloId);
          console.log("Detalhes do modelo carregado:", modelo);
          
          if (modelo) {
            setSelectedModelo(modelo);
            console.log("Campos do modelo carregado:", modelo.campos);
            
            // Verificar se as dimensões são válidas
            if (modelo.formatoPagina === "Personalizado") {
              if (!modelo.larguraPagina || !modelo.alturaPagina) {
                setModeloWarning("Este modelo tem formato personalizado, mas as dimensões da página não estão definidas.");
                return;
              }
              
              // Verificar se a etiqueta cabe na página
              const areaUtilLargura = modelo.larguraPagina - modelo.margemEsquerda - modelo.margemDireita;
              if (modelo.largura > areaUtilLargura) {
                setModeloWarning(
                  `A largura da etiqueta (${modelo.largura}mm) é maior que a área útil disponível (${areaUtilLargura}mm). ` +
                  `Isso pode causar problemas na impressão. Considere editar o modelo.`
                );
                return;
              }
              
              const areaUtilAltura = modelo.alturaPagina - modelo.margemSuperior - modelo.margemInferior;
              if (modelo.altura > areaUtilAltura) {
                setModeloWarning(
                  `A altura da etiqueta (${modelo.altura}mm) é maior que a área útil disponível (${areaUtilAltura}mm). ` +
                  `Isso pode causar problemas na impressão. Considere editar o modelo.`
                );
                return;
              }
            }
          } else {
            console.error("Modelo não encontrado");
            toast.error("Erro ao carregar modelo de etiqueta");
          }
        } catch (error) {
          console.error("Erro ao carregar detalhes do modelo:", error);
          toast.error("Erro ao carregar modelo de etiqueta");
        }
      };
      
      carregarModeloSelecionado();
    } else {
      setSelectedModelo(null);
    }
  }, [selectedModeloId]);

  const validateInput = (): boolean => {
    if (!item) {
      toast.error("Nenhum item selecionado para impressão");
      return false;
    }

    const copiesNum = parseInt(copies);
    const startRowNum = parseInt(startRow);
    const startColNum = parseInt(startColumn);

    if (isNaN(copiesNum) || copiesNum < 1) {
      toast.error("Número de cópias deve ser pelo menos 1");
      return false;
    }

    if (isNaN(startRowNum) || startRowNum < 1) {
      toast.error("Linha de início deve ser pelo menos 1");
      return false;
    }

    if (isNaN(startColNum) || startColNum < 1) {
      toast.error("Coluna de início deve ser pelo menos 1");
      return false;
    }

    if (selectedModeloId && modeloWarning) {
      if (!confirm("O modelo selecionado pode ter problemas de impressão. Deseja continuar mesmo assim?")) {
        return false;
      }
    }

    return true;
  };

  const handlePrint = async () => {
    if (!validateInput()) return;

    try {
      setIsProcessing(true);
      console.log("Iniciando impressão com modelo:", selectedModeloId);
      console.log("Detalhes do modelo para impressão:", selectedModelo);
      console.log("Item para impressão:", item);

      // Usar a interface correta para o generatePdfLabel
      const pdfUrl = await generatePdfLabel({
        item,
        copies: parseInt(copies),
        startRow: parseInt(startRow),
        startColumn: parseInt(startColumn),
        multiplyByStock,
        selectedModeloId
      });

      // Registrar impressão no histórico
      await LabelModel.registerLabelPrint(item.id, parseInt(copies));

      // Abrir PDF em nova aba
      window.open(pdfUrl, '_blank');
      
      toast.success("Etiquetas geradas com sucesso!");
      onClose();
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      if (error instanceof Error) {
        toast.error(`Erro ao gerar etiquetas: ${error.message}`);
      } else {
        toast.error("Erro ao gerar etiquetas. Por favor, tente novamente.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNovoModelo = () => {
    // Fechar o diálogo atual
    onClose();
    // Redirecionar para a página de criação de modelo
    navigate('/dashboard/inventory/labels/modelo-etiqueta/novo');
  };

  const editarModeloSelecionado = () => {
    if (selectedModelo && selectedModelo.id) {
      // Fechar o diálogo atual
      onClose();
      // Redirecionar para a página de edição do modelo
      navigate(`/dashboard/inventory/labels/modelo-etiqueta/${selectedModelo.id}`);
    } else {
      toast.error("Nenhum modelo selecionado para editar");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Imprimir Etiquetas</DialogTitle>
          <DialogDescription>
            Configure as opções de impressão para gerar etiquetas para o item selecionado.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="configuracao">Configuração</TabsTrigger>
            <TabsTrigger value="modelo">Modelo de Etiqueta</TabsTrigger>
          </TabsList>
          
          <TabsContent value="configuracao" className="space-y-4 py-2">
            <Card>
              <CardHeader className="p-3">
                <CardTitle className="text-base">Detalhes da Impressão</CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="label-model">Modelo da etiqueta</Label>
                    <Select value={labelModel} disabled>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o modelo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Padrão">Padrão</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="copies">Cópias</Label>
                    <Input
                      id="copies"
                      type="number"
                      min="1"
                      value={copies}
                      onChange={(e) => setCopies(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-row">Linha início</Label>
                    <Input
                      id="start-row"
                      type="number"
                      min="1"
                      value={startRow}
                      onChange={(e) => setStartRow(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start-column">Coluna início</Label>
                    <Input
                      id="start-column"
                      type="number"
                      min="1"
                      value={startColumn}
                      onChange={(e) => setStartColumn(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="multiply-stock"
                    checked={multiplyByStock}
                    onCheckedChange={setMultiplyByStock}
                  />
                  <Label htmlFor="multiply-stock">Multiplicar por estoque</Label>
                </div>
              </CardContent>
            </Card>
            
            {selectedModelo && (
              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="text-base">Modelo Selecionado</CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-2 text-sm">
                  <div><strong>Nome:</strong> {selectedModelo.nome}</div>
                  <div><strong>Dimensões:</strong> {selectedModelo.largura}mm × {selectedModelo.altura}mm</div>
                  <div><strong>Formato:</strong> {selectedModelo.formatoPagina}</div>
                  <div><strong>Orientação:</strong> {selectedModelo.orientacao === "retrato" ? "Retrato" : "Paisagem"}</div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="modelo" className="space-y-4 py-2">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Selecione um Modelo</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNovoModelo}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Novo Modelo
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="modelos-custom">Modelos personalizados</Label>
              <Select 
                value={selectedModeloId} 
                onValueChange={setSelectedModeloId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o modelo" />
                </SelectTrigger>
                <SelectContent>
                  {modelosCustom.length > 0 ? (
                    modelosCustom.map((modelo) => (
                      <SelectItem key={modelo.id} value={modelo.id || ""}>
                        {modelo.nome}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="sem-modelos" disabled>
                      Nenhum modelo disponível
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {selectedModelo && (
              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="text-base">Detalhes do Modelo</CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-2 text-sm">
                  <div><strong>Nome:</strong> {selectedModelo.nome}</div>
                  <div><strong>Descrição:</strong> {selectedModelo.descricao}</div>
                  <div><strong>Dimensões:</strong> {selectedModelo.largura}mm × {selectedModelo.altura}mm</div>
                  <div>
                    <strong>Página:</strong> {selectedModelo.formatoPagina} 
                    {selectedModelo.formatoPagina === "Personalizado" && selectedModelo.larguraPagina && selectedModelo.alturaPagina 
                      ? ` (${selectedModelo.larguraPagina}mm × ${selectedModelo.alturaPagina}mm)` 
                      : ""
                    }
                  </div>
                  <div><strong>Orientação:</strong> {selectedModelo.orientacao === "retrato" ? "Retrato" : "Paisagem"}</div>
                  <div><strong>Margens:</strong> S:{selectedModelo.margemSuperior}mm, I:{selectedModelo.margemInferior}mm, 
                    E:{selectedModelo.margemEsquerda}mm, D:{selectedModelo.margemDireita}mm</div>
                  <div><strong>Espaçamento:</strong> H:{selectedModelo.espacamentoHorizontal}mm, V:{selectedModelo.espacamentoVertical}mm</div>
                </CardContent>
              </Card>
            )}
            
            {modeloWarning && (
              <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-700" />
                <AlertTitle className="text-yellow-800">Atenção</AlertTitle>
                <AlertDescription className="text-yellow-700">
                  {modeloWarning}
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="space-x-2">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button 
            onClick={handlePrint} 
            disabled={isProcessing || !selectedModeloId}
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            {isProcessing ? "Processando..." : "Imprimir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
