
/**
 * Modelo de Gestão de Estoque
 * @file Este arquivo contém operações relacionadas à gestão do estoque e reservas
 */
import { supabase } from "@/integrations/supabase/client";

export class InventoryStockModel {
  /**
   * Reserva um item para uma maleta
   * @param inventoryId ID do item no inventário
   * @param quantity Quantidade a ser reservada
   * @returns true se a reserva foi bem-sucedida
   */
  static async reserveForSuitcase(inventoryId: string, quantity: number) {
    try {
      // Verificar se há estoque disponível suficiente
      const { data: item, error: itemError } = await supabase
        .from('inventory')
        .select('quantity, quantity_reserved')
        .eq('id', inventoryId)
        .maybeSingle();
      
      if (itemError) throw itemError;
      if (!item) throw new Error("Item não encontrado");
      
      const availableQuantity = item.quantity - (item.quantity_reserved || 0);
      if (availableQuantity < quantity) {
        throw new Error(`Estoque insuficiente. Disponível: ${availableQuantity}, Solicitado: ${quantity}`);
      }
      
      // Usar a função RPC para reservar o estoque
      const { data, error } = await supabase
        .rpc('reserve_inventory_for_suitcase', {
          inventory_id: inventoryId,
          reserve_quantity: quantity
        });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error("[InventoryStockModel] Erro ao reservar item para maleta:", error);
      throw error;
    }
  }

  /**
   * Libera um item reservado
   * @param inventoryId ID do item no inventário
   * @param quantity Quantidade a ser liberada
   * @returns true se a liberação foi bem-sucedida
   */
  static async releaseReservation(inventoryId: string, quantity: number) {
    try {
      const { data, error } = await supabase
        .rpc('release_reserved_inventory', {
          inventory_id: inventoryId,
          release_quantity: quantity
        });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error("[InventoryStockModel] Erro ao liberar reserva de item:", error);
      throw error;
    }
  }

  /**
   * Finaliza uma venda, removendo o item do estoque
   * @param inventoryId ID do item no inventário
   * @param quantity Quantidade vendida
   * @returns true se a finalização foi bem-sucedida
   */
  static async finalizeSale(inventoryId: string, quantity: number) {
    try {
      const { data, error } = await supabase
        .rpc('finalize_inventory_sale', {
          inventory_id: inventoryId,
          sale_quantity: quantity
        });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error("[InventoryStockModel] Erro ao finalizar venda de item:", error);
      throw error;
    }
  }
  
  /**
   * Atualiza as fotos de um item
   * @param inventoryId ID do item
   * @param photoUrls URLs das fotos
   * @param primaryPhotoIndex Índice da foto principal
   * @returns true se a atualização foi bem-sucedida
   */
  static async updateItemPhotos(inventoryId: string, photoUrls: string[], primaryPhotoIndex: number = 0) {
    try {
      // Remover fotos existentes
      const { error: deleteError } = await supabase
        .from('inventory_photos')
        .delete()
        .eq('inventory_id', inventoryId);
      
      if (deleteError) throw deleteError;
      
      // Adicionar novas fotos
      const photos = photoUrls.map((url, index) => ({
        inventory_id: inventoryId,
        photo_url: url,
        is_primary: index === primaryPhotoIndex
      }));
      
      if (photos.length === 0) return true;
      
      const { error: insertError } = await supabase
        .from('inventory_photos')
        .insert(photos);
      
      if (insertError) throw insertError;
      
      return true;
    } catch (error) {
      console.error("[InventoryStockModel] Erro ao atualizar fotos do item:", error);
      throw error;
    }
  }
  
  /**
   * Obtém as fotos de um item
   * @param inventoryId ID do item
   * @returns Array de fotos
   */
  static async getItemPhotos(inventoryId: string) {
    try {
      const { data, error } = await supabase
        .from('inventory_photos')
        .select('*')
        .eq('inventory_id', inventoryId)
        .order('is_primary', { ascending: false });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error("[InventoryStockModel] Erro ao buscar fotos do item:", error);
      throw error;
    }
  }
}
