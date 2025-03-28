
/**
 * Modelo Base de Itens de Maleta
 * @file Este arquivo contém operações básicas para itens de maleta
 */
import { supabase } from "@/integrations/supabase/client";
import { SuitcaseItem, SuitcaseItemStatus } from "@/types/suitcase";

export class BaseItemModel {
  /**
   * Busca um item de maleta pelo ID
   * @param itemId ID do item
   * @returns Informações do item
   */
  static async getSuitcaseItemById(itemId: string) {
    try {
      const { data, error } = await supabase
        .from('suitcase_items')
        .select(`
          *,
          product:inventory!suitcase_items_inventory_id_fkey (
            id,
            name,
            sku,
            price,
            quantity,
            quantity_reserved,
            photo_url:inventory_photos(photo_url, is_primary)
          )
        `)
        .eq('id', itemId)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error("Erro ao buscar item da maleta:", error);
      throw error;
    }
  }

  /**
   * Busca todos os itens de uma maleta
   * @param suitcaseId ID da maleta
   * @returns Lista de itens da maleta
   */
  static async getSuitcaseItems(suitcaseId: string) {
    try {
      const { data, error } = await supabase
        .from('suitcase_items')
        .select(`
          *,
          product:inventory!suitcase_items_inventory_id_fkey (
            id,
            name,
            sku,
            price,
            quantity,
            quantity_reserved,
            photo_url:inventory_photos(photo_url, is_primary)
          )
        `)
        .eq('suitcase_id', suitcaseId);
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error("Erro ao buscar itens da maleta:", error);
      throw error;
    }
  }

  /**
   * Adiciona um item do inventário a uma maleta
   * @param suitcaseId ID da maleta
   * @param inventoryId ID do item no inventário
   * @param quantity Quantidade a adicionar
   * @returns Item adicionado
   */
  static async addItemToSuitcase(suitcaseId: string, inventoryId: string, quantity: number = 1) {
    try {
      // Verificar se o item já existe na maleta
      const { data: existingItems, error: checkError } = await supabase
        .from('suitcase_items')
        .select('id, quantity')
        .eq('suitcase_id', suitcaseId)
        .eq('inventory_id', inventoryId)
        .eq('status', 'in_possession');
      
      if (checkError) throw checkError;
      
      // Se o item já existe, incrementar quantidade
      if (existingItems && existingItems.length > 0) {
        const existingItem = existingItems[0];
        const newQuantity = (existingItem.quantity || 1) + quantity;
        
        const { data, error } = await supabase
          .from('suitcase_items')
          .update({ quantity: newQuantity })
          .eq('id', existingItem.id)
          .select()
          .single();
        
        if (error) throw error;
        
        return data;
      }
      
      // Se o item não existe, adicionar novo
      const { data, error } = await supabase
        .from('suitcase_items')
        .insert({
          suitcase_id: suitcaseId,
          inventory_id: inventoryId,
          quantity: quantity,
          status: 'in_possession'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error("Erro ao adicionar item à maleta:", error);
      throw error;
    }
  }

  /**
   * Atualiza o status de um item de maleta
   * @param itemId ID do item
   * @param status Novo status
   * @returns true se atualizado com sucesso
   */
  static async updateSuitcaseItemStatus(itemId: string, status: SuitcaseItemStatus) {
    try {
      const { error } = await supabase
        .from('suitcase_items')
        .update({ status })
        .eq('id', itemId);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error("Erro ao atualizar status do item:", error);
      throw error;
    }
  }

  /**
   * Remove um item da maleta
   * @param itemId ID do item
   * @returns true se removido com sucesso
   */
  static async removeSuitcaseItem(itemId: string) {
    try {
      const { error } = await supabase
        .from('suitcase_items')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error("Erro ao remover item da maleta:", error);
      throw error;
    }
  }

  /**
   * Obtém informações sobre em qual maleta um item do inventário está
   * @param inventoryId ID do item no inventário
   * @returns Informações da maleta e revendedora
   */
  static async getItemSuitcaseInfo(inventoryId: string) {
    try {
      const { data, error } = await supabase
        .from('suitcase_items')
        .select(`
          suitcase:suitcases!suitcase_items_suitcase_id_fkey (
            id,
            code,
            seller:resellers!suitcases_seller_id_fkey (
              id,
              name
            )
          )
        `)
        .eq('inventory_id', inventoryId)
        .eq('status', 'in_possession')
        .maybeSingle();
      
      if (error) throw error;
      
      if (!data || !data.suitcase) return null;
      
      return {
        suitcase_id: data.suitcase.id,
        suitcase_code: data.suitcase.code,
        seller_id: data.suitcase.seller?.id,
        seller_name: data.suitcase.seller?.name
      };
    } catch (error) {
      console.error("Erro ao buscar informações da maleta do item:", error);
      return null;
    }
  }
}
