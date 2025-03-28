
/**
 * Modelo de Movimentos de Inventário
 * @file Este arquivo contém operações relacionadas aos movimentos de estoque
 */
import { supabase } from "@/integrations/supabase/client";
import { MovementType } from "@/types/inventory";

export class InventoryMovementModel {
  /**
   * Cria um novo movimento de inventário
   * @param movement Dados do movimento a ser registrado
   * @returns O movimento criado
   */
  static async createMovement(movement: {
    inventory_id: string;
    quantity: number;
    movement_type: MovementType;
    reason: string;
    unit_cost?: number;
    notes?: string;
    user_id?: string;
  }) {
    try {
      console.log("[InventoryMovementModel] Criando movimento:", movement);
      
      // Obter o ID do usuário atual se não foi fornecido
      let userId = movement.user_id;
      if (!userId) {
        // Obter o usuário atual da sessão
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id || 'sistema';
      }
      
      const { data, error } = await supabase
        .from('inventory_movements')
        .insert({
          inventory_id: movement.inventory_id,
          quantity: movement.quantity,
          movement_type: movement.movement_type,
          reason: movement.reason,
          unit_cost: movement.unit_cost || 0,
          notes: movement.notes,
          user_id: userId
        })
        .select()
        .maybeSingle();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error("[InventoryMovementModel] Erro ao criar movimento:", error);
      throw error;
    }
  }

  /**
   * Busca os movimentos de um item específico
   * @param inventoryId ID do item no inventário
   * @returns Array de movimentos
   */
  static async getItemMovements(inventoryId: string) {
    try {
      const { data, error } = await supabase
        .from('inventory_movements')
        .select('*')
        .eq('inventory_id', inventoryId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error("[InventoryMovementModel] Erro ao buscar movimentos do item:", error);
      throw error;
    }
  }

  /**
   * Verifica se um item tem movimentos
   * @param inventoryId ID do item no inventário
   * @returns true se o item tem movimentos, false caso contrário
   */
  static async checkItemHasMovements(inventoryId: string) {
    try {
      const { count, error } = await supabase
        .from('inventory_movements')
        .select('*', { count: 'exact', head: true })
        .eq('inventory_id', inventoryId);
      
      if (error) throw error;
      
      return count && count > 0;
    } catch (error) {
      console.error("[InventoryMovementModel] Erro ao verificar movimentos do item:", error);
      throw error;
    }
  }
}
