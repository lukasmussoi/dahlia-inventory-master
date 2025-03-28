
/**
 * Modelo Base de Itens de Maleta
 * @file Este arquivo contém operações básicas para manipulação de itens de maletas
 */
import { supabase } from "@/integrations/supabase/client";
import { SuitcaseItem, SuitcaseItemStatus, InventoryItemSuitcaseInfo } from "@/types/suitcase";

export class BaseItemModel {
  /**
   * Busca informações de um item de maleta pelo ID
   * @param itemId ID do item de maleta
   * @returns Informações do item de maleta
   */
  static async getSuitcaseItemById(itemId: string): Promise<SuitcaseItem | null> {
    try {
      if (!itemId) return null;
      
      const { data, error } = await supabase
        .from('suitcase_items')
        .select(`
          *,
          product:inventory(
            id, 
            sku, 
            name, 
            price, 
            unit_cost,
            photo_url:inventory_photos(photo_url)
          ),
          sales:suitcase_item_sales(*)
        `)
        .eq('id', itemId)
        .single();
      
      if (error) throw error;
      
      return data as SuitcaseItem;
    } catch (error) {
      console.error("Erro ao buscar item da maleta:", error);
      return null;
    }
  }

  /**
   * Busca todos os itens de uma maleta
   * @param suitcaseId ID da maleta
   * @returns Lista de itens da maleta
   */
  static async getSuitcaseItems(suitcaseId: string): Promise<SuitcaseItem[]> {
    try {
      if (!suitcaseId) return [];
      
      const { data, error } = await supabase
        .from('suitcase_items')
        .select(`
          *,
          product:inventory(
            id, 
            sku, 
            name, 
            price, 
            unit_cost,
            photo_url:inventory_photos(photo_url)
          ),
          sales:suitcase_item_sales(*)
        `)
        .eq('suitcase_id', suitcaseId);
      
      if (error) throw error;
      
      return data as SuitcaseItem[];
    } catch (error) {
      console.error("Erro ao buscar itens da maleta:", error);
      return [];
    }
  }

  /**
   * Adiciona um item à maleta
   * @param data Dados do item a ser adicionado
   * @returns Item adicionado
   */
  static async addItemToSuitcase(data: {
    suitcase_id: string;
    inventory_id: string;
    quantity?: number;
    status?: SuitcaseItemStatus;
  }): Promise<SuitcaseItem | null> {
    try {
      const { suitcase_id, inventory_id, quantity = 1, status = 'in_possession' } = data;
      
      const { data: insertedItem, error } = await supabase
        .from('suitcase_items')
        .insert({
          suitcase_id,
          inventory_id,
          quantity,
          status
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return insertedItem as SuitcaseItem;
    } catch (error) {
      console.error("Erro ao adicionar item à maleta:", error);
      return null;
    }
  }

  /**
   * Atualiza o status de um item de maleta
   * @param itemId ID do item
   * @param status Novo status
   * @returns true se atualizado com sucesso
   */
  static async updateSuitcaseItemStatus(itemId: string, status: SuitcaseItemStatus): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('suitcase_items')
        .update({ status })
        .eq('id', itemId);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error("Erro ao atualizar status do item da maleta:", error);
      return false;
    }
  }

  /**
   * Atualiza a quantidade de um item de maleta
   * @param itemId ID do item
   * @param quantity Nova quantidade
   * @returns true se atualizado com sucesso
   */
  static async updateSuitcaseItemQuantity(itemId: string, quantity: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('suitcase_items')
        .update({ quantity })
        .eq('id', itemId);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error("Erro ao atualizar quantidade do item da maleta:", error);
      return false;
    }
  }

  /**
   * Remove um item da maleta
   * @param itemId ID do item
   * @returns true se removido com sucesso
   */
  static async removeSuitcaseItem(itemId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('suitcase_items')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error("Erro ao remover item da maleta:", error);
      return false;
    }
  }

  /**
   * Busca informações sobre em qual maleta um item do inventário está
   * @param inventoryId ID do item no inventário
   * @returns Informações da maleta e revendedora
   */
  static async getItemSuitcaseInfo(inventoryId: string): Promise<InventoryItemSuitcaseInfo | null> {
    try {
      if (!inventoryId) return null;
      
      const { data, error } = await supabase
        .from('suitcase_items')
        .select(`
          suitcase_id,
          suitcases:suitcases(code, seller:resellers(name))
        `)
        .eq('inventory_id', inventoryId)
        .eq('status', 'in_possession')
        .maybeSingle();
      
      if (error) throw error;
      
      if (!data) return null;
      
      return {
        suitcase_id: data.suitcase_id,
        suitcase_code: data.suitcases?.code,
        seller_name: data.suitcases?.seller?.name
      };
    } catch (error) {
      console.error("Erro ao buscar informações da maleta do item:", error);
      return null;
    }
  }
}
