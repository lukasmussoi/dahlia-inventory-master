
/**
 * Controlador de Exclusão de Maletas
 * @file Este arquivo contém as operações para excluir maletas do sistema,
 * lidando com dependências como itens, acertos, vendas e outros registros relacionados
 */
import { OriginalSuitcaseModel as SuitcaseModel } from "@/models/suitcase";
import { SuitcaseItemModel } from "@/models/suitcase";
import { AcertoMaletaModel } from "@/models/acertoMaletaModel";
import { supabase } from "@/integrations/supabase/client";

export const DeleteSuitcaseController = {
  /**
   * Verifica se uma maleta pode ser excluída (tem permissões e não possui restrições)
   * @param suitcaseId ID da maleta
   * @returns Objeto indicando se pode ser excluída e mensagem de erro, se houver
   */
  async canDeleteSuitcase(suitcaseId: string): Promise<{ canDelete: boolean; message?: string }> {
    try {
      // Verificar se a maleta existe
      const suitcase = await SuitcaseModel.getSuitcaseById(suitcaseId);
      if (!suitcase) {
        return { canDelete: false, message: "Maleta não encontrada" };
      }

      // Verificar se há acertos pendentes
      const { data: pendingSettlements, error: settlementsError } = await supabase
        .from('acertos_maleta')
        .select('id')
        .eq('suitcase_id', suitcaseId)
        .eq('status', 'pendente');

      if (settlementsError) {
        console.error("Erro ao verificar acertos pendentes:", settlementsError);
        throw settlementsError;
      }

      if (pendingSettlements && pendingSettlements.length > 0) {
        return { 
          canDelete: false, 
          message: `Existem ${pendingSettlements.length} acertos pendentes. Finalize-os antes de excluir a maleta.` 
        };
      }

      return { canDelete: true };
    } catch (error) {
      console.error("Erro ao verificar se maleta pode ser excluída:", error);
      return { canDelete: false, message: "Erro ao verificar disponibilidade para exclusão" };
    }
  },

  /**
   * Exclui uma maleta e todos os seus registros relacionados em cascata,
   * lidando com as dependências de chaves estrangeiras
   * @param suitcaseId ID da maleta a ser excluída
   * @returns true se a exclusão for bem-sucedida
   */
  async deleteSuitcase(suitcaseId: string): Promise<boolean> {
    try {
      console.log(`Iniciando processo de exclusão da maleta ${suitcaseId}`);

      // 1. Verificar se a maleta existe
      const suitcase = await SuitcaseModel.getSuitcaseById(suitcaseId);
      if (!suitcase) {
        throw new Error("Maleta não encontrada");
      }

      // 2. Buscar os itens da maleta
      const suitcaseItems = await SuitcaseItemModel.getSuitcaseItems(suitcaseId);
      console.log(`A maleta possui ${suitcaseItems.length} itens para processar`);

      // 3. Para cada item, excluir primeiro suas vendas relacionadas
      for (const item of suitcaseItems) {
        console.log(`Processando item ${item.id} (${item.status})`);
        
        // 3.1 Excluir vendas relacionadas ao item
        const { error: salesDeleteError } = await supabase
          .from('suitcase_item_sales')
          .delete()
          .eq('suitcase_item_id', item.id);
          
        if (salesDeleteError) {
          console.error(`Erro ao excluir vendas do item ${item.id}:`, salesDeleteError);
          throw salesDeleteError;
        }
        
        console.log(`Vendas do item ${item.id} excluídas com sucesso`);
        
        // 3.2. Se o item estiver em posse, retornar ao estoque
        if (item.status === 'in_possession') {
          await SuitcaseItemModel.returnItemToInventory(item.id);
          console.log(`Item ${item.id} retornado ao estoque`);
        }
        
        // 3.3. Remover o item da maleta
        await SuitcaseItemModel.removeSuitcaseItem(item.id);
        console.log(`Item ${item.id} removido da maleta`);
      }

      // 4. Excluir todos os acertos e seus itens vendidos
      await AcertoMaletaModel.deleteAllAcertosBySuitcaseId(suitcaseId);
      console.log(`Acertos da maleta ${suitcaseId} excluídos com sucesso`);

      // 5. Por fim, excluir a maleta
      const { error: deleteError } = await supabase
        .from('suitcases')
        .delete()
        .eq('id', suitcaseId);

      if (deleteError) {
        console.error(`Erro ao excluir maleta ${suitcaseId}:`, deleteError);
        throw deleteError;
      }

      console.log(`Maleta ${suitcaseId} excluída com sucesso`);
      return true;
    } catch (error) {
      console.error(`Erro durante a exclusão da maleta ${suitcaseId}:`, error);
      throw error;
    }
  },
  
  // Alias para manter compatibilidade com código existente
  deleteSuitcaseWithCascade: function(suitcaseId: string) {
    return this.deleteSuitcase(suitcaseId);
  }
};
