
/**
 * Índice de Modelos de Item de Maleta
 * @file Este arquivo exporta todos os modelos relacionados a itens de maleta
 */
import { BaseItemModel } from "./baseItemModel";
import { ItemOperationsModel } from "./itemOperationsModel";
import { ItemQueryModel } from "./itemQueryModel";
import { ItemSalesModel } from "./itemSalesModel";

// Criando uma classe combinada para manter compatibilidade com o código existente
export class SuitcaseItemModel {
  // Métodos base
  static getSuitcaseItemById = BaseItemModel.getSuitcaseItemById;
  static getSuitcaseItems = BaseItemModel.getSuitcaseItems;
  static getItemSuitcaseInfo = BaseItemModel.getItemSuitcaseInfo;

  // Métodos de operações
  static addItemToSuitcase = ItemOperationsModel.addItemToSuitcase;
  static updateSuitcaseItemStatus = ItemOperationsModel.updateSuitcaseItemStatus;
  static updateSuitcaseItemQuantity = ItemOperationsModel.updateSuitcaseItemQuantity;
  static removeSuitcaseItem = ItemOperationsModel.removeSuitcaseItem;
  static returnItemToInventory = ItemOperationsModel.returnItemToInventory;
  static returnItemsToInventory = (itemIds: string[], isDamaged: boolean = false) => {
    return Promise.all(itemIds.map(id => ItemOperationsModel.returnItemToInventory(id, isDamaged)));
  };

  // Métodos de consulta
  static checkItemAvailability = ItemQueryModel.checkItemAvailability;

  // Métodos de vendas
  static getSuitcaseItemSales = ItemSalesModel.getSuitcaseItemSales;
  static updateSaleInfo = ItemSalesModel.updateSaleInfo;

  // Métodos auxiliares para a integração com o sistema de estoque
  static reserveForSuitcase = async (inventoryId: string, quantity: number = 1) => {
    const { data, error } = await BaseItemModel.supabase.rpc('reserve_inventory_for_suitcase', {
      inventory_id: inventoryId,
      reserve_quantity: quantity
    });
    if (error) throw error;
    return data;
  };

  static releaseFromSuitcase = async (inventoryId: string, quantity: number = 1) => {
    const { data, error } = await BaseItemModel.supabase.rpc('release_reserved_inventory', {
      inventory_id: inventoryId,
      release_quantity: quantity
    });
    if (error) throw error;
    return data;
  };
}

// Também exportamos os modelos individuais para acesso direto
export { BaseItemModel, ItemOperationsModel, ItemQueryModel, ItemSalesModel };

// Exportação padrão
export default SuitcaseItemModel;
