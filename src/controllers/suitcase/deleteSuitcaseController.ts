
/**
 * Controlador de Exclusão de Maletas
 * @file Este arquivo controla as operações relacionadas à exclusão de maletas,
 * tratando corretamente os relacionamentos com acertos, itens e estoque
 */
import { supabase } from "@/integrations/supabase/client";
import { SuitcaseModel } from "@/models/suitcaseModel";
import { AcertoMaletaModel } from "@/models/acertoMaletaModel";

export const DeleteSuitcaseController = {
  /**
   * Exclui uma maleta e todos os seus relacionamentos (acertos, itens) em cascata
   * @param suitcaseId ID da maleta a ser excluída
   * @returns Objeto com status de sucesso da operação
   */
  async deleteSuitcaseWithCascade(suitcaseId: string) {
    try {
      console.log(`Iniciando processo de exclusão da maleta ${suitcaseId}`);
      
      // Iniciar uma transação para garantir consistência
      // Primeiro, buscar itens da maleta
      const items = await SuitcaseModel.getSuitcaseItems(suitcaseId);
      console.log(`Encontrados ${items.length} itens na maleta`);
      
      // Verificar se o usuário é administrador
      const { data: isAdmin, error: adminCheckError } = await supabase.rpc('is_admin');
      
      if (adminCheckError) {
        console.error("Erro ao verificar permissões de administrador:", adminCheckError);
        throw new Error("Erro ao verificar permissões de administrador");
      }
      
      if (!isAdmin) {
        throw new Error("Apenas administradores podem excluir maletas");
      }
      
      // Buscar acertos relacionados à maleta
      const { data: acertos, error: acertosError } = await supabase
        .from('acertos_maleta')
        .select('id')
        .eq('suitcase_id', suitcaseId);
      
      if (acertosError) {
        console.error("Erro ao buscar acertos da maleta:", acertosError);
        throw acertosError;
      }
      
      console.log(`Encontrados ${acertos?.length || 0} acertos relacionados à maleta`);
      
      // Retornar cada item ao estoque
      for (const item of items) {
        await SuitcaseModel.returnItemToInventory(item.id);
        console.log(`Item ${item.id} retornado ao estoque`);
      }
      
      // Excluir os acertos relacionados à maleta
      if (acertos && acertos.length > 0) {
        const acertoIds = acertos.map(acerto => acerto.id);
        
        // Excluir vendas relacionadas aos acertos
        for (const acertoId of acertoIds) {
          try {
            // Excluir itens vendidos associados ao acerto
            const { error: vendaDeleteError } = await supabase
              .from('acerto_itens_vendidos')
              .delete()
              .eq('acerto_id', acertoId);
            
            if (vendaDeleteError) {
              console.error(`Erro ao excluir vendas do acerto ${acertoId}:`, vendaDeleteError);
              throw vendaDeleteError;
            }
            
            console.log(`Vendas do acerto ${acertoId} excluídas com sucesso`);
          } catch (error) {
            console.error(`Erro ao processar exclusão de vendas do acerto ${acertoId}:`, error);
            throw error;
          }
        }
        
        // Excluir os acertos
        const { error: acertoDeleteError } = await supabase
          .from('acertos_maleta')
          .delete()
          .in('id', acertoIds);
        
        if (acertoDeleteError) {
          console.error("Erro ao excluir acertos da maleta:", acertoDeleteError);
          throw acertoDeleteError;
        }
        
        console.log(`Acertos da maleta excluídos com sucesso: ${acertoIds.join(', ')}`);
      }
      
      // Verificar se há vendas diretamente relacionadas à maleta (se existir essa relação)
      const { error: itemSalesError } = await supabase
        .from('suitcase_item_sales')
        .delete()
        .in('suitcase_item_id', items.map(item => item.id));
      
      if (itemSalesError) {
        console.error("Erro ao excluir vendas da maleta:", itemSalesError);
        throw itemSalesError;
      }
      
      // Excluir itens da maleta
      const { error: itemsDeleteError } = await supabase
        .from('suitcase_items')
        .delete()
        .eq('suitcase_id', suitcaseId);
      
      if (itemsDeleteError) {
        console.error("Erro ao excluir itens da maleta:", itemsDeleteError);
        throw itemsDeleteError;
      }
      
      console.log(`Itens da maleta ${suitcaseId} excluídos com sucesso`);
      
      // Finalmente, excluir a maleta
      await SuitcaseModel.deleteSuitcase(suitcaseId);
      console.log(`Maleta ${suitcaseId} excluída com sucesso`);
      
      return { success: true };
    } catch (error) {
      console.error("Erro ao excluir maleta com cascade:", error);
      throw error;
    }
  }
};
