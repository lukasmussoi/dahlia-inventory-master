
/**
 * Modelo de Acertos de Maleta
 * @file Este arquivo contém as funções para gerenciar acertos de maletas,
 * incluindo a criação, exclusão e manipulação dos itens durante acertos
 */
import { supabase } from "@/integrations/supabase/client";
import { Acerto, SuitcaseItem } from "@/types/suitcase";
import { SuitcaseModel } from "./suitcaseModel";

export class AcertoMaletaModel {
  /**
   * Cria um novo acerto de maleta
   * @param data Dados do acerto a ser criado
   * @returns Acerto criado
   */
  static async createAcerto(data: any): Promise<Acerto> {
    try {
      // Iniciar transação
      console.log("Iniciando criação de acerto para maleta:", data.suitcase_id);
      
      // 1. Inserir o acerto na tabela
      const { data: acerto, error } = await supabase
        .from('acertos_maleta')
        .insert(data)
        .select()
        .single();
      
      if (error) {
        console.error("Erro ao criar acerto:", error);
        throw error;
      }
      
      return acerto;
    } catch (error) {
      console.error("Erro no modelo ao criar acerto:", error);
      throw error;
    }
  }
  
  /**
   * Processa os itens da maleta durante um acerto
   * @param acertoId ID do acerto
   * @param suitcaseId ID da maleta
   * @param itemsPresent Array de IDs dos itens marcados como presentes no acerto
   * @param itemsSold Array de IDs e informações dos itens vendidos
   */
  static async processAcertoItems(
    acertoId: string,
    suitcaseId: string, 
    itemsPresent: string[], 
    itemsSold: Array<{
      suitcase_item_id: string;
      inventory_id: string;
      price: number;
      customer_name?: string;
      payment_method?: string;
    }>
  ): Promise<void> {
    try {
      console.log(`Processando itens para acerto ${acertoId} da maleta ${suitcaseId}`);
      console.log(`Itens presentes: ${itemsPresent.length}, Itens vendidos: ${itemsSold.length}`);
      
      // Buscar todos os itens da maleta
      const { data: allItems, error: itemsError } = await supabase
        .from('suitcase_items')
        .select('*')
        .eq('suitcase_id', suitcaseId)
        .eq('status', 'in_possession');
      
      if (itemsError) {
        console.error("Erro ao buscar itens da maleta:", itemsError);
        throw itemsError;
      }
      
      const allItemIds = allItems?.map(item => item.id) || [];
      console.log(`Total de itens na maleta: ${allItemIds.length}`);
      
      // 1. Processar itens presentes (devolver ao estoque)
      for (const itemId of itemsPresent) {
        try {
          console.log(`Devolvendo item ${itemId} ao estoque`);
          await SuitcaseModel.returnItemToInventory(itemId);
        } catch (error) {
          console.error(`Erro ao devolver item ${itemId} ao estoque:`, error);
          throw error;
        }
      }
      
      // 2. Processar itens vendidos
      for (const soldItem of itemsSold) {
        try {
          console.log(`Registrando venda do item ${soldItem.suitcase_item_id}`);
          
          // Marcar item como vendido
          const { error: updateError } = await supabase
            .from('suitcase_items')
            .update({ status: 'sold' })
            .eq('id', soldItem.suitcase_item_id);
          
          if (updateError) {
            console.error(`Erro ao atualizar status do item ${soldItem.suitcase_item_id}:`, updateError);
            throw updateError;
          }
          
          // Registrar a venda no acerto
          const { error: insertError } = await supabase
            .from('acerto_itens_vendidos')
            .insert({
              acerto_id: acertoId,
              suitcase_item_id: soldItem.suitcase_item_id,
              inventory_id: soldItem.inventory_id,
              price: soldItem.price,
              customer_name: soldItem.customer_name,
              payment_method: soldItem.payment_method,
              sale_date: new Date().toISOString()
            });
          
          if (insertError) {
            console.error(`Erro ao registrar venda do item ${soldItem.suitcase_item_id}:`, insertError);
            throw insertError;
          }
        } catch (error) {
          console.error(`Erro ao processar item vendido ${soldItem.suitcase_item_id}:`, error);
          throw error;
        }
      }
      
      // 3. Verificar itens não processados (nem vendidos nem presentes)
      const processedItemIds = [...itemsPresent, ...itemsSold.map(item => item.suitcase_item_id)];
      const unprocessedItemIds = allItemIds.filter(id => !processedItemIds.includes(id));
      
      if (unprocessedItemIds.length > 0) {
        console.log(`${unprocessedItemIds.length} itens não foram processados. Considerando como vendidos.`);
        
        for (const itemId of unprocessedItemIds) {
          try {
            // Buscar informações do item
            const { data: itemData, error: itemError } = await supabase
              .from('suitcase_items')
              .select(`
                *,
                product:inventory_id (id, price)
              `)
              .eq('id', itemId)
              .single();
            
            if (itemError) {
              console.error(`Erro ao buscar informações do item ${itemId}:`, itemError);
              throw itemError;
            }
            
            if (!itemData) {
              console.error(`Item ${itemId} não encontrado.`);
              continue;
            }
            
            // Marcar item como vendido
            const { error: updateError } = await supabase
              .from('suitcase_items')
              .update({ status: 'sold' })
              .eq('id', itemId);
            
            if (updateError) {
              console.error(`Erro ao atualizar status do item ${itemId}:`, updateError);
              throw updateError;
            }
            
            // Registrar a venda no acerto
            const { error: insertError } = await supabase
              .from('acerto_itens_vendidos')
              .insert({
                acerto_id: acertoId,
                suitcase_item_id: itemId,
                inventory_id: itemData.inventory_id,
                price: itemData.product?.price || 0,
                customer_name: 'Não informado',
                payment_method: 'Não informado',
                sale_date: new Date().toISOString()
              });
            
            if (insertError) {
              console.error(`Erro ao registrar venda automática do item ${itemId}:`, insertError);
              throw insertError;
            }
          } catch (error) {
            console.error(`Erro ao processar item não verificado ${itemId}:`, error);
            throw error;
          }
        }
      }
      
      console.log(`Processamento de itens do acerto ${acertoId} concluído com sucesso.`);
    } catch (error) {
      console.error("Erro ao processar itens do acerto:", error);
      throw error;
    }
  }
  
