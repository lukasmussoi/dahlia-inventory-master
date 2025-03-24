
/**
 * Controlador de Itens de Maleta
 * @file Este arquivo controla as operações relacionadas aos itens da maleta
 */
import { SuitcaseModel } from "@/models/suitcaseModel";
import { SuitcaseItemStatus, SuitcaseItem } from "@/types/suitcase";

export class SuitcaseItemController {
  static async addItemToSuitcase(suitcaseId: string, inventoryId: string, quantity: number = 1) {
    try {
      return await SuitcaseModel.addItemToSuitcase({
        suitcase_id: suitcaseId,
        inventory_id: inventoryId,
        quantity: quantity
      });
    } catch (error) {
      console.error("Erro ao adicionar item à maleta:", error);
      throw error;
    }
  }

  static async updateSuitcaseItemStatus(
    itemId: string, 
    status: SuitcaseItemStatus,
    saleInfo?: any
  ) {
    try {
      return await SuitcaseModel.updateSuitcaseItemStatus(itemId, status, saleInfo);
    } catch (error) {
      console.error("Erro ao atualizar status do item da maleta:", error);
      throw error;
    }
  }

  static async getSuitcaseItemSales(itemId: string) {
    try {
      return await SuitcaseModel.getSuitcaseItemSales(itemId);
    } catch (error) {
      console.error("Erro ao buscar vendas do item da maleta:", error);
      throw error;
    }
  }

  static async removeSuitcaseItem(itemId: string) {
    try {
      await SuitcaseModel.removeSuitcaseItem(itemId);
    } catch (error) {
      console.error("Erro ao remover item da maleta:", error);
      throw error;
    }
  }

  static async updateSuitcaseItemQuantity(itemId: string, quantity: number) {
    try {
      return await SuitcaseModel.updateSuitcaseItemQuantity(itemId, quantity);
    } catch (error) {
      console.error("Erro ao atualizar quantidade do item da maleta:", error);
      throw error;
    }
  }

  static async returnItemToInventory(itemId: string) {
    try {
      await SuitcaseModel.returnItemToInventory(itemId);
    } catch (error) {
      console.error("Erro ao retornar item ao inventário:", error);
      throw error;
    }
  }

  static async updateSaleInfo(itemId: string, field: string, value: string) {
    try {
      const sales = await SuitcaseModel.getSuitcaseItemSales(itemId);

      if (!sales || sales.length === 0) {
        const newSale = {
          customer_name: "",
          payment_method: "",
        };

        newSale[field] = value;

        await SuitcaseModel.updateSuitcaseItemStatus(itemId, "sold", newSale);
      } else {
        const saleId = sales[0].id;

        const update = {};
        update[field] = value;

        console.warn(
          "Função de atualizar venda existente não implementada. Apenas a primeira venda está sendo atualizada."
        );
      }
    } catch (error) {
      console.error("Erro ao atualizar informações de venda:", error);
      throw error;
    }
  }
}
