
/**
 * Modelo Base para Itens de Maleta
 * @file Este arquivo contém operações básicas para itens de maleta
 */
import { supabase } from "@/integrations/supabase/client";
import { InventoryItemSuitcaseInfo, SuitcaseItem } from "@/types/suitcase";

export class BaseItemModel {
  static supabase = supabase;

  /**
   * Busca um item específico de uma maleta
   * @param itemId ID do item
   * @returns Detalhes do item
   */
  static async getSuitcaseItemById(itemId: string) {
    try {
      const { data, error } = await supabase
        .from('suitcase_items')
        .select(`
          *,
          product:inventory(id, name, sku, price, unit_cost, photo_url)
        `)
        .eq('id', itemId)
        .single();

      if (error) throw error;
      
      // Ensure product is properly formatted
      return this.formatSuitcaseItemProduct(data);
    } catch (error) {
      console.error("Erro ao buscar item da maleta:", error);
      return null;
    }
  }

  /**
   * Busca todos os itens de uma maleta
   * @param suitcaseId ID da maleta
   * @returns Lista de itens
   */
  static async getSuitcaseItems(suitcaseId: string): Promise<SuitcaseItem[]> {
    try {
      const { data, error } = await supabase
        .from('suitcase_items')
        .select(`
          *,
          product:inventory(id, name, sku, price, unit_cost, photo_url)
        `)
        .eq('suitcase_id', suitcaseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Ensure all products are properly formatted
      return (data || []).map(item => this.formatSuitcaseItemProduct(item));
    } catch (error) {
      console.error("Erro ao buscar itens da maleta:", error);
      return [];
    }
  }

  /**
   * Busca informações sobre qual maleta contém um determinado item do inventário
   * @param inventoryId ID do item no inventário
   * @returns Informações da maleta onde o item está
   */
  static async getItemSuitcaseInfo(inventoryId: string): Promise<InventoryItemSuitcaseInfo | null> {
    try {
      if (!inventoryId) return null;

      // Buscar em qual maleta o item está (apenas itens com status 'in_possession')
      const { data, error } = await supabase
        .from('suitcase_items')
        .select(`
          suitcase_id,
          suitcase:suitcases(code, seller:resellers(name))
        `)
        .eq('inventory_id', inventoryId)
        .eq('status', 'in_possession')
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        suitcase_id: data.suitcase_id,
        suitcase_code: data.suitcase?.code || 'Código não disponível',
        seller_name: data.suitcase?.seller?.name || 'Revendedora não informada'
      };
    } catch (error) {
      console.error("Erro ao buscar informações do item na maleta:", error);
      return null;
    }
  }

  /**
   * Formata os dados do produto para garantir compatibilidade com o tipo SuitcaseItem
   * @param item Item da maleta com produto potencialmente inválido
   * @returns Item da maleta com produto formatado corretamente
   */
  static formatSuitcaseItemProduct(item: any): SuitcaseItem {
    // Se o produto for um erro de seleção ou não existir
    if (!item.product || item.product.error) {
      // Criar um produto vazio compatível com o tipo esperado
      item.product = {
        id: item.inventory_id || '',
        name: 'Produto não encontrado',
        sku: 'N/A',
        price: 0,
        unit_cost: 0,
        photo_url: ''
      };
    }
    
    return item as SuitcaseItem;
  }
}
