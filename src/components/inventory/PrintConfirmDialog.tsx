
/**
 * PrintConfirmDialog - Componente para confirmar impressão de etiquetas após criar/editar um item
 * 
 * Exibe um diálogo perguntando ao usuário se deseja imprimir a etiqueta de um item
 * recém-criado ou editado.
 * 
 * Relaciona-se com:
 * - InventoryContent.tsx (chamador)
 * - PrintLabelDialog.tsx (abre quando o usuário confirma)
 */
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useState } from "react";
import { PrintLabelDialog } from "./labels/PrintLabelDialog";

interface PrintConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: any | null;
}

export function PrintConfirmDialog({ isOpen, onClose, item }: PrintConfirmDialogProps) {
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  
  // Manipulador para quando o usuário confirma a impressão
  const handleConfirm = () => {
    setShowPrintDialog(true);
  };
  
  // Manipulador para quando o usuário cancela a impressão
  const handleCancel = () => {
    onClose();
  };
  
  // Manipulador para fechar o diálogo de impressão
  const handlePrintDialogClose = () => {
    setShowPrintDialog(false);
    onClose();
  };
  
  return (
    <>
      <Dialog open={isOpen && !showPrintDialog} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Impressão de Etiqueta</DialogTitle>
            <DialogDescription>
              Deseja imprimir a etiqueta para este item agora?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
            >
              Não, obrigado
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Imprimir Etiqueta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de impressão de etiquetas */}
      {item && (
        <PrintLabelDialog
          isOpen={showPrintDialog}
          onClose={handlePrintDialogClose}
          items={[item]}
        />
      )}
    </>
  );
}
