
/**
 * Modal de Abertura de Maleta 
 * @file Componente que exibe os detalhes da maleta em uma janela modal
 * @relacionamento Utilizado pelo card de maleta quando o administrador clica em "Abrir Maleta"
 */
import React, { useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { LoadingIndicator } from "@/components/shared/LoadingIndicator";
import { SuitcaseItemsTab } from "@/components/suitcases/open/tabs/SuitcaseItemsTab";
import { SuitcaseHistoryTab } from "@/components/suitcases/open/tabs/SuitcaseHistoryTab";
import { useOpenSuitcase } from "@/hooks/suitcase/useOpenSuitcase";

interface OpenSuitcaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suitcaseId: string | null;
}

export function OpenSuitcaseModal({ open, onOpenChange, suitcaseId }: OpenSuitcaseModalProps) {
  // Custom hook para gerenciar os dados e operações da maleta
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

  // Efeito para limpar dados ao fechar modal
  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open, resetState]);

  // Função para fechar a modal com segurança
  const handleCloseModal = () => {
    // Garantir que o estado seja resetado antes de fechar
    resetState();
    onOpenChange(false);
  };

  // Função para tratar a mudança de abas
  const handleTabChange = (value: string) => {
    if (value === 'itens' || value === 'historico') {
      setActiveTab(value as 'itens' | 'historico');
    }
  };

  // Renderização durante carregamento
  if (isLoading || !suitcase) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Maleta</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center p-8">
            <LoadingIndicator />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleCloseModal}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Maleta {suitcase.code}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
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
          <DialogClose asChild>
            <Button variant="outline" onClick={handleCloseModal}>
              Fechar
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
