
/**
 * Modelo de Estatísticas de Inventário
 * @file Este arquivo contém operações para obter estatísticas do inventário
 * @relacionamento Dependências: BaseInventoryModel para obter dados do inventário
 */

import { supabase } from "@/integrations/supabase/client";
import { BaseInventoryModel } from "./baseModel";

export class InventoryStatsModel {
  /**
   * Obtém estatísticas gerais do inventário
   * @returns Objeto com estatísticas gerais de inventário
   */
  static async getTotalInventory() {
    try {
      console.log("[StatsModel] Obtendo estatísticas do inventário");
      
      // Obter total de itens e valor
      const { data: totals, error: totalsError } = await supabase
        .from('inventory')
        .select('id, name, price, quantity, unit_cost, min_stock, category_id')
        .eq('archived', false);
      
      if (totalsError) throw totalsError;
      
      // Calcular estatísticas básicas
      const totalItems = totals.reduce((sum, item) => sum + item.quantity, 0);
      const totalValue = totals.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const totalCost = totals.reduce((sum, item) => sum + (item.unit_cost * item.quantity), 0);
      
      // Calcular margem média
      const itemsWithMargin = totals.filter(item => item.price > 0 && item.unit_cost > 0);
      let averageMargin = 0;
      
      if (itemsWithMargin.length > 0) {
        const totalMargin = itemsWithMargin.reduce((sum, item) => {
          const margin = (item.price - item.unit_cost) / item.price;
          return sum + margin;
        }, 0);
        averageMargin = totalMargin / itemsWithMargin.length;
      }
      
      // Encontrar itens com estoque baixo
      const lowStockItems = totals.filter(item => item.quantity <= item.min_stock).length;
      const lowStockItemsList = totals
        .filter(item => item.quantity <= item.min_stock * 1.2) // Inclui itens até 20% acima do mínimo
        .map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity, 
          min_stock: item.min_stock
        }));
      
      // Agrupar itens por categoria
      const categoriesMap = new Map();
      for (const item of totals) {
        if (!categoriesMap.has(item.category_id)) {
          categoriesMap.set(item.category_id, {
            id: item.category_id,
            itemCount: 0,
            value: 0
          });
        }
        
        const categoryStats = categoriesMap.get(item.category_id);
        categoryStats.itemCount += item.quantity;
        categoryStats.value += (item.price * item.quantity);
      }
      
      // Obter nomes das categorias
      const categories = await Promise.all(
        Array.from(categoriesMap.entries()).map(async ([categoryId, stats]) => {
          try {
            const { data, error } = await supabase
              .from('inventory_categories')
              .select('name')
              .eq('id', categoryId)
              .single();
            
            if (error) throw error;
            
            return {
              ...stats,
              name: data.name
            };
          } catch (error) {
            console.error(`[StatsModel] Erro ao obter nome da categoria ${categoryId}:`, error);
            return {
              ...stats,
              name: 'Categoria Desconhecida'
            };
          }
        })
      );
      
      // Encontrar categoria com mais itens
      let topCategory = 'N/A';
      if (categories.length > 0) {
        const sortedCategories = [...categories].sort((a, b) => b.itemCount - a.itemCount);
        topCategory = sortedCategories[0].name;
      }
      
      return {
        totalItems,
        totalValue,
        totalCost,
        averageMargin,
        lowStockItems,
        lowStockItemsList,
        categories,
        topCategory
      };
    } catch (error) {
      console.error("[StatsModel] Erro ao obter estatísticas de inventário:", error);
      throw new Error("Não foi possível obter as estatísticas do inventário");
    }
  }
}
