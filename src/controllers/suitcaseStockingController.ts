
import { SuitcaseStockingModel } from "@/models/suitcaseStockingModel";
import { toast } from "sonner";
import { formatRelativeDate } from "@/utils/formatUtils";

export const suitcaseStockingController = {
  async getStockingSuggestions(resellerId: string) {
    try {
      if (!resellerId) {
        console.warn("ID da revendedora não fornecido para sugestões de abastecimento");
        return { items: [], categories: [] };
      }
      
      console.log(`Gerando sugestões de abastecimento para revendedora ${resellerId}`);
      const suggestions = await SuitcaseStockingModel.generateStockingSuggestions(resellerId);
      
      console.log("Sugestões geradas:", suggestions);
      return suggestions;
    } catch (error) {
      console.error("Erro ao buscar sugestões de abastecimento:", error);
      toast.error("Erro ao carregar sugestões de abastecimento");
      return { items: [], categories: [] };
    }
  },

  async checkItemPreviousSales(inventoryId: string, resellerId: string) {
    try {
      if (!inventoryId || !resellerId) return null;
      
      const history = await SuitcaseStockingModel.checkItemSalesHistory(inventoryId, resellerId);
      
      if (history.sold) {
        let message = "";
        if (history.count > 5) {
          message = `Item muito popular! Vendido ${history.count} vezes nos últimos 90 dias.`;
          toast.success(message, { duration: 5000 });
        } else if (history.count > 1) {
          message = `Este item foi vendido ${history.count} vezes nos últimos 90 dias.`;
          toast.info(message, { duration: 4000 });
        } else {
          message = `Este item foi vendido ${history.count} vez ${history.lastSoldDate ? formatRelativeDate(history.lastSoldDate) : "nos últimos 90 dias"}.`;
          toast(message, { duration: 3000 });
        }
        
        return {
          sold: true,
          count: history.count,
          message,
          lastSoldDate: history.lastSoldDate
        };
      }
      
      return { sold: false, count: 0 };
    } catch (error) {
      console.error("Erro ao verificar vendas anteriores:", error);
      return null;
    }
  },
  
  formatSuggestionCategory(count: number): "alta" | "média" | "baixa" {
    if (count > 5) return "alta";
    if (count > 2) return "média";
    return "baixa";
  }
};

export const SuitcaseStockingController = suitcaseStockingController;
