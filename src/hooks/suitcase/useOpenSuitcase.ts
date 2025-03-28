
/**
 * Hook para Abrir Maleta
 * @file Gerencia o estado e as operações de visualização, devolução e marcação de itens danificados
 * @relacionamento Utilizado pelo OpenSuitcaseDialog para gerenciar as abas e operações com itens
 * @modificação Corrigido bug de travamento ao fechar a modal, melhorando gerenciamento de estado e limpeza de recursos
 */
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useSuitcaseQueries } from "./useSuitcaseQueries";
import { CombinedSuitcaseController } from "@/controllers/suitcase";
import { InventoryController } from "@/controllers/inventoryController";

export function useOpenSuitcase(suitcaseId: string, open: boolean) {
  // Estado para controle da aba ativa - sempre mantenha este estado
  // mesmo quando a modal estiver fechada
  const [activeTab, setActiveTab] = useState<'itens' | 'historico'>('itens');

  // Consultas para buscar dados da maleta, itens e histórico
  // Passamos suitcaseId apenas quando open for true para evitar consultas desnecessárias
  const {
    suitcase,
    promoterInfo,
    suitcaseItems,
    acertosHistorico,
    isLoadingSuitcase,
    isLoadingSuitcaseItems,
    isLoadingAcertos,
    loadingPromoterInfo,
    refetchSuitcaseItems,
    resetQueryState
  } = useSuitcaseQueries(open ? suitcaseId : null, open);

  // Estado de carregamento combinado
  const isLoading = isLoadingSuitcase || isLoadingSuitcaseItems || isLoadingAcertos || loadingPromoterInfo;

  // Função para devolver item ao estoque
  const handleReturnToInventory = useCallback(async (itemId: string, quantity: number = 1) => {
    try {
      console.log(`[useOpenSuitcase] Devolvendo item ${itemId} ao estoque, quantidade: ${quantity}`);
      
      // Verificar se o item existe no estado atual
      const item = suitcaseItems.find(item => item.id === itemId);
      if (!item) {
        toast.error("Item não encontrado na maleta");
        return;
      }

      // Verificar se a quantidade é válida
      if (quantity <= 0 || (item.quantity && quantity > item.quantity)) {
        toast.error(`Quantidade inválida. Deve ser entre 1 e ${item.quantity || 1}`);
        return;
      }

      // Se estamos devolvendo apenas parte das unidades
      if (item.quantity && quantity < item.quantity) {
        // Primeiro, reduzir a quantidade do item na maleta
        await CombinedSuitcaseController.updateSuitcaseItemQuantity(itemId, item.quantity - quantity);
        
        // Depois, incrementar o estoque
        await InventoryController.createMovement({
          inventory_id: item.inventory_id,
          quantity: quantity,
          movement_type: "retorno da maleta",
          reason: `Devolução parcial (${quantity} unidades) da maleta ${suitcase?.code || ''}`
        });
        
        toast.success(`${quantity} ${quantity === 1 ? 'unidade devolvida' : 'unidades devolvidas'} ao estoque`);
      } else {
        // Se estamos devolvendo todas as unidades, usar a função existente que já lida com o estoque
        await CombinedSuitcaseController.returnItemToInventory(itemId, false);
        toast.success("Item devolvido ao estoque com sucesso");
      }
      
      // Atualizar a lista de itens
      refetchSuitcaseItems();
    } catch (error) {
      console.error("[useOpenSuitcase] Erro ao devolver item ao estoque:", error);
      toast.error("Erro ao devolver item ao estoque");
    }
  }, [suitcaseItems, suitcase, refetchSuitcaseItems]);

  // Função para marcar item como danificado
  const handleMarkAsDamaged = useCallback(async (itemId: string) => {
    try {
      console.log(`[useOpenSuitcase] Marcando item ${itemId} como danificado`);
      
      // Verificar se o item existe no estado atual
      const item = suitcaseItems.find(item => item.id === itemId);
      if (!item) {
        toast.error("Item não encontrado na maleta");
        return;
      }

      // Se o item tem mais de uma unidade, reduzir a quantidade em vez de marcá-lo completamente como danificado
      if (item.quantity && item.quantity > 1) {
        // Reduzir a quantidade em 1
        await CombinedSuitcaseController.updateSuitcaseItemQuantity(itemId, item.quantity - 1);
        
        // Registrar o item danificado
        await InventoryController.createMovement({
          inventory_id: item.inventory_id,
          quantity: -1, // Redução de uma unidade
          movement_type: "danificado",
          reason: `Item danificado da maleta ${suitcase?.code || ''}`
        });
        
        // Registrar no inventory_damaged_items sem afetar o status do item na maleta
        await CombinedSuitcaseController.returnItemToInventory(itemId, true);
        
        toast.success("Uma unidade marcada como danificada");
      } else {
        // Se só tem uma unidade, marcar o item todo como danificado
        await CombinedSuitcaseController.returnItemToInventory(itemId, true);
        toast.success("Item marcado como danificado");
      }
      
      // Atualizar a lista de itens
      refetchSuitcaseItems();
    } catch (error) {
      console.error("[useOpenSuitcase] Erro ao marcar item como danificado:", error);
      toast.error("Erro ao marcar item como danificado");
    }
  }, [suitcaseItems, suitcase, refetchSuitcaseItems]);

  // Função melhorada para reset completo do estado
  const resetState = useCallback(() => {
    console.log("[useOpenSuitcase] Iniciando limpeza completa do estado");
    
    // Reset da aba ativa para o valor inicial
    setActiveTab('itens');
    
    // Limpeza do cache de queries
    resetQueryState();
    
    console.log("[useOpenSuitcase] Limpeza de estado concluída com sucesso");
  }, [resetQueryState]);

  return {
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
  };
}
