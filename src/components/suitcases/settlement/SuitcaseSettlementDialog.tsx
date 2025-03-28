
/**
 * Componente de Diálogo de Acerto de Maleta
 * @file Exibe formulário para realizar acerto de maleta
 * @relacionamento Utilizado pelo componente SuitcaseCard
 */
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Suitcase } from "@/types/suitcase";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface SuitcaseSettlementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suitcase: Suitcase;
  onRefresh?: () => void;
}

export function SuitcaseSettlementDialog({
  open,
  onOpenChange,
  suitcase,
  onRefresh
}: SuitcaseSettlementDialogProps) {
  // Estado local para controlar o carregamento
  const [isLoading, setIsLoading] = useState(false);

  // Limpar estado ao fechar
  useEffect(() => {
    if (!open) {
      setIsLoading(false);
    }
  }, [open]);

  // Função para recarregar a página ao fechar o diálogo
  const handleForceReload = () => {
    console.log("Forçando recarga da página para resolver problemas de travamento");
    window.location.reload();
  };

  // Manipular mudança segura do diálogo
  const handleDialogChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Forçar recarga da página ao invés de apenas fechar o diálogo
      handleForceReload();
      return;
    }
    
    onOpenChange(newOpen);
  };

  // Esta é uma implementação inicial para resolver o erro
  // Será expandida posteriormente conforme solicitado pelo usuário
  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Botão X customizado que força recarga da página */}
        <button 
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          onClick={handleForceReload}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Fechar</span>
        </button>

        <DialogHeader>
          <DialogTitle>Acerto da Maleta: {suitcase.code}</DialogTitle>
          <DialogDescription>
            Registro de acertos da maleta para controle financeiro.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-center text-gray-500">
            Funcionalidade de acerto em desenvolvimento.
          </p>
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={handleForceReload}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
