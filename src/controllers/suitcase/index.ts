
/**
 * Exportação centralizada dos controladores de maleta
 * @file Este arquivo exporta todos os controladores relacionados a maletas
 */
import { SuitcaseController } from "./suitcaseController";
import { SuitcaseItemController } from "./suitcaseItemController";
import { SellerController } from "./sellerController";
import { InventorySearchController } from "./inventorySearchController";
import { SettlementController } from "./settlementController";
import { SuitcasePdfController } from "./pdfController";
import { DeleteSuitcaseController } from "./deleteSuitcaseController";

// Reexportando as classes para manter a compatibilidade com o código existente
export {
  SuitcaseController,
  SuitcaseItemController,
  SellerController,
  InventorySearchController,
  SettlementController,
  SuitcasePdfController,
  DeleteSuitcaseController
};

// Criando uma classe combinada para manter a compatibilidade com o código existente
export class CombinedSuitcaseController {
  // Operações principais da maleta
  static getSuitcases = SuitcaseController.getSuitcases;
  static getSuitcaseById = SuitcaseController.getSuitcaseById;
  static getSuitcaseItems = SuitcaseController.getSuitcaseItems;
  static createSuitcase = SuitcaseController.createSuitcase;
  static updateSuitcase = SuitcaseController.updateSuitcase;
  static deleteSuitcase = SuitcaseController.deleteSuitcase;
  static searchSuitcases = SuitcaseController.searchSuitcases;
  static generateSuitcaseCode = SuitcaseController.generateSuitcaseCode;
  static getSuitcaseSummary = SuitcaseController.getSuitcaseSummary;
  static deleteSuitcaseWithCascade = DeleteSuitcaseController.deleteSuitcaseWithCascade;

  // Operações de itens da maleta
  static addItemToSuitcase = SuitcaseItemController.addItemToSuitcase;
  static updateSuitcaseItemStatus = SuitcaseItemController.updateSuitcaseItemStatus;
  static getSuitcaseItemSales = SuitcaseItemController.getSuitcaseItemSales;
  static removeSuitcaseItem = SuitcaseItemController.removeSuitcaseItem;
  static updateSuitcaseItemQuantity = SuitcaseItemController.updateSuitcaseItemQuantity;
  static returnItemToInventory = SuitcaseItemController.returnItemToInventory;
  static updateSaleInfo = SuitcaseItemController.updateSaleInfo;

  // Operações de vendedores e promotoras
  static getAllSellers = SellerController.getAllSellers;
  static getSellerById = SellerController.getSellerById;
  static getPromoterForReseller = SellerController.getPromoterForReseller;

  // Operações de busca no inventário
  static searchInventoryItems = InventorySearchController.searchInventoryItems;
  static getItemSuitcaseInfo = InventorySearchController.getItemSuitcaseInfo;

  // Operações de acertos
  static createPendingSettlement = SettlementController.createPendingSettlement;

  // Operações de PDF
  static generateSuitcasePDF = SuitcasePdfController.generateSuitcasePDF;
}
