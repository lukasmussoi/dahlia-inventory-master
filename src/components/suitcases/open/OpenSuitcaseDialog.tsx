
/**
 * Diálogo para Abrir Maleta
 * @file Exibe os itens e histórico da maleta para administradores
 * @relacionamento Utilizado pelo SuitcaseCard quando o admin clica em "Abrir Maleta"
 * @modificação Corrigido bug de travamento ao fechar a modal, garantindo ordem consistente de hooks e limpeza de estados
 */
import { useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingIndicator } from "@/components/shared/LoadingIndicator";
import { Button } from "@/components/ui/button";
import { SuitcaseItemsTab } from "./tabs/SuitcaseItemsTab";
import { SuitcaseHistoryTab } from "./tabs/SuitcaseHistoryTab";
import { useOpenSuitcase } from "@/hooks/suitcase/useOpenSuitcase";

interface OpenSuitcaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suitcaseId: string;
}

export function OpenSuitcaseDialog({
  open,
  onOpenChange,
  suitcaseId
}: OpenSuitcaseDialogProps) {
  // Importante: Sempre obtenha o hook useOpenSuitcase, mesmo quando fechado
  // para manter a consistência na ordem dos hooks
  const {
    activeTab,
    setActiveTab,
    suitcase,
    promoterInfo,
    suitcaseItems,
    acertosHistorico,
    isLoading,
    handleReturnToInventory,
    handleMarkAsDamaged,
    resetState
  } = useOpenSuitcase(suitcaseId, open);

  // Gerenciamento seguro de fechamento da modal
  const handleCloseDialog = () => {
    console.log("[OpenSuitcaseDialog] Iniciando processo de fechamento da modal");
    // Primeiro notifica a mudança de estado para fechar a modal
    onOpenChange(false);
  };

  // Efeito para limpeza de estado ao fechar o diálogo
  // Mantido fora de qualquer condicional para evitar problemas de hook
  useEffect(() => {
    if (!open) {
      console.log("[OpenSuitcaseDialog] Modal fechada, iniciando limpeza");
      
      // Usando setTimeout para garantir que a limpeza ocorra após a animação de fechamento
      const cleanupTimeout = setTimeout(() => {
        resetState();
        console.log("[OpenSuitcaseDialog] Limpeza completa após animação");
      }, 300); // Tempo aproximado da animação de fechamento
      
      return () => {
        clearTimeout(cleanupTimeout);
        console.log("[OpenSuitcaseDialog] Limpeza do timeout de fechamento");
      };
    }
  }, [open, resetState]);

  // Renderização condicional do conteúdo baseada no estado de carregamento
  // Não usamos condicionais para os hooks, apenas para o JSX renderizado
  if (isLoading || !suitcase) {
    return (
      <Dialog open={open} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogTitle>Carregando detalhes da maleta...</DialogTitle>
          <div className="flex justify-center items-center p-8">
            <LoadingIndicator />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Renderização do conteúdo principal quando carregado
  return (
    <Dialog open={open} onOpenChange={handleCloseDialog}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogTitle>Maleta {suitcase.code}</DialogTitle>
        
        <Tabs value={activeTab} onValueChange={setActiveTab as any} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="itens">Itens da Maleta</TabsTrigger>
            <TabsTrigger value="historico">Histórico da Maleta</TabsTrigger>
          </TabsList>
          
          <TabsContent value="itens">
            <SuitcaseItemsTab 
              suitcase={suitcase}
              promoterInfo={promoterInfo}
              suitcaseItems={suitcaseItems}
              onReturnToInventory={handleReturnToInventory}
              onMarkAsDamaged={handleMarkAsDamaged}
            />
          </TabsContent>
          
          <TabsContent value="historico">
            <SuitcaseHistoryTab 
              suitcase={suitcase}
              acertosHistorico={acertosHistorico}
            />
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={handleCloseDialog}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
