
/**
 * Controlador de Busca de Inventário
 * @file Este arquivo controla as operações de busca no inventário para maletas
 */
import { SuitcaseModel } from "@/models/suitcaseModel";

export const InventorySearchController = {
  async searchInventoryItems(query: string) {
    try {
      return await SuitcaseModel.searchInventoryItems(query);
    } catch (error) {
      console.error("Erro ao buscar itens do inventário:", error);
      throw error;
    }
  },

  async getItemSuitcaseInfo(inventoryId: string) {
    try {
      return await SuitcaseModel.getItemSuitcaseInfo(inventoryId);
    } catch (error) {
      console.error(
        "Erro ao obter informações de qual maleta o item está:",
        error
      );
      throw error;
    }
  }
};
