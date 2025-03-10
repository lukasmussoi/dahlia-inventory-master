
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Plus } from "lucide-react";
import { LabelModel } from "@/models/labelModel";
import { generatePdfLabel } from "@/utils/pdfUtils";
import { EtiquetaCustomModel } from "@/models/etiquetaCustomModel";
import { EtiquetaCustomForm } from "./EtiquetaCustomForm";
import type { ModeloEtiqueta } from "@/types/etiqueta";

interface PrintLabelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: any; // Tipo do item a ser impresso
}

export function PrintLabelDialog({ isOpen, onClose, item }: PrintLabelDialogProps) {
  const [labelModel, setLabelModel] = useState("Padrão");
  const [copies, setCopies] = useState("1");
  const [startRow, setStartRow] = useState("1");
  const [startColumn, setStartColumn] = useState("1");
  const [multiplyByStock, setMultiplyByStock] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModeloForm, setShowModeloForm] = useState(false);
  const [modelosCustom, setModelosCustom] = useState<ModeloEtiqueta[]>([]);
  const [selectedModeloId, setSelectedModeloId] = useState<string | undefined>(undefined);
  const [selectedModelo, setSelectedModelo] = useState<ModeloEtiqueta | null>(null);

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
    }
  }, [isOpen]);

  // Carregar detalhes do modelo selecionado
  useEffect(() => {
    if (selectedModeloId) {
      const carregarModeloSelecionado = async () => {
        try {
          console.log("Carregando detalhes do modelo:", selectedModeloId);
          const modelo = await EtiquetaCustomModel.getById(selectedModeloId);
          console.log("Detalhes do modelo carregado:", modelo);
          
          if (modelo) {
            setSelectedModelo(modelo);
            console.log("Campos do modelo carregado:", modelo.campos);
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

  const handleModeloSuccess = async () => {
    setShowModeloForm(false);
    try {
      const modelos = await EtiquetaCustomModel.getAll();
      setModelosCustom(modelos);
      toast.success("Modelo de etiqueta adicionado com sucesso!");
    } catch (error) {
      console.error("Erro ao recarregar modelos:", error);
    }
  };

  if (showModeloForm) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Criar Novo Modelo de Etiqueta</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para criar um novo modelo de etiqueta personalizada.
            </DialogDescription>
          </DialogHeader>
          <EtiquetaCustomForm
            onClose={() => setShowModeloForm(false)}
            onSuccess={handleModeloSuccess}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Imprimir Etiquetas</DialogTitle>
          <DialogDescription>
            Configure as opções de impressão para gerar etiquetas para o item selecionado.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
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
          <div className="flex items-center space-x-2">
            <Switch
              id="multiply-stock"
              checked={multiplyByStock}
              onCheckedChange={setMultiplyByStock}
            />
            <Label htmlFor="multiply-stock">Multiplicar por estoque</Label>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Modelo de Etiqueta</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowModeloForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Novo Modelo
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button onClick={handlePrint} disabled={isProcessing}>
            {isProcessing ? "Processando..." : "Imprimir"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
