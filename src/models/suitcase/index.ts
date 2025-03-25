
/**
 * Exportação centralizada dos modelos de maleta
 * @file Este arquivo exporta todos os modelos relacionados às maletas
 */
import { SuitcaseModel } from "./suitcaseModel";
import { SuitcaseItemModel } from "./suitcaseItemModel";
import { SellerModel } from "./sellerModel";
import { InventorySearchModel } from "./inventorySearchModel";
import { BaseSuitcaseModel } from "./baseModel";

// Exportações diretas para acessibilidade de cada modelo individual
export { SuitcaseModel, SuitcaseItemModel, SellerModel, InventorySearchModel, BaseSuitcaseModel };

// Criando uma classe combinada para manter a compatibilidade com o código existente
export class CombinedSuitcaseModel {
  // Métodos base
  static processSellerAddress = BaseSuitcaseModel.processSellerAddress;
  static generateSuitcaseCode = BaseSuitcaseModel.generateSuitcaseCode;

  // Métodos de maleta
  static getActiveSuitcases = SuitcaseModel.getActiveSuitcases;
  static getAllSuitcases = SuitcaseModel.getAllSuitcases;
  static getSuitcaseSummary = SuitcaseModel.getSuitcaseSummary;
  static getSuitcaseById = SuitcaseModel.getSuitcaseById;
  static createSuitcase = SuitcaseModel.createSuitcase;
  static updateSuitcase = SuitcaseModel.updateSuitcase;
  static deleteSuitcase = SuitcaseModel.deleteSuitcase;
  static searchSuitcases = SuitcaseModel.searchSuitcases;

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

// Reexportando a classe combinada como SuitcaseModel para manter compatibilidade
export { CombinedSuitcaseModel as SuitcaseModel };
