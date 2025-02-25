
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { generatePdfLabel } from "@/utils/pdfUtils";

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

  const handlePrint = async () => {
    try {
      // Gerar PDF temporário
      const pdfUrl = await generatePdfLabel({
        item,
        copies: parseInt(copies),
        startRow: parseInt(startRow),
        startColumn: parseInt(startColumn),
        multiplyByStock,
      });

      // Abrir PDF em nova aba
      window.open(pdfUrl, '_blank');
      
      onClose();
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Impressão de etiquetas</DialogTitle>
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
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handlePrint}>
            Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
