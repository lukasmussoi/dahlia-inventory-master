
/**
 * Modelo de Estatísticas de Inventário
 * @file Este arquivo contém operações relacionadas a estatísticas do inventário
 */
import { supabase } from "@/integrations/supabase/client";

export class InventoryStatsModel {
  // Estatísticas de Inventário
  static async getTotalInventory(): Promise<{ totalItems: number; totalValue: number }> {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('quantity, price');

      if (error) throw error;

      const totalItems = data.reduce((sum, item) => sum + (item.quantity || 0), 0);
      const totalValue = data.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0)), 0);

      return { totalItems, totalValue };
    } catch (error) {
      console.error('Erro ao obter total do inventário:', error);
      return { totalItems: 0, totalValue: 0 };
    }
  }
}
