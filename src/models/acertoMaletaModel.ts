
/**
 * Modelo de Acertos de Maleta
 * @file Este arquivo contém as operações de banco de dados para os acertos de maleta
 */
import { supabase } from "@/integrations/supabase/client";
import { Acerto, AcertoStatus, SuitcaseItem } from "@/types/suitcase";
import { Json } from "@/integrations/supabase/types";
import { SuitcaseItemModel } from "./suitcase/suitcaseItemModel";

export class AcertoMaletaModel {
  /**
   * Cria um novo acerto de maleta
   * @param acertoData Dados do acerto
   * @returns Acerto criado
   */
  static async createAcerto(acertoData: {
    suitcase_id: string;
    seller_id: string;
    settlement_date?: string;
    status?: AcertoStatus;
    total_sales?: number;
    commission_amount?: number;
    next_settlement_date?: string | null;
    receipt_url?: string | null;
    restock_suggestions?: Json | null;
  }): Promise<Acerto> {
    const { data, error } = await supabase
      .from('acertos_maleta')
      .insert(acertoData)
      .select()
      .single();
    
    if (error) {
      console.error("Erro ao criar acerto:", error);
      throw error;
    }
    
    return data;
  }

  /**
   * Processa os itens de um acerto (presentes e vendidos)
   * @param acertoId ID do acerto
   * @param suitcaseId ID da maleta
   * @param itemsPresent IDs dos itens presentes na maleta
   * @param itemsSold IDs dos itens vendidos
   */
  static async processAcertoItems(
    acertoId: string,
    suitcaseId: string,
    itemsPresent: string[],
    itemsSold: string[]
  ): Promise<void> {
    try {
      console.log(`Processando ${itemsPresent.length} itens presentes e ${itemsSold.length} itens vendidos`);
      
      // 1. Processar itens presentes (retornar ao estoque)
      for (const itemId of itemsPresent) {
        console.log(`Retornando item ${itemId} ao estoque`);
        try {
          // Chamar função melhorada para garantir que o item seja devolvido ao estoque E removido da maleta
          await SuitcaseItemModel.returnItemToInventory(itemId);
        } catch (error) {
          console.error(`Erro ao retornar item ${itemId} ao estoque:`, error);
          // Continuar processando outros itens mesmo se ocorrer um erro
        }
      }
      
      // 2. Processar itens vendidos (registrar vendas)
      for (const itemId of itemsSold) {
        console.log(`Registrando venda do item ${itemId}`);
        
        try {
          // Buscar informações do item
          const item = await SuitcaseItemModel.getSuitcaseItemById(itemId);
          if (!item) {
            console.warn(`Item ${itemId} não encontrado, pulando...`);
            continue;
          }
          
          // Atualizar status do item para vendido
          await SuitcaseItemModel.updateSuitcaseItemStatus(itemId, 'sold');
          
          // Registrar na tabela de itens vendidos em acertos
          const { error } = await supabase
            .from('acerto_itens_vendidos')
            .insert({
              acerto_id: acertoId,
              suitcase_item_id: itemId,
              inventory_id: item.inventory_id,
              price: item.product?.price || 0,
              unit_cost: item.product?.unit_cost || 0
            });
          
          if (error) {
            console.error(`Erro ao registrar venda do item ${itemId}:`, error);
            throw error;
          }
          
          // CORREÇÃO: Remover explicitamente o item da maleta após registrar como vendido
          console.log(`Removendo item vendido ${itemId} da maleta...`);
          const { error: deleteError } = await supabase
            .from('suitcase_items')
            .delete()
            .eq('id', itemId);
          
          if (deleteError) {
            console.error(`Erro ao remover item vendido ${itemId} da maleta:`, deleteError);
            console.error(`Detalhes do erro:`, JSON.stringify(deleteError));
            
            // Verificar se o erro é devido a uma constraint de chave estrangeira
            if (deleteError.message?.includes('foreign key constraint')) {
              console.log(`Detectada constraint de chave estrangeira. Tentando abordagem alternativa...`);
              
              // Primeiro verificar se o item já foi registrado como vendido
              await supabase
                .from('suitcase_items')
                .update({ status: 'sold' })
                .eq('id', itemId);
                
              // Depois verificar se há registros na tabela acerto_itens_vendidos que dependem deste item
              const { data: dependencies } = await supabase
                .from('acerto_itens_vendidos')
                .select('id')
                .eq('suitcase_item_id', itemId);
                
              if (dependencies && dependencies.length > 0) {
                console.log(`Item ${itemId} tem ${dependencies.length} dependências em acerto_itens_vendidos`);
                // Se houver, podemos atualizar a referência ou criar uma solução alternativa
                // Por exemplo, podemos marcar o item como 'deleted' em vez de removê-lo
              }
            }
            
            throw deleteError;
          }
          
          console.log(`Item vendido ${itemId} registrado e removido da maleta com sucesso`);
        } catch (error) {
          console.error(`Erro ao processar item vendido ${itemId}:`, error);
          // Continuar processando outros itens mesmo se ocorrer um erro
        }
      }
      
      // 3. Verificação adicional: buscar todos os itens desta maleta para garantir que todos foram processados
      const { data: remainingItems, error: checkError } = await supabase
        .from('suitcase_items')
        .select('id, status')
        .eq('suitcase_id', suitcaseId);
      
      if (checkError) {
        console.error(`Erro ao verificar itens restantes na maleta ${suitcaseId}:`, checkError);
      } else if (remainingItems && remainingItems.length > 0) {
        console.warn(`Foram encontrados ${remainingItems.length} itens ainda na maleta após o processamento. Removendo-os...`);
        
        // Classificar itens restantes por status
        const soldItems = remainingItems.filter(item => item.status === 'sold').map(item => item.id);
        const otherItems = remainingItems.filter(item => item.status !== 'sold').map(item => item.id);
        
        // Processar itens vendidos que ainda restam
        if (soldItems.length > 0) {
          console.log(`Removendo ${soldItems.length} itens vendidos que ainda estão na maleta...`);
          
          // Para cada item vendido restante, registrar na tabela de itens vendidos em acertos se ainda não foi registrado
          for (const itemId of soldItems) {
            // Verificar se o item já está registrado
            const { data: existingRecord } = await supabase
              .from('acerto_itens_vendidos')
              .select('id')
              .eq('suitcase_item_id', itemId)
              .eq('acerto_id', acertoId);
            
            if (!existingRecord || existingRecord.length === 0) {
              // Se não estiver registrado, buscar informações do item e registrar
              const item = await SuitcaseItemModel.getSuitcaseItemById(itemId);
              if (item) {
                await supabase
                  .from('acerto_itens_vendidos')
                  .insert({
                    acerto_id: acertoId,
                    suitcase_item_id: itemId,
                    inventory_id: item.inventory_id,
                    price: item.product?.price || 0,
                    unit_cost: item.product?.unit_cost || 0
                  });
              }
            }
          }
          
          // Depois, remover todos os itens vendidos
          const { error: removeError } = await supabase
            .from('suitcase_items')
            .delete()
            .in('id', soldItems);
          
          if (removeError) {
            console.error(`Erro ao remover itens vendidos restantes da maleta:`, removeError);
          } else {
            console.log(`${soldItems.length} itens vendidos restantes removidos da maleta com sucesso`);
          }
        }
        
        // Processar outros itens que ainda restam (devolver ao estoque)
        if (otherItems.length > 0) {
          console.log(`Devolvendo ${otherItems.length} outros itens restantes ao estoque...`);
          
          for (const itemId of otherItems) {
            try {
              await SuitcaseItemModel.returnItemToInventory(itemId);
            } catch (error) {
              console.error(`Erro ao devolver item ${itemId} ao estoque:`, error);
            }
          }
        }
      } else {
        console.log(`Nenhum item restante na maleta ${suitcaseId}. Processamento concluído com sucesso.`);
      }
      
    } catch (error) {
      console.error("Erro ao processar itens do acerto:", error);
      throw error;
    }
  }
  
