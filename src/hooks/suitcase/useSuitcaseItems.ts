
/**
 * Hook para Gerenciamento de Itens de Maleta
 * @file Fornece funções para manipular itens das maletas, incluindo devoluções e itens danificados
 * @relacionamento Utilizado por useSuitcaseDetails para gerenciar operações de itens
 */
import { useState } from "react";
import { SuitcaseItem } from "@/types/suitcase";
import { CombinedSuitcaseController } from "@/controllers/suitcase";
import { toast } from "sonner";

export function useSuitcaseItems() {
  const [processingItems, setProcessingItems] = useState<{ [key: string]: boolean }>({});

  // Função para alternar status de vendido
  const handleToggleSold = async (item: SuitcaseItem, sold: boolean) => {
    try {
      setProcessingItems(prev => ({ ...prev, [item.id]: true }));
      const newStatus = sold ? "sold" : "in_possession";
      await CombinedSuitcaseController.updateSuitcaseItemStatus(item.id, newStatus);
      return true;
    } catch (error) {
      console.error("Erro ao atualizar status do item:", error);
      toast.error("Erro ao atualizar status do item");
      return false;
    } finally {
      setProcessingItems(prev => ({ ...prev, [item.id]: false }));
    }
  };

  // Função para atualizar informações de venda
  const handleUpdateSaleInfo = async (itemId: string, field: string, value: string) => {
    try {
      setProcessingItems(prev => ({ ...prev, [itemId]: true }));
      await CombinedSuitcaseController.updateSaleInfo(itemId, field, value);
      return true;
    } catch (error) {
      console.error("Erro ao atualizar informações de venda:", error);
      toast.error("Erro ao atualizar informações de venda");
      return false;
    } finally {
      setProcessingItems(prev => ({ ...prev, [itemId]: false }));
    }
  };

  // Função para retornar itens ao estoque (normal ou danificado)
  const handleReturnToInventory = async (itemIds: string[], quantity: number, isDamaged: boolean) => {
    try {
      // Marque todos os itens como em processamento
      const processingState: { [key: string]: boolean } = {};
      itemIds.forEach(id => { processingState[id] = true; });
      setProcessingItems(prev => ({ ...prev, ...processingState }));
      
      // Processar o retorno dos itens
      await CombinedSuitcaseController.returnItemsToInventory(itemIds, isDamaged);
      
      const action = isDamaged ? "marcados como danificados" : "devolvidos ao estoque";
      toast.success(`${quantity} itens ${action} com sucesso`);
      return true;
    } catch (error) {
      console.error(`Erro ao processar itens (danificado: ${isDamaged}):`, error);
      toast.error(`Erro ao processar itens. Por favor, tente novamente.`);
      return false;
    } finally {
      // Desmarque todos os itens
      const processingState: { [key: string]: boolean } = {};
      itemIds.forEach(id => { processingState[id] = false; });
      setProcessingItems(prev => ({ ...prev, ...processingState }));
    }
  };

  // Calcular valor total da maleta
  const calculateTotalValue = (suitcaseItems: SuitcaseItem[]) => {
    return suitcaseItems
      .filter(item => item.status === 'in_possession')
      .reduce((total, item) => {
        return total + (item.product?.price || 0) * (item.quantity || 1);
      }, 0);
  };

  return {
    processingItems,
    handleToggleSold,
    handleUpdateSaleInfo,
    handleReturnToInventory,
    calculateTotalValue
  };
}
