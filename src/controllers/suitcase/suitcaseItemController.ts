
/**
 * Controlador de Itens de Maleta
 * @file Este arquivo controla as operações relacionadas aos itens de maletas
 */
import { SuitcaseItemModel } from "@/models/suitcase/item";
import { SuitcaseItemStatus, SuitcaseItem } from "@/types/suitcase";
import { supabase } from "@/integrations/supabase/client";
import { InventoryController } from "@/controllers/inventoryController";

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
      
      // Adicionar o item à maleta
      const result = await SuitcaseItemModel.addItemToSuitcase({
        suitcase_id: suitcaseId,
        inventory_id: inventoryId,
        quantity
      });
      
      // NOVA LÓGICA: Registrar a reserva no controlador de inventário para log
      await InventoryController.reserveItemForSuitcase(inventoryId, quantity, suitcaseId);
      
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
      // Obter informações do item antes de remover
      const item = await this.getSuitcaseItemById(itemId);
      const result = await SuitcaseItemModel.removeSuitcaseItem(itemId);
      
      // NOVA LÓGICA: Registrar a liberação de reserva no controlador de inventário para log
      if (item && item.inventory_id) {
        await InventoryController.releaseReservedItem(
          item.inventory_id, 
          item.quantity || 1, 
          item.suitcase_id
        );
      }
      
      return result;
    } catch (error) {
      console.error("Erro ao remover item da maleta:", error);
      throw error;
    }
  },

  async updateSuitcaseItemQuantity(itemId: string, quantity: number) {
    try {
      // Obter informações do item antes de atualizar
      const item = await this.getSuitcaseItemById(itemId);
      const oldQuantity = item?.quantity || 1;
      
      // Atualizar a quantidade
      const updatedItem = await SuitcaseItemModel.updateSuitcaseItemQuantity(itemId, quantity);
      
      // NOVA LÓGICA: Registrar a atualização de reserva no controlador de inventário para log
      if (item && item.inventory_id) {
        const quantityDiff = quantity - oldQuantity;
        
        if (quantityDiff > 0) {
          // Reservar mais itens
          await InventoryController.reserveItemForSuitcase(
            item.inventory_id, 
            quantityDiff, 
            item.suitcase_id
          );
        } else if (quantityDiff < 0) {
          // Liberar parte da reserva
          await InventoryController.releaseReservedItem(
            item.inventory_id, 
            Math.abs(quantityDiff), 
            item.suitcase_id
          );
        }
      }
      
      return updatedItem;
    } catch (error) {
      console.error("Erro ao atualizar quantidade do item:", error);
      throw error;
    }
  },

  async returnItemToInventory(itemId: string, isDamaged: boolean = false) {
    try {
      // Obter informações do item antes de atualizar
      const item = await this.getSuitcaseItemById(itemId);
      
      // Retornar o item ao inventário
      const result = await SuitcaseItemModel.returnItemToInventory(itemId, isDamaged);
      
      // NOVA LÓGICA: Registrar a ação no controlador de inventário para log
      if (item && item.inventory_id) {
        if (isDamaged) {
          // Para itens danificados, registrar a baixa definitiva
          await InventoryController.finalizeItemSaleFromSuitcase(
            item.inventory_id, 
            item.quantity || 1, 
            item.suitcase_id
          );
        } else {
          // Para devoluções normais, liberar a reserva
          await InventoryController.releaseReservedItem(
            item.inventory_id, 
            item.quantity || 1, 
            item.suitcase_id
          );
        }
      }
      
      return result;
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
