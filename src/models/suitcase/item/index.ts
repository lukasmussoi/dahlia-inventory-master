
/**
 * Exportação de modelos relacionados a itens de maleta
 * @file Este arquivo agrupa todos os modelos de itens de maleta
 */
import { BaseItemModel } from "./baseItemModel";
import { ItemQueryModel } from "./itemQueryModel";
import { ItemSalesModel } from "./itemSalesModel";
import { SuitcaseItemOperationsModel } from "./itemOperationsModel";

// Exportar o modelo combinado
export class SuitcaseItemModel {
  // BaseItemModel
  static getSuitcaseItemById = BaseItemModel.getSuitcaseItemById;
  static getSuitcaseItems = BaseItemModel.getSuitcaseItems;
  static addItemToSuitcase = BaseItemModel.addItemToSuitcase;
  static updateSuitcaseItemStatus = BaseItemModel.updateSuitcaseItemStatus;
  static removeSuitcaseItem = BaseItemModel.removeSuitcaseItem;
  
  // ItemQueryModel
  static checkItemAvailability = ItemQueryModel.checkItemAvailability;
  static getItemSuitcaseInfo = ItemQueryModel.getItemSuitcaseInfo;
  
  // ItemSalesModel
  static getSuitcaseItemSales = ItemSalesModel.getSuitcaseItemSales;
  
  // ItemOperationsModel (Novo)
  static updateSuitcaseItemQuantity = SuitcaseItemOperationsModel.updateItemQuantity;
  static returnItemToInventory = SuitcaseItemOperationsModel.returnItemToInventory;
}
