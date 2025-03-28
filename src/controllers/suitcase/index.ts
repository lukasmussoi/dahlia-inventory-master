
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
import { PdfController } from "./pdfController";
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
  getSuitcasesByStatus: SuitcaseController.getSuitcases, // Alias para manter compatibilidade
  getSuitcasesBySeller: SuitcaseController.getSuitcases, // Alias para manter compatibilidade
  getSellerNameById: SellerController.getSellerById, // Alias para manter compatibilidade
  getSuitcaseSummary: SuitcaseController.getSuitcaseSummary,
  searchSuitcases: SuitcaseController.searchSuitcases,
  generateSuitcaseCode: SuitcaseController.generateSuitcaseCode,
  
  // Itens de maleta
  getSuitcaseItems: SuitcaseItemController.getSuitcaseItems,
  updateItemStatus: SuitcaseItemController.updateSuitcaseItemStatus, // Alias para manter compatibilidade
  updateSuitcaseItemStatus: SuitcaseItemController.updateSuitcaseItemStatus,
  updateSuitcaseItemQuantity: SuitcaseItemController.updateSuitcaseItemQuantity,
  markItemAsLost: SuitcaseItemController.updateSuitcaseItemStatus, // Alias para manter compatibilidade
  markItemAsDamaged: SuitcaseItemController.updateSuitcaseItemStatus, // Alias para manter compatibilidade
  returnItemToInventory: SuitcaseItemController.returnItemToInventory,
  returnItemsToInventory: SuitcaseItemController.returnItemsToInventory,
  sellItem: SuitcaseItemController.updateSuitcaseItemStatus, // Alias para manter compatibilidade
  addItemToSuitcase: SuitcaseItemController.addItemToSuitcase,
  removeSuitcaseItem: SuitcaseItemController.removeSuitcaseItem,
  updateSaleInfo: SuitcaseItemController.updateSaleInfo,
  getItemSuitcaseInfo: SuitcaseItemController.getItemSuitcaseInfo,
  
  // Abastecimento de maleta
  supplySuitcase: SuitcaseSupplyController.supplySuitcase,
  generateSupplyPDF: SupplyPdfController.generateSupplyPDF,
  searchInventoryItems: SupplyItemController.searchInventoryItems,
  countSuitcaseItems: SuitcaseSupplyController.countSuitcaseItems,
  getSuitcaseItemCounts: SuitcaseSupplyController.getSuitcasesItemCounts, // Alias para manter compatibilidade
  getSuitcasesItemCounts: SuitcaseSupplyController.getSuitcasesItemCounts,
  
  // PDF de maleta
  generateSuitcasePDF: PdfController.generateSuitcasePDF,
  
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
  PdfController,
  PromoterController,
  SellerController,
  SuitcaseHistoryController
};
