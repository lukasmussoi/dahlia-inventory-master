
/**
 * Controlador Combinado de Maletas
 * @file Este arquivo exporta todas as funcionalidades relacionadas às maletas
 * para manter uma interface consistente para os componentes que utilizam o controlador
 */

// Importar todos os controladores de maletas
import { SuitcaseController } from "./suitcaseController";
import { SuitcaseItemController } from "./suitcaseItemController";
import { DeleteSuitcaseController } from "./deleteSuitcaseController";
import { SettlementController } from "./settlementController";
import { InventorySearchController } from "./inventorySearchController";
import { SellerController } from "./sellerController";
import { PdfController } from "./pdfController";

// Exportar um controlador combinado com todas as funcionalidades
export const CombinedSuitcaseController = {
  // SuitcaseController
  getSuitcases: SuitcaseController.getSuitcases,
  getSuitcaseById: SuitcaseController.getSuitcaseById,
  getSuitcaseItems: SuitcaseController.getSuitcaseItems,
  createSuitcase: SuitcaseController.createSuitcase,
  updateSuitcase: SuitcaseController.updateSuitcase,
  deleteSuitcase: SuitcaseController.deleteSuitcase,
  searchSuitcases: SuitcaseController.searchSuitcases,
  generateSuitcaseCode: SuitcaseController.generateSuitcaseCode,
  getSuitcaseSummary: SuitcaseController.getSuitcaseSummary,
  
  // SuitcaseItemController
  getSuitcaseItemById: SuitcaseItemController.getSuitcaseItemById,
  addItemToSuitcase: SuitcaseItemController.addItemToSuitcase,
  updateSuitcaseItemStatus: SuitcaseItemController.updateSuitcaseItemStatus,
  removeSuitcaseItem: SuitcaseItemController.removeSuitcaseItem,
  updateSuitcaseItemQuantity: SuitcaseItemController.updateSuitcaseItemQuantity,
  returnItemToInventory: SuitcaseItemController.returnItemToInventory,
  updateSaleInfo: SuitcaseItemController.updateSaleInfo,
  
  // DeleteSuitcaseController
  deleteSuitcaseWithCascade: DeleteSuitcaseController.deleteSuitcase,
  canDeleteSuitcase: DeleteSuitcaseController.canDeleteSuitcase,
  
  // SettlementController
  getHistoricoAcertos: SettlementController.getHistoricoAcertos,
  createPendingSettlement: SettlementController.createPendingSettlement,
  finalizeSettlement: SettlementController.finalizeSettlement,
  
  // InventorySearchController
  searchInventoryItems: InventorySearchController.searchInventoryItems,
  getItemSuitcaseInfo: InventorySearchController.getItemSuitcaseInfo,
  
  // SellerController
  getSellerById: SellerController.getSellerById,
  getAllSellers: SellerController.getAllSellers,
  getPromoterForReseller: SellerController.getPromoterForReseller,
  
  // PdfController
  generateSuitcasePDF: PdfController.generateSuitcasePDF
};

// Export default for backwards compatibility
export default CombinedSuitcaseController;
