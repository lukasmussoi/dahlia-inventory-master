
/**
 * Modelo de Vendas de Itens de Maleta
 * @file Funções para gerenciar as informações de vendas de itens de maleta
 * @relacionamento Utiliza supabase client diretamente
 */
import { supabase } from "@/integrations/supabase/client";

export class ItemSalesModel {
  /**
   * Atualiza informações de venda de um item
   * @param itemId ID do item
   * @param field Campo a ser atualizado (customer_name, payment_method, etc)
   * @param value Novo valor
   * @returns Resultado da operação
   */
  static async updateSaleInfo(itemId: string, field: string, value: string): Promise<{ success: boolean }> {
    try {
      // Atualizar informações de venda
      const { data, error } = await supabase
        .from('suitcase_item_sales')
        .select('id')
        .eq('suitcase_item_id', itemId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error("Erro ao buscar informações de venda:", error);
        throw error;
      }
      
      if (data) {
        // Já existe um registro, atualizar
        const { error: updateError } = await supabase
          .from('suitcase_item_sales')
          .update({ [field]: value })
          .eq('id', data.id);
        
        if (updateError) {
          console.error("Erro ao atualizar informações de venda:", updateError);
          throw updateError;
        }
      } else {
        // Criar novo registro
        const { error: insertError } = await supabase
          .from('suitcase_item_sales')
          .insert({
            suitcase_item_id: itemId,
            [field]: value
          });
        
        if (insertError) {
          console.error("Erro ao inserir informações de venda:", insertError);
          throw insertError;
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error("Erro ao atualizar informações de venda:", error);
      throw error;
    }
  }

  /**
   * Registra várias informações de venda para um item
   * @param itemId ID do item
   * @param saleData Dados de venda
   * @returns Resultado da operação
   */
  static async registerSaleInfo(itemId: string, saleData: {
    customer_name?: string;
    payment_method?: string;
    sale_date?: string;
  }): Promise<{ success: boolean }> {
    try {
      // Verificar se já existe registro para este item
      const { data, error } = await supabase
        .from('suitcase_item_sales')
        .select('id')
        .eq('suitcase_item_id', itemId)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error("Erro ao buscar informações de venda:", error);
        throw error;
      }
      
      if (data) {
        // Já existe um registro, atualizar
        const { error: updateError } = await supabase
          .from('suitcase_item_sales')
          .update(saleData)
          .eq('id', data.id);
        
        if (updateError) {
          console.error("Erro ao atualizar informações de venda:", updateError);
          throw updateError;
        }
      } else {
        // Criar novo registro
        const { error: insertError } = await supabase
          .from('suitcase_item_sales')
          .insert({
            suitcase_item_id: itemId,
            ...saleData
          });
        
        if (insertError) {
          console.error("Erro ao inserir informações de venda:", insertError);
          throw insertError;
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error("Erro ao registrar informações de venda:", error);
      throw error;
    }
  }
}
