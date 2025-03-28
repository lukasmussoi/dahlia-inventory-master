
/**
 * Diálogo para Abrir Maleta
 * @file Exibe os itens e histórico da maleta para administradores
 * @relacionamento Utilizado pelo SuitcaseCard quando o admin clica em "Abrir Maleta"
 * @modificação CORREÇÃO DEFINITIVA - Reformulado o ciclo de vida para garantir limpeza completa e evitar travamentos
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
  
  // Estado para controlar o processo de fechamento da modal
  const [isClosing, setIsClosing] = useState(false);

  // Hook principal que gerencia todos os dados e operações da maleta
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

  // Manipulador seguro para fechamento da modal
  const handleCloseDialog = useCallback(() => {
    console.log("[OpenSuitcaseDialog] Iniciando processo de fechamento seguro");
    setIsClosing(true);
    onOpenChange(false);
  }, [onOpenChange]);

  // Função para tratar a mudança de abas com validação de tipo
  const handleTabChange = useCallback((value: string) => {
    if (value === 'itens' || value === 'historico') {
      setActiveTab(value);
    }
  }, [setActiveTab]);

  // Efeito para gerenciar abertura e fechamento da modal, garantindo limpeza completa
  useEffect(() => {
    // Quando abrir a modal, resetar o estado de fechamento
    if (open) {
      console.log("[OpenSuitcaseDialog] Modal aberta - preparando ambiente");
      setIsClosing(false);
    }
    
    // Quando a modal é fechada, aguardar a animação terminar antes de limpar os estados
    if (!open && !isClosing) {
      console.log("[OpenSuitcaseDialog] Modal fechada - iniciando sequência de limpeza");
      
      // Aguardar a animação de fechamento antes de limpar o estado
      const cleanupTimeout = setTimeout(() => {
        console.log("[OpenSuitcaseDialog] Animação concluída - executando limpeza completa");
        resetState();
        setIsClosing(false);
        console.log("[OpenSuitcaseDialog] Limpeza finalizada - sistema pronto para nova interação");
      }, 300); // Tempo aproximado da animação do Dialog do shadcn
      
      // Limpar o timeout se o componente for desmontado antes de sua conclusão
      return () => clearTimeout(cleanupTimeout);
    }
  }, [open, resetState, isClosing]);

  // Renderização durante carregamento
  if (isLoading && open) {
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

  // Renderização principal do conteúdo
  return (
    <Dialog open={open} onOpenChange={handleCloseDialog}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogTitle>
          {suitcase ? `Maleta ${suitcase.code}` : "Detalhes da Maleta"}
        </DialogTitle>
        
        {suitcase && (
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
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
