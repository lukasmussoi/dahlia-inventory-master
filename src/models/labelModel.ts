
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

// Definição do tipo para o histórico de etiquetas
export interface LabelHistory {
  id: string;
  inventory_id: string;
  user_id: string;
  quantity: number;
  printed_at: string;
  created_at?: string;
  updated_at?: string;
}

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
  static async getItemLabelHistory(inventoryId: string): Promise<LabelHistory[]> {
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
   * Busca todo o histórico de impressão de etiquetas
   */
  static async getAllLabelHistory(): Promise<LabelHistory[]> {
    try {
      const { data, error } = await supabase
        .from('inventory_label_history')
        .select('*')
        .order('printed_at', { ascending: false });
      
      if (error) {
        console.error("Erro ao buscar histórico completo de etiquetas:", error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error("Erro ao buscar histórico completo de etiquetas:", error);
      return [];
    }
  }

  /**
   * Busca todos os perfis de usuários
   */
  static async getAllProfiles() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) {
        console.error("Erro ao buscar perfis de usuários:", error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error("Erro ao buscar perfis de usuários:", error);
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
      
      // Verificar quantos registros serão excluídos (para fins de log)
      const { data: countData, error: countError } = await supabase
        .from('inventory_label_history')
        .select('id')
        .eq('inventory_id', inventoryId);
        
      if (countError) {
        console.error(`Erro ao verificar registros de etiquetas para o item ${inventoryId}:`, countError);
        throw countError;
      }
      
      const recordCount = countData?.length || 0;
      console.log(`Encontrados ${recordCount} registros de histórico de etiquetas para excluir`);
      
      // Se não houver registros, retornar sucesso imediatamente
      if (recordCount === 0) {
        console.log(`Nenhum registro de etiqueta encontrado para o item ${inventoryId}`);
        return true;
      }
      
      // Excluir todos os registros em uma única operação
      const { error } = await supabase
        .from('inventory_label_history')
        .delete()
        .eq('inventory_id', inventoryId);
      
      if (error) {
        console.error(`Erro ao excluir histórico de etiquetas para o item ${inventoryId}:`, error);
        throw error;
      }
      
      // Verificar se a exclusão foi bem-sucedida
      const { data: remainingData, error: remainingError } = await supabase
        .from('inventory_label_history')
        .select('id')
        .eq('inventory_id', inventoryId);
        
      if (remainingError) {
        console.error(`Erro ao verificar registros restantes para o item ${inventoryId}:`, remainingError);
        throw remainingError;
      }
      
      const remainingCount = remainingData?.length || 0;
      if (remainingCount > 0) {
        console.error(`ATENÇÃO: Ainda existem ${remainingCount} registros de etiquetas após a exclusão!`);
        return false;
      }
      
      console.log(`Histórico de etiquetas do item ${inventoryId} excluído com sucesso`);
      return true;
    } catch (error) {
      console.error(`Erro ao excluir histórico de etiquetas para o item ${inventoryId}:`, error);
      throw error;
    }
  }
}
