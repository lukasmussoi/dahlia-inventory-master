/**
 * Controlador de Itens de Maleta
 * @file Este arquivo controla as operações relacionadas aos itens de maletas
 */
import { SuitcaseItemModel } from "@/models/suitcase/item";
import { SuitcaseItemStatus } from "@/types/suitcase";
import { supabase } from "@/integrations/supabase/client";

export const SuitcaseItemController = {
  async getSuitcaseItemById(itemId: string) {
    try {
      return await SuitcaseItemModel.getSuitcaseItemById(itemId);
    } catch (error) {
      console.error("Erro ao buscar item da maleta:", error);
      throw error;
    }
  },

  async getSuitcaseItems(suitcaseId: string) {
    try {
      return await SuitcaseItemModel.getSuitcaseItems(suitcaseId);
    } catch (error) {
      console.error("Erro ao buscar itens da maleta:", error);
      throw error;
    }
  },

  async addItemToSuitcase(suitcaseId: string, inventoryId: string, quantity: number = 1) {
    try {
      // Verificar se o item já está em outra maleta
      const itemInfo = await SuitcaseItemModel.getItemSuitcaseInfo(inventoryId);
      if (itemInfo && itemInfo.suitcase_id && itemInfo.suitcase_id !== suitcaseId) {
        throw new Error(`Este item já está na maleta ${itemInfo.suitcase_code}`);
      }
      
      const result = await SuitcaseItemModel.addItemToSuitcase({
        suitcase_id: suitcaseId,
        inventory_id: inventoryId,
        quantity
      });
      return result;
    } catch (error) {
      console.error("Erro ao adicionar item à maleta:", error);
      throw error;
    }
  },

  async updateSuitcaseItemStatus(itemId: string, status: SuitcaseItemStatus) {
    try {
      return await SuitcaseItemModel.updateSuitcaseItemStatus(itemId, status);
    } catch (error) {
      console.error("Erro ao atualizar status do item:", error);
      throw error;
    }
  },

  async removeSuitcaseItem(itemId: string) {
    try {
      return await SuitcaseItemModel.removeSuitcaseItem(itemId);
    } catch (error) {
      console.error("Erro ao remover item da maleta:", error);
      throw error;
    }
  },

  async updateSuitcaseItemQuantity(itemId: string, quantity: number) {
    try {
      return await SuitcaseItemModel.updateSuitcaseItemQuantity(itemId, quantity);
    } catch (error) {
      console.error("Erro ao atualizar quantidade do item:", error);
      throw error;
    }
  },

  async returnItemToInventory(itemId: string, isDamaged: boolean = false) {
    try {
      return await SuitcaseItemModel.returnItemToInventory(itemId, isDamaged);
    } catch (error) {
      console.error("Erro ao retornar item ao estoque:", error);
      throw error;
    }
  },
  
  async returnItemsToInventory(itemIds: string[], isDamaged: boolean = false) {
    try {
      const results = [];
      for (const itemId of itemIds) {
        await this.returnItemToInventory(itemId, isDamaged);
        results.push(itemId);
      }
      return results;
    } catch (error) {
      console.error("Erro ao retornar itens ao estoque:", error);
      throw error;
    }
  },
  
  async updateSaleInfo(itemId: string, field: string, value: string) {
    try {
      return await SuitcaseItemModel.updateSaleInfo(itemId, field, value);
    } catch (error) {
      console.error("Erro ao atualizar informações de venda:", error);
      throw error;
    }
  }
};
