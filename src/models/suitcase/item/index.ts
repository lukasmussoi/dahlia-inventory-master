
/**
 * Índice de Modelos de Itens de Maleta
 * @file Este arquivo exporta todos os modelos relacionados a itens de maleta
 */
import { BaseItemModel } from './baseItemModel';
import { ItemQueryModel } from './itemQueryModel';
import { ItemSalesModel } from './itemSalesModel';
import { SuitcaseItemOperations } from './itemOperationsModel';

// Criando um modelo combinado para exportação
export const SuitcaseItemModel = {
  // Métodos do modelo base
  getSuitcaseItemById: BaseItemModel.getSuitcaseItemById,
  getSuitcaseItems: BaseItemModel.getSuitcaseItems,
  addItemToSuitcase: BaseItemModel.addItemToSuitcase,
  updateSuitcaseItemStatus: BaseItemModel.updateSuitcaseItemStatus,
  updateSuitcaseItemQuantity: BaseItemModel.updateSuitcaseItemQuantity,
  removeSuitcaseItem: BaseItemModel.removeSuitcaseItem,
  getItemSuitcaseInfo: BaseItemModel.getItemSuitcaseInfo,
  
  // Métodos do modelo de consultas
  checkItemAvailability: ItemQueryModel.checkItemAvailability,
  
  // Métodos do modelo de vendas
  getSuitcaseItemSales: ItemSalesModel.getSuitcaseItemSales,
  updateSaleInfo: ItemSalesModel.updateSaleInfo,
  
  // Métodos do modelo de operações
  reserveForSuitcase: SuitcaseItemOperations.reserveForSuitcase,
  releaseFromSuitcase: SuitcaseItemOperations.releaseFromSuitcase,
  finalizeSale: SuitcaseItemOperations.finalizeSale,
  returnItemToInventory: SuitcaseItemOperations.returnItemToInventory
};

// Também exportamos os modelos individuais para acesso direto se necessário
export { BaseItemModel, ItemQueryModel, ItemSalesModel, SuitcaseItemOperations };
