
/**
 * Modelo de Consultas de Itens de Maleta
 * @file Funções para buscar e consultar itens de maleta no banco de dados
 * @relacionamento Utiliza BaseItemModel para processamento de dados
 */
import { supabase } from "@/integrations/supabase/client";
import { SuitcaseItem, InventoryItemSuitcaseInfo } from "@/types/suitcase";
import { BaseItemModel } from "./baseItemModel";

export class ItemQueryModel {
  /**
   * Busca uma peça da maleta pelo ID
   * @param itemId ID da peça
   * @returns Detalhes completos do item ou null se não encontrado
   */
  static async getSuitcaseItemById(itemId: string): Promise<SuitcaseItem | null> {
    if (!itemId) throw new Error("ID da peça é necessário");
    
    const { data, error } = await supabase
      .from('suitcase_items')
      .select(`
        *,
        product:inventory_id (
          id,
          name,
          price,
          sku,
          photos:inventory_photos(photo_url)
        )
      `)
      .eq('id', itemId)
      .maybeSingle();
    
    if (error) throw error;
    if (!data) return null;
    
    return BaseItemModel.processItemData(data);
  }

  /**
   * Busca todas as peças de uma maleta
   * @param suitcaseId ID da maleta
   * @returns Lista de itens da maleta
   */
  static async getSuitcaseItems(suitcaseId: string): Promise<SuitcaseItem[]> {
    try {
      if (!suitcaseId) throw new Error("ID da maleta é necessário");
      
      const { data, error } = await supabase
        .from('suitcase_items')
        .select(`
          *,
          product:inventory_id (
            id,
            name,
            price,
            sku,
            photos:inventory_photos(photo_url)
          )
        `)
        .eq('suitcase_id', suitcaseId);
      
      if (error) throw error;
      
      // Processar os dados para obter a primeira foto de cada produto
      const processedData: SuitcaseItem[] = (data || []).map(item => 
        BaseItemModel.processItemData(item)
      );
      
      return processedData;
    } catch (error) {
      console.error("Erro ao buscar peças da maleta:", error);
      throw error;
    }
  }

  /**
   * Busca vendas de uma peça da maleta
   * @param itemId ID da peça
   * @returns Lista de vendas da peça
   */
  static async getSuitcaseItemSales(itemId: string): Promise<any[]> {
    if (!itemId) throw new Error("ID da peça é necessário");
    
    const { data, error } = await supabase
      .from('suitcase_item_sales')
      .select('*')
      .eq('suitcase_item_id', itemId);
    
    if (error) throw error;
    
    return (data || []).map(sale => {
      // Garantir que sale_date existe
      const sale_date = sale.sold_at || sale.created_at || new Date().toISOString();
      
      return {
        id: sale.id,
        suitcase_item_id: sale.suitcase_item_id,
        client_name: sale.customer_name,
        payment_method: sale.payment_method,
        sale_date: sale_date, 
        customer_name: sale.customer_name,
        sold_at: sale.sold_at,
        created_at: sale.created_at,
        updated_at: sale.updated_at
      };
    });
  }

  /**
   * Obter informações de em qual maleta o item está
   * @param inventoryId ID do item de inventário
   * @returns Informações da maleta onde o item está, ou null
   */
  static async getItemSuitcaseInfo(inventoryId: string): Promise<InventoryItemSuitcaseInfo | null> {
    if (!inventoryId) throw new Error("ID do item é necessário");
    
    const { data, error } = await supabase
      .from('suitcase_items')
      .select(`
        suitcase_id,
        suitcases:suitcase_id (
          id,
          code,
          resellers:seller_id (
            name
          )
        )
      `)
      .eq('inventory_id', inventoryId)
      .eq('status', 'in_possession')
      .maybeSingle();
    
    if (error) throw error;
    
    if (!data) return null;
    
    return {
      suitcase_id: data.suitcase_id,
      suitcase_code: data.suitcases?.code || '',
      seller_name: data.suitcases?.resellers?.name || ''
    };
  }

  /**
   * Conta o número de itens em uma maleta
   * @param suitcaseId ID da maleta
   * @returns Objeto com o número total de itens
   */
  static async countSuitcaseItems(suitcaseId: string): Promise<{ count: number }> {
    try {
      if (!suitcaseId) throw new Error("ID da maleta é necessário");
      
      const { count, error } = await supabase
        .from('suitcase_items')
        .select('*', { count: 'exact', head: true })
        .eq('suitcase_id', suitcaseId);
      
      if (error) throw error;
      
      return { count: count || 0 };
    } catch (error) {
      console.error("Erro ao contar itens da maleta:", error);
      return { count: 0 };
    }
  }

  /**
   * Obtém a contagem de itens para múltiplas maletas
   * @param suitcaseIds Lista de IDs de maletas
   * @returns Mapa de ID da maleta para contagem de itens
   */
  static async getSuitcasesItemCounts(suitcaseIds: string[]): Promise<{ [key: string]: number }> {
    try {
      if (!suitcaseIds || suitcaseIds.length === 0) return {};
      
      const { data, error } = await supabase
        .from('suitcase_items')
        .select('suitcase_id')
        .in('suitcase_id', suitcaseIds);
      
      if (error) throw error;
      
      // Agrupar e contar itens por maleta
      const counts: { [key: string]: number } = {};
      
      // Inicializar contagens como 0 para todas as maletas solicitadas
      suitcaseIds.forEach(id => {
        counts[id] = 0;
      });
      
      // Contar os itens encontrados
      data.forEach(item => {
        if (item.suitcase_id) {
          counts[item.suitcase_id] = (counts[item.suitcase_id] || 0) + 1;
        }
      });
      
      return counts;
    } catch (error) {
      console.error("Erro ao obter contagens de itens das maletas:", error);
      return {};
    }
  }
}
