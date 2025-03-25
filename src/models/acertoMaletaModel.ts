
/**
 * Modelo de Acertos de Maleta
 * @file Este arquivo contém as operações de banco de dados para os acertos de maleta
 */
import { supabase } from "@/integrations/supabase/client";
import { Acerto, SuitcaseItem } from "@/types/suitcase";
import { SuitcaseModel } from "./suitcaseModel";

export class AcertoMaletaModel {
  /**
   * Cria um novo acerto de maleta
   * @param acertoData Dados do acerto
   * @returns Acerto criado
   */
  static async createAcerto(acertoData: Partial<Acerto>): Promise<Acerto> {
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
   * @param itemsPresent Itens presentes na maleta
   * @param itemsSold Itens vendidos
   */
  static async processAcertoItems(
    acertoId: string,
    suitcaseId: string,
    itemsPresent: SuitcaseItem[],
    itemsSold: SuitcaseItem[]
  ): Promise<void> {
    try {
      console.log(`Processando ${itemsPresent.length} itens presentes e ${itemsSold.length} itens vendidos`);
      
      // 1. Processar itens presentes (retornar ao estoque)
      for (const item of itemsPresent) {
        console.log(`Retornando item ${item.id} ao estoque`);
        await SuitcaseModel.returnItemToInventory(item.id);
      }
      
      // 2. Processar itens vendidos (registrar vendas)
      for (const item of itemsSold) {
        console.log(`Registrando venda do item ${item.id}`);
        
        // Atualizar status do item para vendido
        await SuitcaseModel.updateSuitcaseItemStatus(item.id, 'sold');
        
        // Registrar na tabela de itens vendidos em acertos
        const { error } = await supabase
          .from('acerto_itens_vendidos')
          .insert({
            acerto_id: acertoId,
            suitcase_item_id: item.id,
            inventory_id: item.inventory_id,
            price: item.product?.price || 0,
            unit_cost: item.product?.unit_cost || 0
          });
        
        if (error) {
          console.error(`Erro ao registrar venda do item ${item.id}:`, error);
          throw error;
        }
      }
      
      console.log(`Processamento de itens concluído para o acerto ${acertoId}`);
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
   * Exclui todos os acertos de uma maleta
   * @param suitcaseId ID da maleta
   */
  static async deleteAllAcertosBySuitcaseId(suitcaseId: string): Promise<void> {
    try {
      console.log(`Buscando acertos da maleta ${suitcaseId} para exclusão`);
      
      // 1. Buscar todos os acertos da maleta
      const { data: acertos, error: fetchError } = await supabase
        .from('acertos_maleta')
        .select('id')
        .eq('suitcase_id', suitcaseId);
      
      if (fetchError) {
        console.error(`Erro ao buscar acertos da maleta ${suitcaseId}:`, fetchError);
        throw fetchError;
      }
      
      if (!acertos || acertos.length === 0) {
        console.log(`Nenhum acerto encontrado para a maleta ${suitcaseId}`);
        return;
      }
      
      console.log(`Encontrados ${acertos.length} acertos para exclusão`);
      
      // 2. Excluir cada acerto
      for (const acerto of acertos) {
        await this.deleteAcerto(acerto.id);
      }
      
      console.log(`Todos os acertos da maleta ${suitcaseId} foram excluídos com sucesso`);
    } catch (error) {
      console.error(`Erro ao excluir acertos da maleta ${suitcaseId}:`, error);
      throw error;
    }
  }
}
