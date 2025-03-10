
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { generatePdfLabel } from "@/utils/pdfUtils";
import { toast } from "sonner";
import { LabelModel } from "@/models/labelModel";

interface PrintLabelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: any; // Tipo do item a ser impresso
}

export function PrintLabelDialog({ isOpen, onClose, item }: PrintLabelDialogProps) {
  const [labelModel] = useState("Padrão");
  const [copies, setCopies] = useState("1");
  const [startRow, setStartRow] = useState("1");
  const [startColumn, setStartColumn] = useState("1");
  const [multiplyByStock, setMultiplyByStock] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Resetar estado quando o modal é aberto/fechado
  useEffect(() => {
    if (isOpen) {
      setCopies("1");
      setStartRow("1");
      setStartColumn("1");
      setMultiplyByStock(false);
    }
  }, [isOpen]);

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

      // Gerar PDF temporário
      const pdfUrl = await generatePdfLabel({
        item,
        copies: parseInt(copies),
        startRow: parseInt(startRow),
        startColumn: parseInt(startColumn),
        multiplyByStock,
      });

      // Registrar impressão no histórico
      await LabelModel.registerLabelPrint(item.id, parseInt(copies));

      // Abrir PDF em nova aba
      window.open(pdfUrl, '_blank');
      
      toast.success("Etiquetas geradas com sucesso!");
      onClose();
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar etiquetas. Por favor, tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Impressão de etiquetas</DialogTitle>
          <DialogDescription>
            Configure as opções de impressão para o item: {item?.name || ''}
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
