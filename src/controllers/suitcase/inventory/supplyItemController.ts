
/**
 * Controlador de Itens para Abastecimento
 * @file Este arquivo coordena a busca e verificação de itens do inventário para abastecimento de maletas
 * @relacionamento Utiliza inventory model e inventorySearchModel para acesso ao estoque
 */
import { InventoryModel } from "@/models/inventory";
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
      const items = await InventorySearchModel.searchAvailableInventory(searchTerm);
      
      // Enriquecer os dados com informações de quantidade reservada e disponível
      const enrichedItems = await Promise.all(
        items.map(async (item) => {
          // Buscar dados de estoque atualizados
          const { data: stockData } = await supabase
            .from('inventory')
            .select('quantity, quantity_reserved')
            .eq('id', item.id)
            .single();
          
          // Calcular quantidade disponível
          const quantity_total = stockData?.quantity || 0;
          const quantity_reserved = stockData?.quantity_reserved || 0;
          const quantity_available = quantity_total - quantity_reserved;
          
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
      
      return enrichedItems;
    } catch (error) {
      console.error("Erro ao buscar itens para abastecimento:", error);
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
      // Buscar dados atualizados do item
      const { data: item, error } = await supabase
        .from('inventory')
        .select('quantity, quantity_reserved')
        .eq('id', inventoryId)
        .single();
      
      if (error) {
        console.error("Erro ao verificar disponibilidade:", error);
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
      console.error("Erro ao verificar disponibilidade:", error);
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
