
/**
 * Hook para Abrir Maleta
 * @file Gerencia o estado e as operações de visualização, devolução e marcação de itens danificados
 * @relacionamento Utilizado pela página OpenSuitcasePage e pelo modal OpenSuitcaseModal
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useSuitcaseQueries } from "./useSuitcaseQueries";
import { CombinedSuitcaseController } from "@/controllers/suitcase";
import { InventoryController } from "@/controllers/inventoryController";

export function useOpenSuitcase(suitcaseId: string | null, isActive: boolean) {
  console.log(`[useOpenSuitcase] Inicializando hook, suitcaseId: ${suitcaseId}, isActive: ${isActive}`);
  
  // Referência para controlar se o componente ainda está montado
  const isMounted = useRef(true);
  
  // Estado para controle da aba ativa
  const [activeTab, setActiveTab] = useState<'itens' | 'historico'>('itens');

  // Hook para buscar dados da maleta
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
    resetQueries
  } = useSuitcaseQueries(suitcaseId, isActive);

  // Efeito para gerenciar o ciclo de vida do componente
  useEffect(() => {
    console.log("[useOpenSuitcase] Componente montado");
    isMounted.current = true;
    
    return () => {
      console.log("[useOpenSuitcase] Componente desmontando");
      isMounted.current = false;
    };
  }, []);

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
        // Se estamos devolvendo todas as unidades, usar a função existente
        await CombinedSuitcaseController.returnItemToInventory(itemId, false);
        toast.success("Item devolvido ao estoque com sucesso");
      }
      
      // Atualizar a lista de itens somente se o componente ainda estiver montado
      if (isMounted.current) {
        refetchSuitcaseItems();
      }
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

      // Se o item tem mais de uma unidade, reduzir a quantidade em vez de marcá-lo completamente
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
      
      // Atualizar a lista de itens somente se o componente ainda estiver montado
      if (isMounted.current) {
        refetchSuitcaseItems();
      }
    } catch (error) {
      console.error("[useOpenSuitcase] Erro ao marcar item como danificado:", error);
      toast.error("Erro ao marcar item como danificado");
    }
  }, [suitcaseItems, suitcase, refetchSuitcaseItems]);

  // Função para reset completo do estado
  const resetState = useCallback(() => {
    console.log("[useOpenSuitcase] Iniciando reset completo do estado");
    
    // Resetar aba ativa para a inicial
    setActiveTab('itens');
    
    // Limpar cache de queries e cancelar queries pendentes
    resetQueries();
    
    console.log("[useOpenSuitcase] Reset do estado concluído");
  }, [resetQueries]);

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
