
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
      
      // Enriquecer os dados com informações de quantidade reservada e disponível
      const enrichedItems = await Promise.all(
        items.map(async (item) => {
          console.log(`[SupplyItemController] Verificando dados de estoque para o item: ${item.id} (${item.name})`);
          
          // Buscar dados de estoque atualizados
          const { data: stockData, error } = await supabase
            .from('inventory')
            .select('quantity, quantity_reserved')
            .eq('id', item.id)
            .single();
          
          if (error) {
            console.error(`[SupplyItemController] Erro ao buscar dados de estoque:`, error);
            return item;
          }
          
          // Calcular quantidade disponível
          const quantity_total = stockData?.quantity || 0;
          const quantity_reserved = stockData?.quantity_reserved || 0;
          const quantity_available = quantity_total - quantity_reserved;
          
          console.log(`[SupplyItemController] Item ${item.name}: total=${quantity_total}, reservado=${quantity_reserved}, disponível=${quantity_available}`);
          
          return {
            ...item,
            quantity_total,
            quantity_reserved,
            quantity_available,
            // Usar a quantidade disponível para a UI
            quantity: quantity_available
          };
        })
      );
      
      console.log(`[SupplyItemController] Retornando ${enrichedItems.length} itens para abastecimento`);
      return enrichedItems;
    } catch (error) {
      console.error("[SupplyItemController] Erro ao buscar itens para abastecimento:", error);
      throw error;
    }
  }

  /**
   * Verifica disponibilidade de um item para abastecer maleta
   * @param inventoryId ID do item no inventário
   * @returns Informações de disponibilidade
   */
  static async checkItemAvailability(inventoryId: string) {
    try {
      console.log(`[SupplyItemController] Verificando disponibilidade do item: ${inventoryId}`);
      
      // Buscar dados atualizados do item
      const { data: item, error } = await supabase
        .from('inventory')
        .select('quantity, quantity_reserved')
        .eq('id', inventoryId)
        .single();
      
      if (error) {
        console.error(`[SupplyItemController] Erro ao verificar disponibilidade:`, error);
        return { 
          available: false, 
          message: "Erro ao verificar disponibilidade", 
          quantity: 0,
          quantity_reserved: 0,
          quantity_available: 0
        };
      }
      
      // Calcular quantidade disponível
      const quantity_total = item?.quantity || 0;
      const quantity_reserved = item?.quantity_reserved || 0;
      const quantity_available = quantity_total - quantity_reserved;
      
      console.log(`[SupplyItemController] Disponibilidade do item: total=${quantity_total}, reservado=${quantity_reserved}, disponível=${quantity_available}`);
      
      return {
        available: quantity_available > 0,
        message: quantity_available > 0 
          ? "Item disponível para abastecimento" 
          : "Item sem estoque disponível",
        quantity: quantity_total,
        quantity_reserved,
        quantity_available
      };
    } catch (error) {
      console.error("[SupplyItemController] Erro ao verificar disponibilidade:", error);
      return { 
        available: false, 
        message: "Erro ao verificar disponibilidade", 
        quantity: 0,
        quantity_reserved: 0,
        quantity_available: 0
      };
    }
  }
}