  /**
   * Exclui um acerto de maleta
   * @param acertoId ID do acerto a ser excluído
   * @returns Status de sucesso da operação
   */
  static async deleteAcerto(acertoId: string): Promise<boolean> {
    try {
      console.log(`Iniciando exclusão do acerto ${acertoId}`);
      
      // 1. Excluir itens vendidos associados ao acerto
      const { error: itemsDeleteError } = await supabase
        .from('acerto_itens_vendidos')
        .delete()
        .eq('acerto_id', acertoId);
      
      if (itemsDeleteError) {
        console.error(`Erro ao excluir itens vendidos do acerto ${acertoId}:`, itemsDeleteError);
        throw itemsDeleteError;
      }
      
      // 2. Excluir o acerto
      const { error: acertoDeleteError } = await supabase
        .from('acertos_maleta')
        .delete()
        .eq('id', acertoId);
      
      if (acertoDeleteError) {
        console.error(`Erro ao excluir acerto ${acertoId}:`, acertoDeleteError);
        throw acertoDeleteError;
      }
      
      console.log(`Acerto ${acertoId} excluído com sucesso`);
      return true;
    } catch (error) {
      console.error(`Erro ao excluir acerto ${acertoId}:`, error);
      throw error;
    }
  }
  
  /**
   * Busca os detalhes de um acerto pelo ID
   * @param acertoId ID do acerto
   * @returns Detalhes do acerto
   */
  static async getAcertoById(acertoId: string): Promise<Acerto | null> {
    try {
      const { data, error } = await supabase
        .from('acertos_maleta')
        .select(`
          *,
          suitcase:suitcases(*, seller:resellers(*)),
          seller:resellers(*)
        `)
        .eq('id', acertoId)
        .single();
      
      if (error) {
        console.error(`Erro ao buscar acerto ${acertoId}:`, error);
        throw error;
      }
      
      if (!data) return null;
      
      const { data: itemsVendidos, error: itemsError } = await supabase
        .from('acerto_itens_vendidos')
        .select(`
          *,
          product:inventory(id, name, sku, price, photo_url:inventory_photos(photo_url))
        `)
        .eq('acerto_id', acertoId);
      
      if (itemsError) {
        console.error(`Erro ao buscar itens vendidos do acerto ${acertoId}:`, itemsError);
        throw itemsError;
      }
      
      return {
        ...data,
        items_vendidos: itemsVendidos || []
      };
    } catch (error) {
      console.error(`Erro ao buscar acerto ${acertoId}:`, error);
      throw error;
    }
  }
}
