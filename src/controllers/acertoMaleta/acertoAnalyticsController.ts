
/**
 * Controlador de Análises de Acerto
 * @file Este arquivo contém operações relacionadas à análise de dados de acertos e vendas.
 * @relacionamento Utiliza o cliente Supabase para acessar os dados.
 */
import { supabase } from "@/integrations/supabase/client";

export class AcertoAnalyticsController {
  /**
   * Verifica a frequência de vendas de um item para um revendedor específico
   * @param inventoryId ID do item no inventário
   * @param resellerId ID do revendedor
   * @returns Informações sobre frequência de vendas
   */
  static async getItemSalesFrequency(inventoryId: string, resellerId: string) {
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const { data: acertos, error: acertosError } = await supabase
        .from('acertos_maleta')
        .select('id')
        .eq('seller_id', resellerId)
        .gte('settlement_date', ninetyDaysAgo.toISOString());
      
      if (acertosError) throw acertosError;
      
      if (!acertos || acertos.length === 0) {
        return { count: 0, frequency: "baixa" };
      }
      
      const acertoIds = acertos.map(a => a.id);
      
      const { data: vendas, error: vendasError } = await supabase
        .from('acerto_itens_vendidos')
        .select('id')
        .eq('inventory_id', inventoryId)
        .in('acerto_id', acertoIds);
      
      if (vendasError) throw vendasError;
      
      const count = vendas ? vendas.length : 0;
      
      let frequency = "baixa";
      if (count > 5) {
        frequency = "alta";
      } else if (count > 2) {
        frequency = "média";
      }
      
      return { count, frequency };
    } catch (error) {
      console.error("Erro ao verificar frequência de vendas do item:", error);
      throw error;
    }
  }

  /**
   * Busca os itens mais vendidos para um revendedor
   * @param resellerId ID do revendedor
   * @param limit Número máximo de itens a retornar
   * @returns Lista de itens populares
   */
  static async getPopularItems(resellerId: string, limit = 5) {
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);
      
      const { data: acertos, error: acertosError } = await supabase
        .from('acertos_maleta')
        .select('id')
        .eq('seller_id', resellerId)
        .gte('settlement_date', sixMonthsAgo.toISOString());
      
      if (acertosError) throw acertosError;
      
      if (!acertos || acertos.length === 0) {
        return [];
      }
      
      const acertoIds = acertos.map(a => a.id);
      
      const { data: vendas, error: vendasError } = await supabase
        .from('acerto_itens_vendidos')
        .select(`
          inventory_id,
          product:inventory(id, name, sku, price, photo_url:inventory_photos(photo_url))
        `)
        .in('acerto_id', acertoIds);
      
      if (vendasError) throw vendasError;
      
      if (!vendas || vendas.length === 0) {
        return [];
      }
      
      const itemCounts: Record<string, { count: number; product: any }> = {};
      
      vendas.forEach(venda => {
        const inventoryId = venda.inventory_id;
        
        if (!itemCounts[inventoryId]) {
          let product = venda.product;
          if (product && Array.isArray(product.photo_url) && product.photo_url.length > 0) {
            product = {
              ...product,
              photo_url: product.photo_url
            };
          }
          
          itemCounts[inventoryId] = { 
            count: 1,
            product
          };
        } else {
          itemCounts[inventoryId].count += 1;
        }
      });
      
      const popularItems = Object.entries(itemCounts).map(([inventoryId, data]) => ({
        inventory_id: inventoryId,
        count: data.count,
        product: data.product
      }));
      
      return popularItems
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    } catch (error) {
      console.error("Erro ao buscar itens populares:", error);
      throw error;
    }
  }
}
