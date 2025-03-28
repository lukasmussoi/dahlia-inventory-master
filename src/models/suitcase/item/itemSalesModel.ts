
/**
 * Modelo de Vendas de Itens de Maleta
 * @file Este arquivo contém operações relacionadas a vendas de itens de maleta
 */
import { supabase } from "@/integrations/supabase/client";

export class ItemSalesModel {
  /**
   * Busca informações de venda de um item de maleta
   * @param suitcaseItemId ID do item da maleta
   * @returns Informações de venda
   */
  static async getSuitcaseItemSales(suitcaseItemId: string) {
    try {
      const { data, error } = await supabase
        .from('suitcase_item_sales')
        .select('*')
        .eq('suitcase_item_id', suitcaseItemId)
        .maybeSingle();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error("Erro ao buscar informações de venda:", error);
      return null;
    }
  }
  
  /**
   * Atualiza informações de venda
   * @param itemId ID do item
   * @param field Campo a atualizar
   * @param value Novo valor
   * @returns true se atualizado com sucesso
   */
  static async updateSaleInfo(itemId: string, field: string, value: string) {
    try {
      // Verificar se já existe registro de venda
      const { data: saleData, error: saleError } = await supabase
        .from('suitcase_item_sales')
        .select('id')
        .eq('suitcase_item_id', itemId)
        .maybeSingle();
      
      if (saleError) throw saleError;
      
      // Se existe, atualizar
      if (saleData) {
        const { error } = await supabase
          .from('suitcase_item_sales')
          .update({ [field]: value })
          .eq('id', saleData.id);
        
        if (error) throw error;
      } 
      // Se não existe, criar
      else {
        const { error } = await supabase
          .from('suitcase_item_sales')
          .insert({ 
            suitcase_item_id: itemId,
            [field]: value
          });
        
        if (error) throw error;
      }
      
      return true;
    } catch (error) {
      console.error("Erro ao atualizar informações de venda:", error);
      throw error;
    }
  }
}
