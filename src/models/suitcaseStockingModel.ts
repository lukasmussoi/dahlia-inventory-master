
import { supabase } from "@/integrations/supabase/client";

export class SuitcaseStockingModel {
  // Buscar histórico de vendas da revendedora (últimos 90 dias)
  static async getResellerSalesHistory(resellerId: string): Promise<any[]> {
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      // Buscar acertos dos últimos 90 dias
      const { data: acertos, error: acertosError } = await supabase
        .from('acertos_maleta')
        .select('id')
        .eq('seller_id', resellerId)
        .gte('settlement_date', ninetyDaysAgo.toISOString());
      
      if (acertosError) throw acertosError;
      if (!acertos || !acertos.length) return [];
      
      const acertoIds = acertos.map(a => a.id);
      
      // Buscar itens vendidos desses acertos
      const { data: items, error: itemsError } = await supabase
        .from('acerto_itens_vendidos')
        .select(`
          *,
          product:inventory_id (
            id,
            name,
            sku,
            price,
            category_id,
            inventory_categories(name)
          )
        `)
        .in('acerto_id', acertoIds);
      
      if (itemsError) throw itemsError;
      
      return items || [];
    } catch (error) {
      console.error("Erro ao buscar histórico de vendas:", error);
      throw error;
    }
  }
  
  // Buscar histórico de vendas de uma maleta específica (últimos 90 dias)
  static async getSuitcaseSalesHistory(suitcaseId: string): Promise<any[]> {
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      // Buscar acertos da maleta dos últimos 90 dias
      const { data: acertos, error: acertosError } = await supabase
        .from('acertos_maleta')
        .select('id')
        .eq('suitcase_id', suitcaseId)
        .gte('settlement_date', ninetyDaysAgo.toISOString());
      
      if (acertosError) throw acertosError;
      if (!acertos || !acertos.length) return [];
      
      const acertoIds = acertos.map(a => a.id);
      
      // Buscar itens vendidos desses acertos
      const { data: items, error: itemsError } = await supabase
        .from('acerto_itens_vendidos')
        .select(`
          *,
          product:inventory_id (
            id,
            name,
            sku,
            price,
            category_id,
            inventory_categories(name)
          )
        `)
        .in('acerto_id', acertoIds);
      
      if (itemsError) throw itemsError;
      
      return items || [];
    } catch (error) {
      console.error("Erro ao buscar histórico de vendas da maleta:", error);
      throw error;
    }
  }
  
  // Gerar sugestões baseadas no histórico de vendas
  static async generateStockingSuggestions(resellerId: string): Promise<any> {
    try {
      const salesHistory = await this.getResellerSalesHistory(resellerId);
      
      if (!salesHistory.length) return { items: [], categories: [] };
      
      // Agrupar por item e contar quantas vezes foi vendido
      const itemCounts: Record<string, any> = {};
      const categoryCounts: Record<string, any> = {};
      
      salesHistory.forEach(sale => {
        const itemId = sale.inventory_id;
        const categoryName = sale.product?.inventory_categories?.[0]?.name || 'Sem categoria';
        
        // Contagem de itens
        if (!itemCounts[itemId]) {
          itemCounts[itemId] = {
            id: itemId,
            name: sale.product?.name || 'Produto Desconhecido',
            sku: sale.product?.sku || '',
            count: 0,
            totalRevenue: 0,
            category: categoryName,
            price: sale.product?.price || 0,
            lastSold: sale.sale_date
          };
        }
        
        itemCounts[itemId].count += 1;
        itemCounts[itemId].totalRevenue += parseFloat(sale.price || 0);
        
        // Atualizar última data de venda se for mais recente
        if (new Date(sale.sale_date) > new Date(itemCounts[itemId].lastSold)) {
          itemCounts[itemId].lastSold = sale.sale_date;
        }
        
        // Contagem de categorias
        if (!categoryCounts[categoryName]) {
          categoryCounts[categoryName] = {
            name: categoryName,
            count: 0,
            totalRevenue: 0
          };
        }
        
        categoryCounts[categoryName].count += 1;
        categoryCounts[categoryName].totalRevenue += parseFloat(sale.price || 0);
      });
      
      // Transformar objeto em array e ordenar por contagem (mais vendidos primeiro)
      const sortedItems = Object.values(itemCounts).sort((a: any, b: any) => {
        return b.count - a.count;
      });
      
      const sortedCategories = Object.values(categoryCounts).sort((a: any, b: any) => {
        return b.count - a.count;
      });
      
      // Verificar disponibilidade atual no estoque para as sugestões
      const suggestedItemIds = sortedItems.map((item: any) => item.id);
      
      if (suggestedItemIds.length > 0) {
        const { data: inventoryItems, error: inventoryError } = await supabase
          .from('inventory')
          .select('id, quantity')
          .in('id', suggestedItemIds);
        
        if (!inventoryError && inventoryItems) {
          // Adicionar informação de quantidade disponível
          sortedItems.forEach((item: any) => {
            const inventoryItem = inventoryItems.find(invItem => invItem.id === item.id);
            item.stockAvailable = inventoryItem ? inventoryItem.quantity : 0;
          });
        }
      }
      
      return {
        items: sortedItems.filter((item: any) => item.stockAvailable > 0),
        categories: sortedCategories
      };
    } catch (error) {
      console.error("Erro ao gerar sugestões de abastecimento:", error);
      throw error;
    }
  }
  
  // Verificar se uma peça já foi vendida por uma revendedora específica
  static async checkItemSalesHistory(inventoryId: string, resellerId: string): Promise<{ 
    sold: boolean; 
    count: number; 
    lastSoldDate?: string;
  }> {
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      // Buscar acertos da revendedora nos últimos 90 dias
      const { data: acertos, error: acertosError } = await supabase
        .from('acertos_maleta')
        .select('id')
        .eq('seller_id', resellerId)
        .gte('settlement_date', ninetyDaysAgo.toISOString());
      
      if (acertosError) throw acertosError;
      if (!acertos || !acertos.length) return { sold: false, count: 0 };
      
      const acertoIds = acertos.map(a => a.id);
      
      // Verificar se o item específico foi vendido
      const { data: sales, error: salesError } = await supabase
        .from('acerto_itens_vendidos')
        .select('id, sale_date')
        .in('acerto_id', acertoIds)
        .eq('inventory_id', inventoryId)
        .order('sale_date', { ascending: false });
      
      if (salesError) throw salesError;
      
      if (!sales || sales.length === 0) {
        return { sold: false, count: 0 };
      }
      
      return { 
        sold: true, 
        count: sales.length,
        lastSoldDate: sales[0].sale_date
      };
    } catch (error) {
      console.error("Erro ao verificar histórico de vendas do item:", error);
      throw error;
    }
  }
}
