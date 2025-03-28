
/**
 * Modal de Abertura de Maleta 
 * @file Componente que exibe os detalhes da maleta em uma janela modal
 * @relacionamento Utilizado pelo card de maleta quando o administrador clica em "Abrir Maleta"
 */
import React, { useEffect, useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingIndicator } from "@/components/shared/LoadingIndicator";
import { SuitcaseItemsTab } from "@/components/suitcases/open/tabs/SuitcaseItemsTab";
import { SuitcaseHistoryTab } from "@/components/suitcases/open/tabs/SuitcaseHistoryTab";
import { toast } from "sonner";
import { CombinedSuitcaseController } from "@/controllers/suitcase";
import { Suitcase } from "@/types/suitcase";

interface OpenSuitcaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suitcaseId: string | null;
}

export function OpenSuitcaseModal({ open, onOpenChange, suitcaseId }: OpenSuitcaseModalProps) {
  // Estados básicos
  const [activeTab, setActiveTab] = useState<'itens' | 'historico'>('itens');
  const [isLoading, setIsLoading] = useState(true);
  const [suitcase, setSuitcase] = useState<Suitcase | null>(null);
  const [promoterInfo, setPromoterInfo] = useState<any>(null);
  const [suitcaseItems, setSuitcaseItems] = useState<any[]>([]);
  const [acertosHistorico, setAcertosHistorico] = useState<any[]>([]);

  // Função para carregar todos os dados necessários
  const loadAllData = async () => {
    if (!suitcaseId || !open) return;
    
    setIsLoading(true);
    
    try {
      // Carregar dados da maleta
      const suitcaseData = await CombinedSuitcaseController.getSuitcaseById(suitcaseId);
      setSuitcase(suitcaseData);
      
      // Carregar dados da promotora, se tiver seller_id
      if (suitcaseData?.seller_id) {
        const promoterData = await CombinedSuitcaseController.getPromoterForReseller(suitcaseData.seller_id);
        setPromoterInfo(promoterData);
      }
      
      // Carregar itens da maleta
      const items = await CombinedSuitcaseController.getSuitcaseItems(suitcaseId);
      setSuitcaseItems(items || []);
      
      // Carregar histórico de acertos
      const historico = await CombinedSuitcaseController.getHistoricoAcertos(suitcaseId);
      setAcertosHistorico(historico || []);
    } catch (error) {
      console.error('Erro ao carregar dados da maleta:', error);
      toast.error('Erro ao carregar dados da maleta');
    } finally {
      setIsLoading(false);
    }
  };

  // Função simples para limpar todos os estados
  const resetAllStates = () => {
    setActiveTab('itens');
    setSuitcase(null);
    setPromoterInfo(null);
    setSuitcaseItems([]);
    setAcertosHistorico([]);
  };

  // Função para fechar a modal com segurança
  const handleCloseModal = () => {
    onOpenChange(false);
  };

  // Efeito para carregar dados quando a modal é aberta
  useEffect(() => {
    if (open && suitcaseId) {
      loadAllData();
    }
    
    // Limpar estados quando a modal é fechada
    if (!open) {
      resetAllStates();
    }
  }, [open, suitcaseId]);

  // Função para devolver item ao estoque
  const handleReturnToInventory = async (itemId: string, quantity: number = 1) => {
    try {
      await CombinedSuitcaseController.returnItemToInventory(itemId, false);
      toast.success("Item devolvido ao estoque com sucesso");
      
      // Recarregar lista de itens
      if (suitcaseId) {
        const items = await CombinedSuitcaseController.getSuitcaseItems(suitcaseId);
        setSuitcaseItems(items || []);
      }
    } catch (error) {
      console.error("Erro ao devolver item ao estoque:", error);
      toast.error("Erro ao devolver item ao estoque");
    }
  };

  // Função para marcar item como danificado
  const handleMarkAsDamaged = async (itemId: string) => {
    try {
      await CombinedSuitcaseController.returnItemToInventory(itemId, true);
      toast.success("Item marcado como danificado");
      
      // Recarregar lista de itens
      if (suitcaseId) {
        const items = await CombinedSuitcaseController.getSuitcaseItems(suitcaseId);
        setSuitcaseItems(items || []);
      }
    } catch (error) {
      console.error("Erro ao marcar item como danificado:", error);
      toast.error("Erro ao marcar item como danificado");
    }
  };

  // Renderização durante carregamento
  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={handleCloseModal}>
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
            Maleta {suitcase?.code || 'Sem código'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'itens' | 'historico')} className="w-full">
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
          <Button variant="outline" onClick={handleCloseModal}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
