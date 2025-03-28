
/**
 * Componente de Diálogo de Acerto de Maleta
 * @file Exibe formulário para realizar acerto de maleta
 * @relacionamento Utilizado pelo componente SuitcaseCard
 */
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Suitcase } from "@/types/suitcase";
import { useState, useEffect } from "react";

interface SuitcaseSettlementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suitcase: Suitcase | null;
  suitcaseId?: string | null;
  onRefresh?: () => void;
}

export function SuitcaseSettlementDialog({
  open,
  onOpenChange,
  suitcase,
  suitcaseId,
  onRefresh
}: SuitcaseSettlementDialogProps) {
  // Estado local para controlar o carregamento
  const [isLoading, setIsLoading] = useState(false);
  
  // Obter o ID da maleta de uma das duas fontes
  const effectiveSuitcaseId = suitcase?.id || suitcaseId;

  // Limpar estado ao fechar
  useEffect(() => {
    if (!open) {
      setIsLoading(false);
    }
  }, [open]);

  // Manipular mudança segura do diálogo
  const handleDialogChange = (newOpen: boolean) => {
    if (!newOpen && isLoading) {
      // Não fechar se estiver em processamento
      return;
    }
    
    // Limpar estado antes de fechar
    if (!newOpen) {
      setIsLoading(false);
    }
    
    onOpenChange(newOpen);
  };

  // Esta é uma implementação inicial para resolver o erro
  // Será expandida posteriormente conforme solicitado pelo usuário
  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Acerto da Maleta: {suitcase?.code}</DialogTitle>
          <DialogDescription>
            Registro de acertos da maleta para controle financeiro.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-center text-gray-500">
            Funcionalidade de acerto em desenvolvimento.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
