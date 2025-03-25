
/**
 * Controlador de Itens para Abastecimento
 * @file Este arquivo controla as operações de busca e manipulação de itens para abastecimento
 * @relacionamento Utiliza o supabase para consultas diretas no banco de dados
 */
import { supabase } from "@/integrations/supabase/client";

interface InventorySearchResult {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  photo_url?: string;
  inventory_photos?: Array<{ photo_url: string }>;
}

export class SupplyItemController {
  /**
   * Busca itens do inventário com base em um termo de pesquisa
   * @param searchTerm Termo para busca
   * @returns Lista de itens do inventário que correspondem à busca
   */
  static async searchInventoryItems(searchTerm: string): Promise<InventorySearchResult[]> {
    try {
      if (!searchTerm || searchTerm.length < 2) return [];

      const { data, error } = await supabase
        .from('inventory')
        .select(`
          id,
          name,
          sku,
          quantity,
          price,
          inventory_photos(photo_url)
        `)
        .or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`)
        .eq('archived', false)
        .gt('quantity', 0)
        .order('name')
        .limit(20);

      if (error) throw error;

      return data.map(item => ({
        ...item,
        photo_url: item.inventory_photos && item.inventory_photos.length > 0
          ? item.inventory_photos[0].photo_url
          : null
      }));
    } catch (error) {
      console.error("Erro ao buscar itens do inventário:", error);
      throw error;
    }
  }

  /**
   * Verifica se um item está disponível para abastecimento
   * @param inventoryId ID do item no inventário
   * @returns Status de disponibilidade e quantidade disponível
   */
  static async checkItemAvailability(inventoryId: string) {
    try {
      if (!inventoryId) throw new Error("ID do item é necessário");
      
      // Verificar a quantidade disponível no inventário
      const { data, error } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('id', inventoryId)
        .single();
      
      if (error) throw error;
      
      return {
        available: data && data.quantity > 0,
        quantity: data ? data.quantity : 0
      };
    } catch (error) {
      console.error("Erro ao verificar disponibilidade do item:", error);
      throw error;
    }
  }
}
