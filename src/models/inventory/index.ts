
/**
 * Exportação centralizada de todos os modelos de inventário
 * @file Este arquivo facilita o acesso a todos os modelos relacionados ao inventário
 */
import { BaseInventoryModel } from "./baseModel";
import { InventoryItemModel } from "./itemModel";
import { CategoryModel } from "./categoryModel";
import { PlatingTypeModel } from "./platingTypeModel";
import { SupplierModel } from "./supplierModel";
import { InventoryStatsModel } from "./statsModel";
import { InventoryMovementModel } from "./movementModel";
import { InventoryStockModel } from "./stockModel";

// Re-exportar os tipos
export * from "./types";

// Criar um modelo combinado para manter compatibilidade com o código existente
export class InventoryModel {
  // Itens
  static getAllItems = BaseInventoryModel.getAllItems;
  static getItemById = BaseInventoryModel.getItemById;
  static createItem = InventoryItemModel.createItem;
  static updateItem = InventoryItemModel.updateItem;
  static deleteItem = InventoryItemModel.deleteItem;
  static archiveItem = InventoryItemModel.archiveItem;
  static restoreItem = InventoryItemModel.restoreItem;
  static checkItemInSuitcase = BaseInventoryModel.checkItemInSuitcase;
  
  // Novos métodos de estoque (do InventoryMovementModel)
  static checkItemHasMovements = InventoryMovementModel.checkItemHasMovements;
  static createMovement = InventoryMovementModel.createMovement;
  
  // Novos métodos de estoque (do InventoryStockModel)
  static updateItemPhotos = InventoryStockModel.updateItemPhotos;
  static getItemPhotos = InventoryStockModel.getItemPhotos;
  static reserveForSuitcase = InventoryStockModel.reserveForSuitcase;
  static releaseReservation = InventoryStockModel.releaseReservation;
  static finalizeSale = InventoryStockModel.finalizeSale;
  
  // Categorias
  static getAllCategories = CategoryModel.getAllCategories;
  static createCategory = CategoryModel.createCategory;
  static updateCategory = CategoryModel.updateCategory;
  static deleteCategory = CategoryModel.deleteCategory;
  
  // Tipos de Banho
  static getAllPlatingTypes = PlatingTypeModel.getAllPlatingTypes;
  static createPlatingType = PlatingTypeModel.createPlatingType;
  static updatePlatingType = PlatingTypeModel.updatePlatingType;
  static deletePlatingType = PlatingTypeModel.deletePlatingType;
  
  // Fornecedores
  static getAllSuppliers = SupplierModel.getAllSuppliers;
  static createSupplier = SupplierModel.createSupplier;
  static updateSupplier = SupplierModel.updateSupplier;
  static deleteSupplier = SupplierModel.deleteSupplier;
  
  // Estatísticas
  static getTotalInventory = InventoryStatsModel.getTotalInventory;
}
