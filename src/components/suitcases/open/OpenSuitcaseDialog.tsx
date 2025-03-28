
/**
 * Diálogo para Abrir Maleta
 * @file Exibe os itens e histórico da maleta para administradores
 * @relacionamento Utilizado pelo SuitcaseCard quando o admin clica em "Abrir Maleta"
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

  // Limpar estado ao fechar o diálogo
  useEffect(() => {
    if (!open) resetState();
  }, [open, resetState]);

  if (isLoading || !suitcase) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogTitle>Carregando detalhes da maleta...</DialogTitle>
          <div className="flex justify-center items-center p-8">
            <LoadingIndicator />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
