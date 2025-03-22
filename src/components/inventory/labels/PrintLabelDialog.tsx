
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, AlertTriangle, Copy } from "lucide-react";
import { LabelModel } from "@/models/labelModel";
import { generatePdfLabel, type GeneratePdfLabelOptions } from "@/utils/pdfUtils";
import { EtiquetaCustomModel } from "@/models/etiquetaCustomModel";
import { EtiquetaCustomForm } from "./EtiquetaCustomForm";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import type { ModeloEtiqueta } from "@/types/etiqueta";

interface PrintLabelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: any; // Tipo do item a ser impresso
}

export function PrintLabelDialog({
  isOpen,
  onClose,
  item
}: PrintLabelDialogProps) {
  const [copies, setCopies] = useState("1");
  const [startRow, setStartRow] = useState("1");
  const [startColumn, setStartColumn] = useState("1");
  const [multiplyByStock, setMultiplyByStock] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModeloForm, setShowModeloForm] = useState(false);
  const [modelosCustom, setModelosCustom] = useState<ModeloEtiqueta[]>([]);
  const [selectedModeloId, setSelectedModeloId] = useState<string | undefined>(undefined);
  const [selectedModelo, setSelectedModelo] = useState<ModeloEtiqueta | null>(null);
  const [modeloWarning, setModeloWarning] = useState<string | null>(null);
  const [etiquetaParaDuplicar, setEtiquetaParaDuplicar] = useState<ModeloEtiqueta | null>(null);

  // Load custom models when dialog opens
  useEffect(() => {
    const loadModelosCustom = async () => {
      try {
        console.log("Carregando modelos de etiquetas personalizadas...");
        const modelos = await EtiquetaCustomModel.getAll();
        console.log("Modelos carregados:", modelos);
        setModelosCustom(modelos);
        
        // Se houver modelos e nenhum modelo estiver selecionado, seleciona o primeiro
        if (modelos.length > 0 && !selectedModeloId) {
          setSelectedModeloId(modelos[0].id);
        }
      } catch (error) {
        console.error("Erro ao carregar modelos:", error);
        toast.error("Erro ao carregar modelos de etiquetas");
      }
    };
    if (isOpen) {
      loadModelosCustom();
    }
  }, [isOpen, selectedModeloId]);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCopies("1");
      setStartRow("1");
      setStartColumn("1");
      setMultiplyByStock(false);
      setModeloWarning(null);
      setEtiquetaParaDuplicar(null);
      // Não resetamos selectedModeloId para manter a seleção anterior
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
            console.log("Formato da página:", modelo.formatoPagina);
            console.log("Dimensões:", {
              larguraPagina: modelo.larguraPagina,
              alturaPagina: modelo.alturaPagina,
              larguraEtiqueta: modelo.largura,
              alturaEtiqueta: modelo.altura
            });

            // Verificar se as dimensões são válidas
            if (modelo.formatoPagina === "Personalizado") {
              if (!modelo.larguraPagina || !modelo.alturaPagina) {
                setModeloWarning("Este modelo tem formato personalizado, mas as dimensões da página não estão definidas.");
                return;
              }

              // Verificar se a etiqueta cabe na página
              const areaUtilLargura = modelo.larguraPagina - modelo.margemEsquerda - modelo.margemDireita;
              if (modelo.largura > areaUtilLargura) {
                setModeloWarning(`A largura da etiqueta (${modelo.largura}mm) é maior que a área útil disponível (${areaUtilLargura}mm). ` + `Isso pode causar problemas na impressão. Considere editar o modelo.`);
                return;
              }
              const areaUtilAltura = modelo.alturaPagina - modelo.margemSuperior - modelo.margemInferior;
              if (modelo.altura > areaUtilAltura) {
                setModeloWarning(`A altura da etiqueta (${modelo.altura}mm) é maior que a área útil disponível (${areaUtilAltura}mm). ` + `Isso pode causar problemas na impressão. Considere editar o modelo.`);
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
    
    if (!selectedModeloId) {
      toast.error("Selecione um modelo de etiqueta");
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

      // Validar que um modelo foi selecionado
      if (!selectedModeloId) {
        throw new Error("Nenhum modelo de etiqueta selecionado");
      }

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

  const handleModeloSuccess = async () => {
    setShowModeloForm(false);
    setEtiquetaParaDuplicar(null);
    try {
      const modelos = await EtiquetaCustomModel.getAll();
      setModelosCustom(modelos);
      toast.success("Modelo de etiqueta adicionado com sucesso!");
    } catch (error) {
      console.error("Erro ao recarregar modelos:", error);
    }
  };

  const editarModeloSelecionado = () => {
    if (selectedModelo && selectedModelo.id) {
      // Funcionalidade futura: implementar edição do modelo
      toast.info("Funcionalidade de edição de modelo será implementada em breve");
    } else {
      toast.error("Nenhum modelo selecionado para editar");
    }
  };

  const duplicarModelo = async () => {
    if (!selectedModelo) {
      toast.error("Selecione um modelo para duplicar");
      return;
    }

    try {
      // Criar cópia do modelo selecionado
      const modeloDuplicado = { ...selectedModelo };
      
      // Remover ID para criar um novo registro
      delete modeloDuplicado.id;
      
      // Adicionar indicação de que é uma cópia no nome
      modeloDuplicado.nome = `${modeloDuplicado.nome} (Cópia)`;
      
      // Abrir formulário com o modelo duplicado para edição
      setEtiquetaParaDuplicar(modeloDuplicado);
      setShowModeloForm(true);
    } catch (error) {
      console.error("Erro ao duplicar modelo:", error);
      toast.error("Erro ao duplicar modelo de etiqueta");
    }
  };

  if (showModeloForm) {
    return <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
          </DialogHeader>
          <EtiquetaCustomForm 
            onClose={() => setShowModeloForm(false)} 
            onSuccess={handleModeloSuccess} 
            modelo={etiquetaParaDuplicar || undefined}
          />
        </DialogContent>
      </Dialog>;
  }

  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Imprimir Etiquetas</DialogTitle>
          <DialogDescription>
            Configure as opções de impressão para gerar etiquetas para o item selecionado.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="label-model">Modelo de Etiqueta</Label>
              <Select value={selectedModeloId} onValueChange={setSelectedModeloId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um modelo" />
                </SelectTrigger>
                <SelectContent>
                  {modelosCustom.length > 0 ? modelosCustom.map(modelo => (
                    <SelectItem key={modelo.id} value={modelo.id || ""}>
                      {modelo.nome}
                    </SelectItem>
                  )) : (
                    <SelectItem value="sem-modelos" disabled>
                      Nenhum modelo disponível
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="copies">Cópias</Label>
              <Input id="copies" type="number" min="1" value={copies} onChange={e => setCopies(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-row">Linha início</Label>
              <Input id="start-row" type="number" min="1" value={startRow} onChange={e => setStartRow(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start-column">Coluna início</Label>
              <Input id="start-column" type="number" min="1" value={startColumn} onChange={e => setStartColumn(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="multiply-stock" checked={multiplyByStock} onCheckedChange={setMultiplyByStock} />
            <Label htmlFor="multiply-stock">Multiplicar por estoque</Label>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Gerenciar Modelos</h3>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={duplicarModelo} 
                disabled={!selectedModelo}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Duplicar
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowModeloForm(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Novo Modelo
              </Button>
            </div>
          </div>
          
          {selectedModelo && <div className="border p-4 rounded-md bg-slate-50">
              <h4 className="font-medium mb-2">Detalhes do modelo: {selectedModelo.nome}</h4>
              <div className="text-sm space-y-1">
                <p>Dimensões da etiqueta: {selectedModelo.largura}mm × {selectedModelo.altura}mm</p>
                <p>Formato da página: {selectedModelo.formatoPagina} 
                  {selectedModelo.formatoPagina === "Personalizado" && selectedModelo.larguraPagina && selectedModelo.alturaPagina ? ` (${selectedModelo.larguraPagina}mm × ${selectedModelo.alturaPagina}mm)` : ""}
                </p>
                <p>Orientação: {selectedModelo.orientacao === "retrato" ? "Retrato" : "Paisagem"}</p>
              </div>
            </div>}
          
          {modeloWarning && <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
              <AlertTriangle className="h-4 w-4 text-yellow-700" />
              <AlertTitle className="text-yellow-800">Atenção</AlertTitle>
              <AlertDescription className="text-yellow-700">
                {modeloWarning}
              </AlertDescription>
            </Alert>}
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button onClick={handlePrint} disabled={isProcessing || !selectedModeloId}>
            {isProcessing ? "Processando..." : "Imprimir"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>;
}
