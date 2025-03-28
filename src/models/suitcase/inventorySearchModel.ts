
/**
 * Modelo de Busca de Inventário
 * @file Funções relacionadas à busca de inventário para maletas
 */
import { supabase } from "@/integrations/supabase/client";

export class InventorySearchModel {
  // Buscar itens de inventário
  static async searchInventoryItems(query: string): Promise<any[]> {
    console.log(`[InventorySearchModel] Buscando itens com query: ${query}`);
    let searchQuery = supabase
      .from('inventory')
      .select(`
        *,
        photos:inventory_photos(*)
      `)
      .eq('archived', false);
    
    // Verificar se é um UUID ou um termo de busca
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (uuidRegex.test(query)) {
      searchQuery = searchQuery.eq('id', query);
    } else {
      searchQuery = searchQuery.or(`name.ilike.%${query}%,sku.ilike.%${query}%,barcode.ilike.%${query}%`);
    }
    
    const { data, error } = await searchQuery.limit(10);
    
    if (error) {
      console.error(`[InventorySearchModel] Erro na busca:`, error);
      throw error;
    }
    
    console.log(`[InventorySearchModel] Encontrados ${data?.length || 0} itens`);
    
    // Processar para obter a primeira foto de cada item
    return (data || []).map(item => {
      const photos = item.photos || [];
      let primaryPhoto = null;
      
      if (Array.isArray(photos) && photos.length > 0) {
        primaryPhoto = photos.find((p: any) => p.is_primary) || photos[0];
      }
      
      return {
        ...item,
        photo_url: primaryPhoto ? primaryPhoto.photo_url : null
      };
    });
  }

  /**
   * Busca itens disponíveis no inventário para abastecimento de maletas
   * @param query Termo de busca (nome, sku, código de barras)
   * @returns Lista de itens com dados de disponibilidade
   */
  static async searchAvailableInventory(query: string): Promise<any[]> {
    console.log(`[InventorySearchModel] Buscando itens disponíveis com query: ${query}`);
    
    // Reutiliza a lógica básica de busca
    const items = await this.searchInventoryItems(query);
    
    console.log(`[InventorySearchModel] Processando dados de disponibilidade para ${items.length} itens`);
    
    // Adiciona informações de disponibilidade
    const processedItems = items.map(item => {
      const quantityTotal = item.quantity || 0;
      const quantityReserved = item.quantity_reserved || 0;
      const quantityAvailable = quantityTotal - quantityReserved;
      
      console.log(`[InventorySearchModel] Item ${item.name}: total=${quantityTotal}, reservado=${quantityReserved}, disponível=${quantityAvailable}`);
      
      return {
        ...item,
        quantity_total: quantityTotal,
        quantity_reserved: quantityReserved,
        quantity_available: quantityAvailable
      };
    });
    
    return processedItems;
  }
}
