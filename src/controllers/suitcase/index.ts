
/**
 * Controlador Combinado de Maletas
 * @file Este arquivo combina todos os controladores relacionados a maletas
 */

import { SuitcaseController } from "./suitcaseController";
import { SuitcaseItemController } from "./suitcaseItemController";
import { InventorySearchController } from "./inventorySearchController";
import { SellerController } from "./sellerController";
import { SuitcasePdfController } from "./pdfController";
import { DeleteSuitcaseController } from "./deleteSuitcaseController";
import { SettlementController } from "./settlementController";

// Exportar a classe CombinedSuitcaseController que agrega todos os métodos
export const CombinedSuitcaseController = {
  // Métodos do SuitcaseController
  ...SuitcaseController,
  
  // Métodos do SuitcaseItemController
  ...SuitcaseItemController,
  
  // Métodos do InventorySearchController
  ...InventorySearchController,
  
  // Métodos do SellerController
  ...SellerController,
  
  // Métodos do PDFController
  ...SuitcasePdfController,
  
  // Métodos do DeleteSuitcaseController
  ...DeleteSuitcaseController,
  
  // Métodos do SettlementController
  ...SettlementController
};
