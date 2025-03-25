
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
import { SuitcaseSupplyController } from "./supplyController";

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
  updateSaleInfo: SuitcaseItemController.updateSaleInfo,
  
  // SettlementController
  getPromoterForReseller: SettlementController.getPromoterForReseller,
  getHistoricoAcertos: SettlementController.getHistoricoAcertos,
  
  // DeleteSuitcaseController
  checkCanDeleteSuitcase: DeleteSuitcaseController.checkCanDeleteSuitcase,
  
  // SellerController
  getSellerById: SellerController.getSellerById,
  getAllSellers: SellerController.getAllSellers,
  
  // InventorySearchController
  searchInventoryForSuitcase: InventorySearchController.searchInventoryForSuitcase,
  
  // PdfController
  generateSuitcasePDF: PdfController.generateSuitcasePDF,

  // SuitcaseSupplyController
  searchInventoryItems: SuitcaseSupplyController.searchInventoryItems,
  supplySuitcase: SuitcaseSupplyController.supplySuitcase,
  generateSupplyPDF: SuitcaseSupplyController.generateSupplyPDF,
  countSuitcaseItems: SuitcaseSupplyController.countSuitcaseItems,
  getSuitcasesItemCounts: SuitcaseSupplyController.getSuitcasesItemCounts
};

export default CombinedSuitcaseController;
