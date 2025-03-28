
/**
 * Controlador Combinado de Maletas
 * @file Este arquivo exporta funções de outros controladores relacionados a maletas
 */
import { SuitcaseController } from "./suitcaseController";
import { SuitcaseItemController } from "./suitcaseItemController";
import { SettlementController } from "./settlementController";
import { DeleteSuitcaseController } from "./deleteSuitcaseController";
import { SellerController } from "./sellerController";
import { InventorySearchController } from "./inventorySearchController";
import { PdfController } from "./pdfController";
import { SuitcaseSupplyController } from "./supply/suitcaseSupplyController";

// Criar e exportar o controlador combinado
export const CombinedSuitcaseController = {
  // SuitcaseController
  getSuitcases: SuitcaseController.getSuitcases,
  getSuitcaseById: SuitcaseController.getSuitcaseById,
  createSuitcase: SuitcaseController.createSuitcase,
  updateSuitcase: SuitcaseController.updateSuitcase,
  deleteSuitcase: SuitcaseController.deleteSuitcase,
  searchSuitcases: SuitcaseController.searchSuitcases,
  generateSuitcaseCode: SuitcaseController.generateSuitcaseCode,
  getSuitcaseSummary: SuitcaseController.getSuitcaseSummary,
  
  // SuitcaseItemController
  getSuitcaseItemById: SuitcaseItemController.getSuitcaseItemById,
  getSuitcaseItems: SuitcaseItemController.getSuitcaseItems,
  addItemToSuitcase: SuitcaseItemController.addItemToSuitcase,
  updateSuitcaseItemStatus: SuitcaseItemController.updateSuitcaseItemStatus,
  removeSuitcaseItem: SuitcaseItemController.removeSuitcaseItem,
  updateSuitcaseItemQuantity: SuitcaseItemController.updateSuitcaseItemQuantity,
  returnItemToInventory: SuitcaseItemController.returnItemToInventory,
  returnItemsToInventory: SuitcaseItemController.returnItemsToInventory,
  updateSaleInfo: SuitcaseItemController.updateSaleInfo,
  
  // SettlementController
  getHistoricoAcertos: SettlementController.getHistoricoAcertos,
  createPendingSettlement: SettlementController.createPendingSettlement,
  finalizeSettlement: SettlementController.finalizeSettlement,
  
  // DeleteSuitcaseController
  canDeleteSuitcase: DeleteSuitcaseController.canDeleteSuitcase,
  deleteSuitcaseWithCascade: DeleteSuitcaseController.deleteSuitcaseWithCascade,
  
  // SellerController
  getSellerById: SellerController.getSellerById,
  getAllSellers: SellerController.getAllSellers,
  getPromoterForReseller: SellerController.getPromoterForReseller,
  
  // InventorySearchController
  searchInventoryItems: InventorySearchController.searchInventoryItems,
  getItemSuitcaseInfo: InventorySearchController.getItemSuitcaseInfo,
  
  // PdfController
  generateSuitcasePDF: PdfController.generateSuitcasePDF,

  // SuitcaseSupplyController
  searchInventoryForSuitcase: SuitcaseSupplyController.searchInventoryItems,
  
  // Métodos ausentes - Usando funções existentes para manter a compatibilidade
  supplySuitcase: SuitcaseItemController.addItemToSuitcase,
  generateSupplyPDF: PdfController.generateSuitcasePDF,
  countSuitcaseItems: SuitcaseItemController.countSuitcaseItems,
  getSuitcasesItemCounts: SuitcaseItemController.getSuitcasesItemCounts
};

export default CombinedSuitcaseController;
