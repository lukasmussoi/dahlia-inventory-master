
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PrintLabelDialog } from "./labels/PrintLabelDialog";

interface PrintLabelConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
}

export function PrintLabelConfirmDialog({
  isOpen,
  onClose,
  item
}: PrintLabelConfirmDialogProps) {
  const [showPrintDialog, setShowPrintDialog] = useState(false);

  const handleConfirm = () => {
    setShowPrintDialog(true);
  };

  const handleCancel = () => {
    onClose();
  };

  const handlePrintDialogClose = () => {
    setShowPrintDialog(false);
    onClose();
  };

  // Se o diálogo de impressão estiver aberto, mostrar ele ao invés do diálogo de confirmação
  if (showPrintDialog) {
    return (
      <PrintLabelDialog 
        isOpen={showPrintDialog} 
        onClose={handlePrintDialogClose} 
        items={item ? [item] : []} 
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Imprimir Etiqueta</DialogTitle>
          <DialogDescription>
            Deseja imprimir a etiqueta deste item agora?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="outline" onClick={handleCancel}>
            Não
          </Button>
          <Button onClick={handleConfirm}>
            Sim
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
