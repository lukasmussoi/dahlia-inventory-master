
/**
 * Exportação centralizada dos modelos de maleta
 * @file Este arquivo exporta todos os modelos relacionados às maletas
 */
import { SuitcaseModel as OriginalSuitcaseModel } from "./suitcaseModel";
import { SuitcaseItemModel } from "./suitcaseItemModel";
import { SellerModel } from "./sellerModel";
import { InventorySearchModel } from "./inventorySearchModel";
import { BaseSuitcaseModel } from "./baseModel";

// Exportações diretas para acessibilidade de cada modelo individual
export { OriginalSuitcaseModel, SuitcaseItemModel, SellerModel, InventorySearchModel, BaseSuitcaseModel };

// Criando uma classe combinada para manter a compatibilidade com o código existente
export class CombinedSuitcaseModel {
  // Métodos base
  static processSellerAddress = BaseSuitcaseModel.processSellerAddress;
  static generateSuitcaseCode = BaseSuitcaseModel.generateSuitcaseCode;

  // Métodos de maleta
  static getActiveSuitcases = OriginalSuitcaseModel.getActiveSuitcases;
  static getAllSuitcases = OriginalSuitcaseModel.getAllSuitcases;
  static getSuitcaseSummary = OriginalSuitcaseModel.getSuitcaseSummary;
  static getSuitcaseById = OriginalSuitcaseModel.getSuitcaseById;
  static createSuitcase = OriginalSuitcaseModel.createSuitcase;
  static updateSuitcase = OriginalSuitcaseModel.updateSuitcase;
  static deleteSuitcase = OriginalSuitcaseModel.deleteSuitcase;
  static searchSuitcases = OriginalSuitcaseModel.searchSuitcases;

  // Métodos de itens de maleta
  static getSuitcaseItemById = SuitcaseItemModel.getSuitcaseItemById;
  static getSuitcaseItems = SuitcaseItemModel.getSuitcaseItems;
  static checkItemAvailability = SuitcaseItemModel.checkItemAvailability;
  static addItemToSuitcase = SuitcaseItemModel.addItemToSuitcase;
  static updateSuitcaseItemStatus = SuitcaseItemModel.updateSuitcaseItemStatus;
  static getSuitcaseItemSales = SuitcaseItemModel.getSuitcaseItemSales;
  static removeSuitcaseItem = SuitcaseItemModel.removeSuitcaseItem;
  static updateSuitcaseItemQuantity = SuitcaseItemModel.updateSuitcaseItemQuantity;
  static returnItemToInventory = SuitcaseItemModel.returnItemToInventory;
  static getItemSuitcaseInfo = SuitcaseItemModel.getItemSuitcaseInfo;

  // Métodos de revendedor
  static getAllSellers = SellerModel.getAllSellers;
  static getSellerById = SellerModel.getSellerById;

  // Métodos de busca de inventário
  static searchInventoryItems = InventorySearchModel.searchInventoryItems;
}

// Exportando a classe combinada como SuitcaseModel para manter compatibilidade
export { CombinedSuitcaseModel as SuitcaseModel };
