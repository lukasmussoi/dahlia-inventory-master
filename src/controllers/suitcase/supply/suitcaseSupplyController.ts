
/**
 * Controlador de Abastecimento de Maletas
 * @file Este arquivo contém as funções para abastecimento e gestão de maletas
 */
import { SuitcaseModel, SuitcaseItemModel } from "@/models/suitcase";
import { supabase } from "@/integrations/supabase/client";
import { InventoryController } from "@/controllers/inventoryController";
import { SupplyItemController } from "../inventory/supplyItemController";

export const SuitcaseSupplyController = {
  /**
   * Abastece uma maleta com um item do inventário
   * @param suitcaseId ID da maleta
   * @param inventoryId ID do item do inventário
   * @returns O item adicionado à maleta
   */
  async supplySuitcase(suitcaseId: string, inventoryId: string) {
    try {
      console.log(`[SuitcaseSupplyController] Adicionando item ${inventoryId} à maleta ${suitcaseId}`);
      
      // Verificar se a maleta existe
      const suitcase = await SuitcaseModel.getSuitcaseById(suitcaseId);
      if (!suitcase) {
        throw new Error("Maleta não encontrada");
      }

      // Verificar se o item já está na maleta
      const existingItems = await SuitcaseItemModel.getSuitcaseItems(suitcaseId);
      const existingItem = existingItems.find(item => item.inventory_id === inventoryId);
      
      if (existingItem) {
        // Se o item já está na maleta, incrementar a quantidade
        console.log(`[SuitcaseSupplyController] Item ${inventoryId} já existe na maleta, incrementando quantidade`);
        
        const updatedItem = await SuitcaseItemModel.updateSuitcaseItemQuantity(
          existingItem.id, 
          (existingItem.quantity || 1) + 1
        );
        
        // Registrar reserva adicional no inventário
        await InventoryController.reserveItemForSuitcase(inventoryId, 1, suitcaseId);
        
        return updatedItem;
      } else {
        // Adicionar o item à maleta
        console.log(`[SuitcaseSupplyController] Adicionando novo item ${inventoryId} à maleta`);
        
        // Criar o item na maleta com status 'in_possession'
        const itemData = {
          suitcase_id: suitcaseId,
          inventory_id: inventoryId,
          quantity: 1
        };
        
        // A propriedade status é definida automaticamente no modelo como 'in_possession'
        const newItem = await SuitcaseItemModel.addItemToSuitcase(itemData);
        
        // Registrar reserva no inventário
        await InventoryController.reserveItemForSuitcase(inventoryId, 1, suitcaseId);
        
        return newItem;
      }
    } catch (error) {
      console.error("[SuitcaseSupplyController] Erro ao abastecer maleta:", error);
      throw error;
    }
  },

  /**
   * Busca itens do inventário
   * @param query Termo de busca
   * @returns Array de itens correspondentes
   */
  async searchInventoryItems(query: string) {
    try {
      return await SupplyItemController.searchInventoryItems(query);
    } catch (error) {
      console.error("[SuitcaseSupplyController] Erro ao buscar itens:", error);
      throw error;
    }
  },

  /**
   * Gera um PDF com os itens da maleta para abastecimento
   * @param suitcaseId ID da maleta
   * @param suitcase Dados da maleta
   * @param allItems Array com itens para o PDF
   * @returns URL do PDF gerado
   */
  async generateSupplyPDF(suitcaseId: string, suitcase: any, allItems: any[]) {
    try {
      // Usar o módulo de PDF adequado
      const { PDFController } = await import("../pdfController");
      
      // Esta função gera o PDF de abastecimento
      return await PDFController.generateSuitcasePDF(suitcaseId, suitcase, allItems);
    } catch (error) {
      console.error("[SuitcaseSupplyController] Erro ao gerar PDF de abastecimento:", error);
      throw error;
    }
  }
};
