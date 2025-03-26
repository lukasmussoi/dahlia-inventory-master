
import { useState, useCallback } from "react";
import { CombinedSuitcaseController } from "@/controllers/suitcase";
import { toast } from "sonner";

export function useSuitcaseItems() {
  const [processingItems, setProcessingItems] = useState<{ [key: string]: boolean }>({});

  const handleToggleSold = async (item: any, sold: boolean) => {
    setProcessingItems(prev => ({ ...prev, [item.id]: true }));
    try {
      const newStatus = sold ? 'sold' : 'in_possession';
      await CombinedSuitcaseController.updateSuitcaseItemStatus(item.id, newStatus);
      toast.success(sold ? "Item marcado como vendido" : "Item marcado como disponível");
      return true;
    } catch (error) {
      console.error("Erro ao atualizar status do item:", error);
      toast.error("Erro ao atualizar status do item");
      return false;
    } finally {
      setProcessingItems(prev => ({ ...prev, [item.id]: false }));
    }
  };

  const handleUpdateSaleInfo = async (itemId: string, field: string, value: string) => {
    setProcessingItems(prev => ({ ...prev, [itemId]: true }));
    try {
      await CombinedSuitcaseController.updateSaleInfo(itemId, field, value);
      return true;
    } catch (error) {
      console.error("Erro ao atualizar informação de venda:", error);
      toast.error("Erro ao atualizar informação de venda");
      return false;
    } finally {
      setProcessingItems(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleReturnToInventory = async (itemIds: string[], quantity: number = 1, isDamaged: boolean = false) => {
    const processingKey = itemIds.join('-');
    setProcessingItems(prev => ({ ...prev, [processingKey]: true }));
    try {
      // O erro está aqui - estamos passando 3 argumentos, mas a função só aceita 1 ou 2
      // Verificando a definição da função no controlador
      await CombinedSuitcaseController.returnItemsToInventory(itemIds, isDamaged);
      toast.success("Item(ns) devolvido(s) ao estoque");
      return true;
    } catch (error) {
      console.error("Erro ao devolver item ao estoque:", error);
      toast.error("Erro ao devolver item ao estoque");
      return false;
    } finally {
      setProcessingItems(prev => ({ ...prev, [processingKey]: false }));
    }
  };

  const calculateTotalValue = (items: any[] = []) => {
    return items.reduce((total, item) => {
      const price = item.product?.price || 0;
      const quantity = item.quantity || 1;
      return total + (price * quantity);
    }, 0);
  };

  // Função para resetar os estados
  const resetItemsState = useCallback(() => {
    setProcessingItems({});
  }, []);

  return {
    processingItems,
    handleToggleSold,
    handleUpdateSaleInfo,
    handleReturnToInventory,
    calculateTotalValue,
    resetItemsState
  };
}
