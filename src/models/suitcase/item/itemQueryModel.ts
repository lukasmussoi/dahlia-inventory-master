
/**
 * Modelo de Consultas de Itens de Maleta
 * @file Este arquivo contém consultas específicas para itens de maleta
 */
import { supabase } from "@/integrations/supabase/client";

export class ItemQueryModel {
  /**
   * Verifica a disponibilidade de um item para adição na maleta
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
