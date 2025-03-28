
/**
 * Controlador de Itens para Abastecimento
 * @file Este arquivo coordena a busca e verificação de itens do inventário para abastecimento de maletas
 * @relacionamento Utiliza inventory model e inventorySearchModel para acesso ao estoque
 */
import { supabase } from "@/integrations/supabase/client";
import { InventorySearchModel } from "@/models/suitcase/inventorySearchModel";

export class SupplyItemController {
  /**
   * Busca itens do inventário para abastecimento
   * @param searchTerm Termo para busca
   * @returns Lista de itens do inventário que correspondem à busca
   */
  static async searchInventoryItems(searchTerm: string) {
    try {
      console.log(`[SupplyItemController] Iniciando busca por itens com termo: ${searchTerm}`);
      const items = await InventorySearchModel.searchAvailableInventory(searchTerm);
      
      console.log(`[SupplyItemController] Retornando ${items.length} itens para abastecimento`);
      return items;
    } catch (error) {
      console.error("[SupplyItemController] Erro ao buscar itens para abastecimento:", error);
      throw error;
    }
  }

  /**
   * Verifica disponibilidade de um item para abastecer maleta
   * @param inventoryId ID do item no inventário
   * @param requestedQuantity Quantidade solicitada para adição
   * @returns Informações de disponibilidade
   */
  static async checkItemAvailability(inventoryId: string, requestedQuantity: number = 1) {
    try {
      console.log(`[SupplyItemController] Verificando disponibilidade do item: ${inventoryId} para quantidade: ${requestedQuantity}`);
      
      // Buscar dados atualizados do item
      const { data: item, error } = await supabase
        .from('inventory')
        .select('quantity, quantity_reserved, name, sku')
        .eq('id', inventoryId)
        .single();
      
      if (error) {
        console.error(`[SupplyItemController] Erro ao verificar disponibilidade:`, error);
        return { 
          available: false, 
          message: `Erro ao verificar disponibilidade: ${error.message}`, 
          quantity: 0,
          quantity_reserved: 0,
          quantity_available: 0
        };
      }
      
      if (!item) {
        console.error(`[SupplyItemController] Item não encontrado: ${inventoryId}`);
        return {
          available: false,
          message: "Item não encontrado no estoque",
          quantity: 0,
          quantity_reserved: 0,
          quantity_available: 0
        };
      }
      
      // Calcular quantidade disponível
      const quantity_total = item.quantity || 0;
      const quantity_reserved = item.quantity_reserved || 0;
      const quantity_available = Math.max(0, quantity_total - quantity_reserved);
      
      const itemName = item.name || 'sem nome';
      const itemSku = item.sku || 'sem SKU';
      
      console.log(`[SupplyItemController] Disponibilidade do item ${itemName} (${itemSku}): total=${quantity_total}, reservado=${quantity_reserved}, disponível=${quantity_available}`);
      console.log(`[LOG] Buscando estoque disponível para ${itemName} (${itemSku}): Total=${quantity_total}, Reservado=${quantity_reserved}, Disponível=${quantity_available}`);
      
      // Verificar se a quantidade solicitada está disponível
      const hasEnoughStock = quantity_available >= requestedQuantity;
      
      if (!hasEnoughStock) {
        console.log(`[SupplyItemController] Item ${itemSku} não tem estoque suficiente. Solicitado: ${requestedQuantity}, Disponível: ${quantity_available}`);
        console.log(`[ERRO] Não foi possível reservar item ${itemSku} - Disponível: ${quantity_available} - Solicitado: ${requestedQuantity}`);
      } else {
        console.log(`[LOG] Verificando disponibilidade de ${requestedQuantity} unidades do item ${itemSku} - OK (disponível: ${quantity_available})`);
      }
      
      return {
        available: hasEnoughStock,
        message: hasEnoughStock 
          ? `Item ${itemName} (${itemSku}) disponível para abastecimento (${quantity_available} unidades)` 
          : `Quantidade solicitada (${requestedQuantity}) excede o disponível (${quantity_available}) para o item ${itemName} (${itemSku})`,
        quantity: quantity_total,
        quantity_reserved,
        quantity_available
      };
    } catch (error) {
      console.error("[SupplyItemController] Erro ao verificar disponibilidade:", error);
      return { 
        available: false, 
        message: error instanceof Error ? error.message : "Erro desconhecido ao verificar disponibilidade", 
        quantity: 0,
        quantity_reserved: 0,
        quantity_available: 0
      };
    }
  }
}
