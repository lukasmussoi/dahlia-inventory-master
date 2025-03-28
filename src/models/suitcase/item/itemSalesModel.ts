
/**
 * Modelo de Vendas de Itens de Maleta
 * @file Este arquivo contém operações relacionadas às vendas de itens de maletas
 */
import { supabase } from "@/integrations/supabase/client";
import { SuitcaseItemSale } from "@/types/suitcase";

export class ItemSalesModel {
  /**
   * Busca informações de venda de um item de maleta
   * @param suitcaseItemId ID do item de maleta
   * @returns Informações de venda
   */
  static async getSuitcaseItemSales(suitcaseItemId: string): Promise<SuitcaseItemSale[]> {
    try {
      const { data, error } = await supabase
        .from('suitcase_item_sales')
        .select('*')
        .eq('suitcase_item_id', suitcaseItemId);
      
      if (error) throw error;
      
      return data as SuitcaseItemSale[];
    } catch (error) {
      console.error("Erro ao buscar informações de venda do item:", error);
      return [];
    }
  }

  /**
   * Atualiza informações de venda de um item
   * @param suitcaseItemId ID do item de maleta
   * @param field Campo a ser atualizado
   * @param value Novo valor
   * @returns true se atualizado com sucesso
   */
  static async updateSaleInfo(suitcaseItemId: string, field: string, value: string): Promise<boolean> {
    try {
      // Verificar se já existe registro de venda
      const { data: saleData, error: saleError } = await supabase
        .from('suitcase_item_sales')
        .select('id')
        .eq('suitcase_item_id', suitcaseItemId)
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
            suitcase_item_id: suitcaseItemId,
            [field]: value
          });
        
        if (error) throw error;
      }
      
      return true;
    } catch (error) {
      console.error("Erro ao atualizar informações de venda:", error);
      return false;
    }
  }
}
