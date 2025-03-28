
/**
 * Exportação Combinada dos Modelos de Itens de Maleta
 * @file Arquivo de exportação central com todos os modelos de itens
 */
import { BaseItemModel } from './baseItemModel';
import { ItemQueryModel } from './itemQueryModel';
import { ItemOperationsModel } from './itemOperationsModel';
import { ItemSalesModel } from './itemSalesModel';

// Exportar todas as classes individualmente
export { BaseItemModel, ItemQueryModel, ItemOperationsModel, ItemSalesModel };

// Criar e exportar classe combinada para manter compatibilidade com o código existente
export class SuitcaseItemModel {
  // BaseItemModel
  static processItemData = BaseItemModel.processItemData;
  
  // ItemQueryModel
  static getSuitcaseItemById = ItemQueryModel.getSuitcaseItemById;
  static getSuitcaseItems = ItemQueryModel.getSuitcaseItems;
  static getSuitcaseItemSales = ItemQueryModel.getSuitcaseItemSales;
  static getItemSuitcaseInfo = ItemQueryModel.getItemSuitcaseInfo;
  
  // ItemOperationsModel
  static checkItemAvailability = ItemOperationsModel.checkItemAvailability;
  static checkItemInSuitcase = ItemOperationsModel.checkItemInSuitcase;
  static addItemToSuitcase = ItemOperationsModel.addItemToSuitcase;
  static updateSuitcaseItemStatus = ItemOperationsModel.updateSuitcaseItemStatus;
  static removeSuitcaseItem = ItemOperationsModel.removeSuitcaseItem;
  static updateSuitcaseItemQuantity = ItemOperationsModel.updateSuitcaseItemQuantity;
  static returnItemToInventory = ItemOperationsModel.returnItemToInventory;
  static reserveItemToSuitcase = ItemOperationsModel.reserveItemToSuitcase;
  
  // ItemSalesModel
  static updateSaleInfo = ItemSalesModel.updateSaleInfo;
  static registerSaleInfo = ItemSalesModel.registerSaleInfo;
}

// Exportar por padrão para manter compatibilidade
export default SuitcaseItemModel;
