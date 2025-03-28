
/**
 * Controlador Combinado de Maletas
 * @file Este arquivo combina diferentes controladores relacionados a maletas
 */
import { SuitcaseController } from "./suitcaseController";
import { SuitcaseItemController } from "./suitcaseItemController";
import { SuitcaseSupplyController } from "./supply/suitcaseSupplyController";
import { DeleteSuitcaseController } from "./deleteSuitcaseController";

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
  
  // Itens de maleta
  getSuitcaseItems: SuitcaseItemController.getSuitcaseItems,
  updateItemStatus: SuitcaseItemController.updateItemStatus,
  markItemAsLost: SuitcaseItemController.markItemAsLost,
  markItemAsDamaged: SuitcaseItemController.markItemAsDamaged,
  returnItemToInventory: SuitcaseItemController.returnItemToInventory,
  sellItem: SuitcaseItemController.sellItem,
  
  // Abastecimento de maleta
  supplySuitcase: SuitcaseSupplyController.supplySuitcase,
  generateSupplyPDF: SuitcaseSupplyController.generateSupplyPDF,
  searchInventoryForSuitcase: SuitcaseSupplyController.searchInventoryItems,
  countSuitcaseItems: SuitcaseSupplyController.countSuitcaseItems,
  getSuitcaseItemCounts: SuitcaseSupplyController.getSuitcasesItemCounts,
  
  // Exclusão de maleta
  deleteSuitcase: DeleteSuitcaseController.deleteSuitcase
};

// Também exportamos os controladores individuais para acesso direto se necessário
export { 
  SuitcaseController, 
  SuitcaseItemController, 
  SuitcaseSupplyController,
  DeleteSuitcaseController
};
