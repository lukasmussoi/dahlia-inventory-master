
/**
 * Controlador Combinado de Maletas
 * @file Este arquivo combina diferentes controladores relacionados a maletas
 */
import { SuitcaseController } from "./suitcaseController";
import { SuitcaseItemController } from "./suitcaseItemController";
import { SuitcaseSupplyController } from "./supply/suitcaseSupplyController";
import { DeleteSuitcaseController } from "./deleteSuitcaseController";
import { SupplyItemController } from "./inventory/supplyItemController";
import { SupplyPdfController } from "./pdf/supplyPdfController";
import { PromoterController } from "./promoterController";
import { SellerController } from "./sellerController";
import { SuitcaseHistoryController } from "./suitcaseHistoryController";

// Controlador combinado para operações de maleta
export const CombinedSuitcaseController = {
  // Operações básicas de maleta
  createSuitcase: SuitcaseController.createSuitcase,
  getSuitcases: SuitcaseController.getSuitcases,
  getSuitcaseById: SuitcaseController.getSuitcaseById,
  updateSuitcase: SuitcaseController.updateSuitcase,
  getSuitcasesByStatus: SuitcaseController.getSuitcasesByStatus,
  getSuitcasesBySeller: SuitcaseController.getSuitcasesBySeller,
  getSellerNameById: SuitcaseController.getSellerNameById,
  getSuitcaseSummary: SuitcaseController.getSuitcaseSummary,
  searchSuitcases: SuitcaseController.searchSuitcases,
  generateSuitcaseCode: SuitcaseController.generateSuitcaseCode,
  
  // Itens de maleta
  getSuitcaseItems: SuitcaseItemController.getSuitcaseItems,
  updateItemStatus: SuitcaseItemController.updateItemStatus,
  updateSuitcaseItemStatus: SuitcaseItemController.updateSuitcaseItemStatus,
  updateSuitcaseItemQuantity: SuitcaseItemController.updateSuitcaseItemQuantity,
  markItemAsLost: SuitcaseItemController.markItemAsLost,
  markItemAsDamaged: SuitcaseItemController.markItemAsDamaged,
  returnItemToInventory: SuitcaseItemController.returnItemToInventory,
  returnItemsToInventory: SuitcaseItemController.returnItemsToInventory,
  sellItem: SuitcaseItemController.sellItem,
  addItemToSuitcase: SuitcaseItemController.addItemToSuitcase,
  removeSuitcaseItem: SuitcaseItemController.removeSuitcaseItem,
  updateSaleInfo: SuitcaseItemController.updateSaleInfo,
  getItemSuitcaseInfo: SuitcaseItemController.getItemSuitcaseInfo,
  
  // Abastecimento de maleta
  supplySuitcase: SuitcaseSupplyController.supplySuitcase,
  generateSupplyPDF: SuitcaseSupplyController.generateSupplyPDF,
  searchInventoryItems: SupplyItemController.searchInventoryItems,
  countSuitcaseItems: SuitcaseSupplyController.countSuitcaseItems,
  getSuitcaseItemCounts: SuitcaseSupplyController.getSuitcaseItemCounts,
  getSuitcasesItemCounts: SuitcaseSupplyController.getSuitcaseItemCounts,
  
  // PDF de maleta
  generateSuitcasePDF: SupplyPdfController.generateSuitcasePDF,
  
  // Exclusão de maleta
  deleteSuitcase: DeleteSuitcaseController.deleteSuitcase,
  deleteSuitcaseWithCascade: DeleteSuitcaseController.deleteSuitcaseWithCascade,
  canDeleteSuitcase: DeleteSuitcaseController.canDeleteSuitcase,
  
  // Promotoras e revendedoras
  getPromoterForReseller: PromoterController.getPromoterForReseller,
  getAllSellers: SellerController.getAllSellers,
  getSellerById: SellerController.getSellerById,
  
  // Histórico e acertos
  getHistoricoAcertos: SuitcaseHistoryController.getHistoricoAcertos
};

// Também exportamos os controladores individuais para acesso direto se necessário
export { 
  SuitcaseController, 
  SuitcaseItemController, 
  SuitcaseSupplyController,
  DeleteSuitcaseController,
  SupplyItemController,
  SupplyPdfController,
  PromoterController,
  SellerController,
  SuitcaseHistoryController
};
