
/**
 * Controlador de Itens para Abastecimento
 * @file Este arquivo contém operações para busca e verificação de itens do inventário para abastecimento de maletas
 */
import { supabase } from "@/integrations/supabase/client";
import { InventoryController } from "@/controllers/inventoryController";

export class SupplyItemController {
  /**
   * Busca itens do inventário para abastecimento
   * @param searchTerm Termo de busca
   * @returns Lista de itens do inventário correspondentes à busca
   */
  static async searchInventoryItems(searchTerm: string) {
    try {
      if (!searchTerm || searchTerm.length < 2) {
        throw new Error("O termo de busca deve ter pelo menos 2 caracteres");
      }

      // Buscar itens do inventário diretamente
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          category:inventory_categories(name),
          photo_url:inventory_photos(photo_url, is_primary)
        `)
        .or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`)
        .eq('archived', false)
        .gt('quantity', 0)
        .limit(10);
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error("Erro ao buscar itens do inventário:", error);
      return [];
    }
  }

  /**
   * Verifica a disponibilidade de um item para abastecimento
   * @param inventoryId ID do item no inventário
   * @returns Status de disponibilidade e quantidade disponível
   */
  static async checkItemAvailability(inventoryId: string) {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('quantity, quantity_reserved, archived')
        .eq('id', inventoryId)
        .single();

      if (error) throw error;

      if (!data) {
        return {
          available: false,
          reason: "Item não encontrado",
          quantity: 0
        };
      }

      // Verificar se o item está arquivado
      if (data.archived) {
        return {
          available: false,
          reason: "Item arquivado",
          quantity: 0
        };
      }

      // Calcular quantidade disponível
      const availableQuantity = Math.max(0, (data.quantity || 0) - (data.quantity_reserved || 0));

      return {
        available: availableQuantity > 0,
        reason: availableQuantity > 0 ? "Disponível" : "Sem estoque disponível",
        quantity: availableQuantity
      };
    } catch (error) {
      console.error("Erro ao verificar disponibilidade do item:", error);
      return {
        available: false,
        reason: "Erro ao verificar disponibilidade",
        quantity: 0
      };
    }
  }
}
