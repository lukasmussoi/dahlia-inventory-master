
/**
 * Diálogo para Abrir Maleta
 * @file Exibe os itens e histórico da maleta para administradores
 * @relacionamento Utilizado pelo SuitcaseCard quando o admin clica em "Abrir Maleta"
 * @modificação BUG CRÍTICO CORRIGIDO - Ciclo de vida da modal completamente refeito para evitar travamentos ao fechar
 */
import { useEffect, useState, useCallback } from "react";
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
  console.log(`[OpenSuitcaseDialog] Renderizando diálogo, open: ${open}, suitcaseId: ${suitcaseId}`);
  
  // Controle de estado interno do fechamento
  const [isDialogClosing, setIsDialogClosing] = useState(false);
  
  // Hook principal para gerenciar dados e ações da maleta
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
  } = useOpenSuitcase(open ? suitcaseId : null, open);

  // Manipulador seguro de fechamento
  const handleCloseDialog = useCallback(() => {
    console.log("[OpenSuitcaseDialog] Iniciando sequência de fechamento seguro");
    // Marca que estamos no processo de fechamento
    setIsDialogClosing(true);
    // Notifica o componente pai para atualizar seu estado
    onOpenChange(false);
  }, [onOpenChange]);

  // Efeito para gerenciar abertura/fechamento e limpeza do diálogo
  useEffect(() => {
    // Quando abrir a modal, resetar o estado de fechamento
    if (open) {
      console.log("[OpenSuitcaseDialog] Modal aberta - resetando estado de fechamento");
      setIsDialogClosing(false);
    }
    
    // Quando fechar a modal, realizar limpeza após a animação
    if (!open) {
      console.log("[OpenSuitcaseDialog] Modal fechada - aguardando animação");
      
      // Aguardar a conclusão da animação antes de limpar estados
      const cleanupTimeout = setTimeout(() => {
        console.log("[OpenSuitcaseDialog] Animação concluída - executando limpeza completa de estado");
        resetState();
        setIsDialogClosing(false);
        console.log("[OpenSuitcaseDialog] Limpeza finalizada - modal completamente fechada");
      }, 300); // Tempo aproximado da animação de fechamento do shadcn Dialog
      
      // Limpar timeout se o componente for desmontado
      return () => {
        console.log("[OpenSuitcaseDialog] Limpando timeout de animação");
        clearTimeout(cleanupTimeout);
      };
    }
  }, [open, resetState]);

  // Renderização condicional baseada no estado de carregamento
  if (isLoading) {
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

  // Renderização do conteúdo principal
  return (
    <Dialog open={open} onOpenChange={handleCloseDialog}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogTitle>
          {suitcase ? `Maleta ${suitcase.code}` : "Detalhes da Maleta"}
        </DialogTitle>
        
        {suitcase && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
        )}
        
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={handleCloseDialog}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
