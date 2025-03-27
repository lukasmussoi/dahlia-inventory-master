
/**
 * Hook para Abrir Maleta
 * @file Gerencia o estado e operações da funcionalidade "Abrir Maleta"
 * @relacionamento Utilizado pelo OpenSuitcaseDialog para gerenciar estados e operações
 */
import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { CombinedSuitcaseController } from "@/controllers/suitcase";
import { InventoryController } from "@/controllers/inventoryController";
import { toast } from "sonner";

export function useOpenSuitcase(suitcaseId: string, open: boolean) {
  // Estado da aba ativa
  const [activeTab, setActiveTab] = useState<string>("itens");
  // Estado para controlar quais itens estão sendo processados
  const [processingItems, setProcessingItems] = useState<{[key: string]: boolean}>({});

  // Buscar detalhes da maleta
  const {
    data: suitcase,
    isLoading: isLoadingSuitcase,
  } = useQuery({
    queryKey: ["suitcase", suitcaseId],
    queryFn: () => CombinedSuitcaseController.getSuitcaseById(suitcaseId),
    enabled: open && !!suitcaseId,
  });

  // Buscar promotora da revendedora
  const {
    data: promoterInfo,
    isLoading: loadingPromoterInfo
  } = useQuery({
    queryKey: ["promoter-for-reseller", suitcase?.seller_id],
    queryFn: () => CombinedSuitcaseController.getPromoterForReseller(suitcase?.seller_id || ""),
    enabled: open && !!suitcase?.seller_id,
  });

  // Buscar itens da maleta
  const {
    data: suitcaseItems = [],
    isLoading: isLoadingItems,
    refetch: refetchSuitcaseItems
  } = useQuery({
    queryKey: ["suitcase-items", suitcaseId],
    queryFn: () => CombinedSuitcaseController.getSuitcaseItems(suitcaseId),
    enabled: open && !!suitcaseId,
  });

  // Buscar histórico de acertos
  const {
    data: acertosHistorico = [],
    isLoading: isLoadingAcertos
  } = useQuery({
    queryKey: ["acertos-historico", suitcaseId],
    queryFn: () => CombinedSuitcaseController.getHistoricoAcertos(suitcaseId),
    enabled: open && !!suitcaseId,
  });

  // Determinar estado de carregamento geral
  const isLoading = isLoadingSuitcase || loadingPromoterInfo || isLoadingItems || isLoadingAcertos;

  // Função para devolver item ao estoque
  const handleReturnToInventory = useCallback(async (itemId: string, quantity: number) => {
    try {
      setProcessingItems(prev => ({ ...prev, [itemId]: true }));
      
      // Buscar o item para obter informações completas
      const item = suitcaseItems.find(i => i.id === itemId);
      if (!item) {
        throw new Error("Item não encontrado");
      }
      
      // Validar quantidade
      const itemQuantity = item.quantity || 1;
      if (quantity > itemQuantity) {
        throw new Error(`Quantidade de devolução (${quantity}) excede a disponível na maleta (${itemQuantity})`);
      }
      
      // Validar se o item está "em posse"
      if (item.status !== 'in_possession') {
        throw new Error("Apenas itens em posse podem ser devolvidos ao estoque");
      }
      
      // Buscar o item do estoque para validar
      const inventoryItem = await InventoryController.getItemById(item.inventory_id);
      if (!inventoryItem) {
        throw new Error("Item não encontrado no estoque");
      }
      
      // Se devolver todas as unidades
      if (quantity === itemQuantity) {
        // Retornar ao estoque e atualizar o status
        await CombinedSuitcaseController.returnItemToInventory(itemId, false);
        toast.success("Item devolvido ao estoque com sucesso");
      } else {
        // Devolver apenas parte das unidades (atualizar apenas quantidades)
        // 1. Atualizar a quantidade do item na maleta
        await CombinedSuitcaseController.updateSuitcaseItemQuantity(itemId, itemQuantity - quantity);
        
        // 2. Incrementar o estoque
        const newQuantity = (inventoryItem.quantity || 0) + quantity;
        await InventoryController.updateItem(item.inventory_id, { quantity: newQuantity });
        
        // 3. Registrar movimentação
        await InventoryController.createMovement({
          inventory_id: item.inventory_id,
          quantity: quantity,
          movement_type: "retorno da maleta",
          reason: `Retorno parcial da maleta ${suitcase?.code || 'desconhecida'}`
        });
        
        toast.success(`${quantity} unidade(s) devolvida(s) ao estoque com sucesso`);
      }
      
      // Atualizar a lista de itens
      await refetchSuitcaseItems();
    } catch (error: any) {
      console.error("Erro ao devolver item ao estoque:", error);
      toast.error(`Erro ao devolver item: ${error.message || 'Falha na operação'}`);
    } finally {
      setProcessingItems(prev => ({ ...prev, [itemId]: false }));
    }
  }, [suitcaseItems, suitcaseId, suitcase, refetchSuitcaseItems]);

  // Função para marcar item como danificado
  const handleMarkAsDamaged = useCallback(async (itemId: string) => {
    try {
      setProcessingItems(prev => ({ ...prev, [itemId]: true }));
      
      // Buscar o item para obter informações completas
      const item = suitcaseItems.find(i => i.id === itemId);
      if (!item) {
        throw new Error("Item não encontrado");
      }
      
      // Validar se o item está "em posse"
      if (item.status !== 'in_possession') {
        throw new Error("Apenas itens em posse podem ser marcados como danificados");
      }
      
      // Sempre marca apenas 1 unidade como danificada por vez
      await CombinedSuitcaseController.returnItemToInventory(itemId, true);
      toast.success("Item marcado como danificado com sucesso");
      
      // Atualizar a lista de itens
      await refetchSuitcaseItems();
    } catch (error: any) {
      console.error("Erro ao marcar item como danificado:", error);
      toast.error(`Erro ao marcar item como danificado: ${error.message || 'Falha na operação'}`);
    } finally {
      setProcessingItems(prev => ({ ...prev, [itemId]: false }));
    }
  }, [suitcaseItems, refetchSuitcaseItems]);

  // Função para limpar estados
  const resetState = useCallback(() => {
    setActiveTab("itens");
    setProcessingItems({});
  }, []);

  // Limpar estado ao fechar o modal
  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open, resetState]);

  return {
    activeTab,
    setActiveTab,
    suitcase,
    promoterInfo,
    suitcaseItems,
    acertosHistorico,
    isLoading,
    processingItems,
    handleReturnToInventory,
    handleMarkAsDamaged,
    resetState
  };
}
