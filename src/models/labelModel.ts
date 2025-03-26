
/**
 * Modelo para gerenciamento de etiquetas de inventário
 * 
 * Este arquivo contém funções para registrar histórico de impressão
 * de etiquetas e consultar informações sobre impressões anteriores.
 * 
 * Relaciona-se com:
 * - InventoryModel (ao verificar histórico de impressões)
 * - PrintLabelButton (ao registrar nova impressão)
 */
import { supabase } from "@/integrations/supabase/client";

export class LabelModel {
  /**
   * Registra uma nova impressão de etiqueta no histórico
   */
  static async registerLabelPrint(inventoryId: string, quantity: number = 1): Promise<boolean> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      
      if (!userId) {
        console.error("Usuário não autenticado ao registrar impressão de etiqueta");
        return false;
      }
      
      const { data, error } = await supabase
        .from('inventory_label_history')
        .insert({
          inventory_id: inventoryId,
          user_id: userId,
          quantity: quantity,
          printed_at: new Date().toISOString()
        });
      
      if (error) {
        console.error("Erro ao registrar impressão de etiqueta:", error);
        return false;
      }
      
      console.log("Impressão de etiqueta registrada com sucesso");
      return true;
    } catch (error) {
      console.error("Erro ao registrar impressão de etiqueta:", error);
      return false;
    }
  }
  
  /**
   * Busca o histórico de impressão de etiquetas para um item específico
   */
  static async getItemLabelHistory(inventoryId: string) {
    try {
      const { data, error } = await supabase
        .from('inventory_label_history')
        .select('*')
        .eq('inventory_id', inventoryId)
        .order('printed_at', { ascending: false });
      
      if (error) {
        console.error("Erro ao buscar histórico de etiquetas:", error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error("Erro ao buscar histórico de etiquetas:", error);
      return [];
    }
  }

  /**
   * Exclui todo o histórico de etiquetas para um item específico
   * Esta função é necessária para garantir que o item possa ser excluído
   */
  static async deleteLabelHistory(inventoryId: string): Promise<boolean> {
    try {
      console.log(`Excluindo histórico de etiquetas para o item: ${inventoryId}`);
      
      // Novo método: excluir diretamente com uma única chamada de API
      const { error } = await supabase
        .from('inventory_label_history')
        .delete()
        .eq('inventory_id', inventoryId);
      
      if (error) {
        console.error(`Erro ao excluir histórico de etiquetas para o item ${inventoryId}:`, error);
        throw error;
      }
      
      console.log(`Histórico de etiquetas do item ${inventoryId} excluído com sucesso`);
      return true;
    } catch (error) {
      console.error(`Erro ao excluir histórico de etiquetas para o item ${inventoryId}:`, error);
      throw error;
    }
  }
}
