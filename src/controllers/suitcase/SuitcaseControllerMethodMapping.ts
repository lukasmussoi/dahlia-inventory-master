
/**
 * Mapeamento de Métodos do Controlador de Maleta
 * @file Este arquivo define aliases de métodos para manter compatibilidade
 */
import { SuitcaseController } from "./suitcaseController";
import { SellerController } from "./sellerController";
import { SuitcaseItemController } from "./suitcaseItemController";
import { SuitcaseSupplyController } from "./supply/suitcaseSupplyController";

// Este mapeamento é usado para manter compatibilidade com código existente
export const SuitcaseControllerMethodMapping = {
  // Aliases para métodos do SuitcaseController
  getSuitcasesByStatus: SuitcaseController.getSuitcases,
  getSuitcasesBySeller: SuitcaseController.getSuitcases,
  getSellerNameById: SellerController.getSellerById,
  
  // Aliases para métodos do SuitcaseItemController
  updateItemStatus: SuitcaseItemController.updateSuitcaseItemStatus,
  markItemAsLost: (itemId: string) => SuitcaseItemController.updateSuitcaseItemStatus(itemId, 'lost'),
  markItemAsDamaged: (itemId: string) => SuitcaseItemController.updateSuitcaseItemStatus(itemId, 'damaged'),
  sellItem: (itemId: string) => SuitcaseItemController.updateSuitcaseItemStatus(itemId, 'sold'),
  
  // Aliases para métodos do SuitcaseSupplyController
  getSuitcaseItemCounts: SuitcaseSupplyController.getSuitcasesItemCounts
};

export default SuitcaseControllerMethodMapping;
