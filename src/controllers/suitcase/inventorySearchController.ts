
/**
 * Controlador de Busca de Inventário
 * @file Este arquivo controla as operações de busca de inventário para maletas
 */
import { InventorySearchModel } from "@/models/suitcase/inventorySearchModel";
import { InventoryItemSuitcaseInfo } from "@/types/suitcase";

export const InventorySearchController = {
  /**
   * Busca itens de inventário para adicionar à maleta
   * @param query Termo de busca
   * @returns Lista de itens de inventário
   */
  async searchInventoryItems(query: string): Promise<any[]> {
    try {
      return await InventorySearchModel.searchInventoryItems(query);
    } catch (error) {
      console.error("Erro ao buscar itens de inventário:", error);
      throw error;
    }
  },

  /**
   * Busca informações de em qual maleta o item está
   * @param inventoryId ID do item no inventário
   * @returns Informações da maleta onde o item está
   */
  async getItemSuitcaseInfo(inventoryId: string): Promise<InventoryItemSuitcaseInfo | null> {
    try {
      // Usar o modelo SuitcaseItemModel que já possui este método
      const { SuitcaseItemModel } = require("@/models/suitcase/index");
      return await SuitcaseItemModel.getItemSuitcaseInfo(inventoryId);
    } catch (error) {
      console.error("Erro ao buscar informações da maleta para o item:", error);
      throw error;
    }
  }
};
