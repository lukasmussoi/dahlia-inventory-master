
/**
 * Hook para Gerenciamento de Itens de Maleta
 * @file Agrupa funções para operações relacionadas a itens de maletas
 * @relacionamento Utilizado pelo hook useSuitcaseDetails
 */
import { useState } from "react";
import { SuitcaseItem, SuitcaseItemStatus } from "@/types/suitcase";
import { CombinedSuitcaseController } from "@/controllers/suitcase";
import { toast } from "sonner";

export function useSuitcaseItems() {
  const [processingItems, setProcessingItems] = useState<Record<string, boolean>>({});

  // Marcar item como vendido ou não vendido
  const handleToggleSold = async (item: SuitcaseItem, sold: boolean): Promise<boolean> => {
    if (!item || !item.id) return false;

    setProcessingItems(prev => ({ ...prev, [item.id]: true }));
    try {
      const newStatus: SuitcaseItemStatus = sold ? 'sold' : 'in_possession';
      await CombinedSuitcaseController.updateSuitcaseItemStatus(item.id, newStatus);
      toast.success(sold ? "Item marcado como vendido" : "Item marcado como disponível");
      return true;
    } catch (error: any) {
      console.error("Erro ao alterar status do item:", error);
      toast.error(error.message || "Erro ao atualizar item");
      return false;
    } finally {
      setProcessingItems(prev => ({ ...prev, [item.id]: false }));
    }
  };

  // Atualizar informações de venda (cliente, método de pagamento)
  const handleUpdateSaleInfo = async (itemId: string, field: string, value: string): Promise<boolean> => {
    if (!itemId) return false;

    setProcessingItems(prev => ({ ...prev, [itemId]: true }));
    try {
      await CombinedSuitcaseController.updateSaleInfo(itemId, field, value);
      toast.success("Informação atualizada com sucesso");
      return true;
    } catch (error: any) {
      console.error("Erro ao atualizar informação de venda:", error);
      toast.error(error.message || "Não foi possível atualizar a informação");
      return false;
    } finally {
      setProcessingItems(prev => ({ ...prev, [itemId]: false }));
    }
  };

  // Devolver itens ao estoque (normal ou danificado)
  const handleReturnToInventory = async (itemIds: string[], quantity: number, isDamaged: boolean): Promise<boolean> => {
    if (!itemIds.length) return false;

    // Marcar todos os itens como em processamento
    const processingMap: Record<string, boolean> = {};
    itemIds.forEach(id => processingMap[id] = true);
    setProcessingItems(prev => ({ ...prev, ...processingMap }));

    try {
      // Processar os itens em lote
      await CombinedSuitcaseController.returnItemsToInventory(itemIds, isDamaged);
      
      // Exibir mensagem de sucesso adaptada ao contexto
      if (isDamaged) {
        toast.success(`${quantity} item(s) marcado(s) como danificado(s)`);
      } else {
        toast.success(`${quantity} item(s) devolvido(s) ao estoque`);
      }
      
      return true;
    } catch (error: any) {
      console.error("Erro ao devolver itens ao estoque:", error);
      toast.error(error.message || "Erro ao processar devolução ao estoque");
      return false;
    } finally {
      // Desmarcar todos os itens como em processamento
      const completedMap: Record<string, boolean> = {};
      itemIds.forEach(id => completedMap[id] = false);
      setProcessingItems(prev => ({ ...prev, ...completedMap }));
    }
  };

  // Calcular valor total dos itens
  const calculateTotalValue = (items: SuitcaseItem[]): number => {
    // Verificar se há itens e filtrar apenas itens que estão em posse (não vendidos, devolvidos, etc.)
    const activeItems = items.filter(item => item.status === 'in_possession');
    
    if (activeItems.length === 0) {
      return 0; // Se não houver itens ativos, o valor total é zero
    }
    
    return activeItems.reduce((total, item) => {
      if (item.product && item.product.price) {
        return total + item.product.price * (item.quantity || 1);
      }
      return total;
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
