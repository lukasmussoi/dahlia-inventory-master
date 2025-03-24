
/**
 * Modelo de Busca de Inventário
 * @file Funções relacionadas à busca de inventário para maletas
 */
import { supabase } from "@/integrations/supabase/client";

export class InventorySearchModel {
  // Buscar itens de inventário
  static async searchInventoryItems(query: string): Promise<any[]> {
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
    
    if (error) throw error;
    
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
}
