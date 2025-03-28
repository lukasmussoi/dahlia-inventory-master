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
   * Helper function to format product data
   */
  private static formatProductData(product: any) {
    // If product doesn't exist or has error, create a default product
    if (!product || product.error) {
      return {
        id: '',
        name: 'Produto não encontrado',
        sku: 'N/A',
        price: 0,
        unit_cost: 0,
        photo_url: ''
      };
    }
    return product;
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
      
      // Manter um registro dos itens já processados para evitar duplicação
      const processedItems = new Set<string>();
      
      // 1. Processar itens vendidos (registrar vendas)
      for (const itemId of itemsSold) {
        // Verificar se o item já foi processado
        if (processedItems.has(itemId)) {
          console.log(`Item vendido ${itemId} já foi processado anteriormente, ignorando para evitar duplicação.`);
          continue;
        }
        
        console.log(`Registrando venda do item ${itemId}`);
        
        try {
          // Buscar informações do item
          const item = await SuitcaseItemModel.getSuitcaseItemById(itemId);
          if (!item) {
            console.warn(`Item ${itemId} não encontrado, pulando...`);
            continue;
          }
          
          // Verificar se o item já está com status de vendido
          if (item.status === 'sold') {
            console.log(`Item ${itemId} já está marcado como vendido, ignorando processamento duplicado.`);
            processedItems.add(itemId);
            continue;
          }
          
          // Atualizar status do item para vendido
          await SuitcaseItemModel.updateSuitcaseItemStatus(itemId, 'sold');
          
          // Verificar se o item já foi registrado como vendido para este acerto
          const { data: existingVendido, error: checkExistingError } = await supabase
            .from('acerto_itens_vendidos')
            .select('id')
            .eq('acerto_id', acertoId)
            .eq('suitcase_item_id', itemId);
          
          if (checkExistingError) {
            console.error(`Erro ao verificar registros existentes para o item ${itemId}:`, checkExistingError);
          }
          
          // Só registrar se ainda não existir um registro
          if (!existingVendido || existingVendido.length === 0) {
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
          } else {
            console.log(`Item ${itemId} já registrado como vendido para o acerto ${acertoId}, ignorando duplicação.`);
          }
          
          // Marcar o item como processado
          processedItems.add(itemId);
        } catch (error) {
          console.error(`Erro ao processar item vendido ${itemId}:`, error);
          // Continuar processando outros itens mesmo se ocorrer um erro
        }
      }
      
      // 2. Processar itens presentes (retornar ao estoque)
      for (const itemId of itemsPresent) {
        // Verificar se o item já foi processado
        if (processedItems.has(itemId)) {
          console.log(`Item ${itemId} já foi processado anteriormente, ignorando para evitar duplicação.`);
          continue;
        }
        
        console.log(`Retornando item ${itemId} ao estoque`);
        try {
          // Buscar informações do item para verificar seu status atual
          const item = await SuitcaseItemModel.getSuitcaseItemById(itemId);
          if (!item) {
            console.warn(`Item ${itemId} não encontrado, pulando...`);
            continue;
          }
          
          // Verificar se o item já foi devolvido ao estoque
          if (item.status === 'returned') {
            console.log(`Item ${itemId} já está com status 'returned', ignorando processamento duplicado.`);
            processedItems.add(itemId);
            continue;
          }
          
          // Chamar função melhorada para garantir que o item seja devolvido ao estoque
          await SuitcaseItemModel.returnItemToInventory(itemId);
          
          // Marcar o item como processado
          processedItems.add(itemId);
        } catch (error) {
          console.error(`Erro ao retornar item ${itemId} ao estoque:`, error);
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
        // Apenas verificar e logar, não processar automaticamente para evitar operações não solicitadas
        console.log(`Foram encontrados ${remainingItems.length} itens ainda na maleta após o processamento.`);
        console.log(`Status dos itens restantes:`, remainingItems.map(item => ({ id: item.id, status: item.status })));
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
