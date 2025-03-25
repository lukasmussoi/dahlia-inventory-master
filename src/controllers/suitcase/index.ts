
/**
 * Controlador Combinado de Maletas
 * @file Este arquivo exporta um controlador combinado para operações de maletas,
 * consolidando todas as operações em uma única interface
 * @depends controllers/suitcase/* - Controladores específicos para cada tipo de operação
 */

import { SuitcaseController } from "./suitcaseController";
import { SuitcaseItemController } from "./suitcaseItemController";
import { SellerController } from "./sellerController";
import { InventorySearchController } from "./inventorySearchController";
import { SettlementController } from "./settlementController";
import { PdfController } from "./pdfController";
import { DeleteSuitcaseController } from "./deleteSuitcaseController";

// Classe combinada que agrega todos os métodos dos controladores específicos
export class CombinedSuitcaseController {
  // Métodos do controlador de maletas
  static getSuitcases = SuitcaseController.getSuitcases;
  static getSuitcaseById = SuitcaseController.getSuitcaseById;
  static getSuitcaseItems = SuitcaseController.getSuitcaseItems;
  static createSuitcase = SuitcaseController.createSuitcase;
  static updateSuitcase = SuitcaseController.updateSuitcase;
  static deleteSuitcase = SuitcaseController.deleteSuitcase;
  static searchSuitcases = SuitcaseController.searchSuitcases;
  static generateSuitcaseCode = SuitcaseController.generateSuitcaseCode;
  static getSuitcaseSummary = SuitcaseController.getSuitcaseSummary;

  // Métodos do controlador de itens de maleta
  static getSuitcaseItemById = SuitcaseItemController.getSuitcaseItemById;
  static addItemToSuitcase = SuitcaseItemController.addItemToSuitcase;
  static updateSuitcaseItemStatus = SuitcaseItemController.updateSuitcaseItemStatus;
  static removeSuitcaseItem = SuitcaseItemController.removeSuitcaseItem;
  static updateSuitcaseItemQuantity = SuitcaseItemController.updateSuitcaseItemQuantity;
  static returnItemToInventory = SuitcaseItemController.returnItemToInventory;
  static updateSaleInfo = SuitcaseItemController.updateSaleInfo;

  // Métodos do controlador de vendedores
  static getAllSellers = SellerController.getAllSellers;
  static getSellerById = SellerController.getSellerById;
  static getPromoterForReseller = SellerController.getPromoterForReseller;

  // Métodos do controlador de busca de inventário
  static searchInventoryItems = InventorySearchController.searchInventoryItems;
  static getItemSuitcaseInfo = InventorySearchController.getItemSuitcaseInfo;

  // Métodos do controlador de acertos
  static getHistoricoAcertos = SettlementController.getHistoricoAcertos;
  static createPendingSettlement = SettlementController.createPendingSettlement;
  static finalizeSettlement = SettlementController.finalizeSettlement;

  // Métodos do controlador de PDF
  static generateSuitcasePDF = PdfController.generateSuitcasePDF;

  // Métodos adicionais de exclusão
  static canDeleteSuitcase = DeleteSuitcaseController.canDeleteSuitcase;
  static performSuitcaseDeletion = DeleteSuitcaseController.performSuitcaseDeletion;
}

// Exportar a classe combinada
export { CombinedSuitcaseController as SuitcaseController };