  /**
   * Exclui um acerto e todos os seus itens vendidos
   * @param acertoId ID do acerto a ser excluído
   */
  static async deleteAcerto(acertoId: string): Promise<void> {
    try {
      console.log(`Excluindo acerto ${acertoId} e seus itens vendidos`);
      
      // 1. Excluir os itens vendidos no acerto
      const { error: deleteItemsError } = await supabase
        .from('acerto_itens_vendidos')
        .delete()
        .eq('acerto_id', acertoId);
      
      if (deleteItemsError) {
        console.error(`Erro ao excluir itens vendidos do acerto ${acertoId}:`, deleteItemsError);
        throw deleteItemsError;
      }
      
      // 2. Excluir o acerto
      const { error: deleteAcertoError } = await supabase
        .from('acertos_maleta')
        .delete()
        .eq('id', acertoId);
      
      if (deleteAcertoError) {
        console.error(`Erro ao excluir acerto ${acertoId}:`, deleteAcertoError);
        throw deleteAcertoError;
      }
      
      console.log(`Acerto ${acertoId} excluído com sucesso`);
    } catch (error) {
      console.error(`Erro ao excluir acerto ${acertoId}:`, error);
      throw error;
    }
  }
  
  /**
   * Exclui todos os acertos de uma maleta e seus itens vendidos
   * @param suitcaseId ID da maleta
   */
  static async deleteAllAcertosBySuitcaseId(suitcaseId: string): Promise<void> {
    try {
      // 1. Buscar todos os acertos da maleta
      const { data: acertos, error: fetchError } = await supabase
        .from('acertos_maleta')
        .select('id')
        .eq('suitcase_id', suitcaseId);
      
      if (fetchError) throw fetchError;
      
      console.log(`Encontrados ${acertos?.length || 0} acertos para a maleta ${suitcaseId}`);
      
      if (!acertos || acertos.length === 0) {
        console.log(`Nenhum acerto para excluir na maleta ${suitcaseId}`);
        return;
      }
      
      // 2. Para cada acerto, excluir os itens vendidos relacionados
      for (const acerto of acertos) {
        // Excluir os itens vendidos do acerto
        const { error: itemsDeleteError } = await supabase
          .from('acerto_itens_vendidos')
          .delete()
          .eq('acerto_id', acerto.id);
        
        if (itemsDeleteError) {
          console.error(`Erro ao excluir itens vendidos do acerto ${acerto.id}:`, itemsDeleteError);
          throw itemsDeleteError;
        }
        
        console.log(`Itens vendidos do acerto ${acerto.id} excluídos com sucesso`);
      }
      
      // 3. Excluir os acertos propriamente ditos
      const { error: acertosDeleteError } = await supabase
        .from('acertos_maleta')
        .delete()
        .eq('suitcase_id', suitcaseId);
      
      if (acertosDeleteError) {
        console.error(`Erro ao excluir acertos da maleta ${suitcaseId}:`, acertosDeleteError);
        throw acertosDeleteError;
      }
      
      console.log(`Acertos da maleta ${suitcaseId} excluídos com sucesso`);
    } catch (error) {
      console.error(`Erro ao excluir acertos da maleta ${suitcaseId}:`, error);
      throw error;
    }
  }
}
