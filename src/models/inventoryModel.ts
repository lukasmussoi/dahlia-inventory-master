import { supabase } from "@/integrations/supabase/client";

export class InventoryModel {
  // Adicionar os seguintes métodos para busca de itens no inventário
  
  static async searchInventoryItemsById(id: string) {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          id, 
          name, 
          sku, 
          barcode, 
          price,
          inventory_photos (
            photo_url
          )
        `)
        .eq('id', id);
        
      if (error) throw error;
      
      // Processar e formatar os resultados
      return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        barcode: item.barcode,
        price: item.price,
        photo_url: item.inventory_photos?.length > 0 ? item.inventory_photos[0].photo_url : null
      }));
    } catch (error) {
      console.error("Erro ao buscar item por ID:", error);
      throw error;
    }
  }
  
  static async searchInventoryItemsByText(query: string) {
    try {
      // Buscar por nome, SKU ou código de barras
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          id, 
          name, 
          sku, 
          barcode, 
          price,
          inventory_photos (
            photo_url
          )
        `)
        .or(`name.ilike.%${query}%,sku.ilike.%${query}%,barcode.ilike.%${query}%`)
        .limit(10);
        
      if (error) throw error;
      
      // Processar e formatar os resultados
      return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        barcode: item.barcode,
        price: item.price,
        photo_url: item.inventory_photos?.length > 0 ? item.inventory_photos[0].photo_url : null
      }));
    } catch (error) {
      console.error("Erro ao buscar itens por texto:", error);
      throw error;
    }
  }
  
  static async searchInventoryItems(query: string) {
    try {
      // Método compatível com o código existente
      // Agora delegamos para os métodos específicos
      
      // Verificar se a query parece um UUID
      const isUuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (isUuidPattern.test(query)) {
        // Se for UUID, buscar por ID exato
        return await this.searchInventoryItemsById(query);
      } else {
        // Se não for UUID, buscar por texto (nome, código, etc)
        return await this.searchInventoryItemsByText(query);
      }
    } catch (error) {
      console.error("Erro ao buscar itens do inventário:", error);
      throw error;
    }
  }
  
  static async updateInventoryItemStatus(id: string, status: string) {
    try {
      // Atualizar apenas o status virtual, sem alterar a tabela
      console.log(`Atualizando status do item ${id} para ${status}`);
      // Na implementação atual, não há coluna de status na tabela inventory
      // Esta função é apenas para compatibilidade com o fluxo atual
      return { success: true, id, status };
    } catch (error) {
      console.error(`Erro ao atualizar status do item ${id}:`, error);
      throw error;
    }
  }
}
