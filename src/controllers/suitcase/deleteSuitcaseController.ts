
/**
 * Controlador de Exclusão de Maletas
 * @file Este arquivo controla as operações relacionadas à exclusão de maletas
 */
import { SuitcaseModel } from "@/models/suitcaseModel";
import { supabase } from "@/integrations/supabase/client";

export class DeleteSuitcaseController {
  /**
   * Exclui uma maleta com todos os dados relacionados (acertos, vendas e devolve itens ao estoque)
   * @param suitcaseId ID da maleta a ser excluída
   */
  static async deleteSuitcaseWithCascade(suitcaseId: string): Promise<void> {
    try {
      console.log(`Iniciando exclusão em cascata da maleta: ${suitcaseId}`);
      
      // Inicia uma transação para garantir integridade dos dados
      // Como o Supabase não suporta transações diretamente via JS, usamos várias 
      // operações sequenciais com tratamento de erro
      
      // 1. Obter todos os itens da maleta que ainda estão em posse
      const items = await SuitcaseModel.getSuitcaseItems(suitcaseId);
      const itemsInPossession = items.filter(item => item.status === 'in_possession');
      
      // 2. Devolver os itens em posse para o estoque
      console.log(`Devolvendo ${itemsInPossession.length} itens ao estoque`);
      for (const item of itemsInPossession) {
        await SuitcaseModel.returnItemToInventory(item.id);
      }
      
      // 3. Buscar e excluir todos os acertos relacionados à maleta
      console.log("Excluindo acertos da maleta...");
      const { data: acertos, error: acertosError } = await supabase
        .from('acertos_maleta')
        .select('id')
        .eq('suitcase_id', suitcaseId);
      
      if (acertosError) throw new Error(`Erro ao buscar acertos: ${acertosError.message}`);
      
      // 3.1 Para cada acerto, excluir os itens vendidos
      for (const acerto of acertos || []) {
        const { error: deleteItemsError } = await supabase
          .from('acerto_itens_vendidos')
          .delete()
          .eq('acerto_id', acerto.id);
        
        if (deleteItemsError) throw new Error(`Erro ao excluir itens vendidos: ${deleteItemsError.message}`);
      }
      
      // 3.2 Excluir os acertos
      if (acertos && acertos.length > 0) {
        const { error: deleteAcertosError } = await supabase
          .from('acertos_maleta')
          .delete()
          .eq('suitcase_id', suitcaseId);
        
        if (deleteAcertosError) throw new Error(`Erro ao excluir acertos: ${deleteAcertosError.message}`);
      }
      
      // 4. Excluir as vendas de itens da maleta
      console.log("Excluindo vendas de itens...");
      const { data: suitcaseItems } = await supabase
        .from('suitcase_items')
        .select('id')
        .eq('suitcase_id', suitcaseId);
      
      for (const item of suitcaseItems || []) {
        const { error: deleteSalesError } = await supabase
          .from('suitcase_item_sales')
          .delete()
          .eq('suitcase_item_id', item.id);
        
        if (deleteSalesError) throw new Error(`Erro ao excluir vendas de itens: ${deleteSalesError.message}`);
      }
      
      // 5. Excluir os itens da maleta
      console.log("Excluindo itens da maleta...");
      const { error: deleteItemsError } = await supabase
        .from('suitcase_items')
        .delete()
        .eq('suitcase_id', suitcaseId);
      
      if (deleteItemsError) throw new Error(`Erro ao excluir itens da maleta: ${deleteItemsError.message}`);
      
      // 6. Finalmente, excluir a maleta
      console.log("Excluindo maleta...");
      const { error: deleteSuitcaseError } = await supabase
        .from('suitcases')
        .delete()
        .eq('id', suitcaseId);
      
      if (deleteSuitcaseError) throw new Error(`Erro ao excluir maleta: ${deleteSuitcaseError.message}`);
      
      console.log("Exclusão da maleta completada com sucesso");
    } catch (error) {
      console.error("Erro durante exclusão em cascata da maleta:", error);
      throw error;
    }
  }
}
