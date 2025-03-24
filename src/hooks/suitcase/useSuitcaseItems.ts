
import { SuitcaseItem } from "@/types/suitcase";
import { SuitcaseController } from "@/controllers/suitcaseController";
import { toast } from "sonner";

export function useSuitcaseItems() {
  // Função para alternar status de vendido
  const handleToggleSold = async (item: SuitcaseItem, sold: boolean) => {
    try {
      const newStatus = sold ? "sold" : "in_possession";
      await SuitcaseController.updateSuitcaseItemStatus(item.id, newStatus);
      return true;
    } catch (error) {
      console.error("Erro ao atualizar status do item:", error);
      toast.error("Erro ao atualizar status do item");
      return false;
    }
  };

  // Função para atualizar informações de venda
  const handleUpdateSaleInfo = async (itemId: string, field: string, value: string) => {
    try {
      await SuitcaseController.updateSaleInfo(itemId, field, value);
      return true;
    } catch (error) {
      console.error("Erro ao atualizar informações de venda:", error);
      toast.error("Erro ao atualizar informações de venda");
      return false;
    }
  };

  // Calcular valor total da maleta
  const calculateTotalValue = (suitcaseItems: SuitcaseItem[]) => {
    return suitcaseItems.reduce((total, item) => {
      return total + (item.product?.price || 0);
    }, 0);
  };

  return {
    handleToggleSold,
    handleUpdateSaleInfo,
    calculateTotalValue
  };
}
