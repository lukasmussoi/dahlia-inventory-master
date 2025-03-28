
/**
 * Controlador de Histórico de Maletas
 * @file Este arquivo contém operações relacionadas ao histórico de acertos de maletas
 */
import { supabase } from "@/integrations/supabase/client";

export class SuitcaseHistoryController {
  /**
   * Busca o histórico de acertos de uma maleta
   * @param suitcaseId ID da maleta
   * @returns Lista de acertos da maleta
   */
  static async getHistoricoAcertos(suitcaseId: string) {
    try {
      if (!suitcaseId) return [];
      
      const { data, error } = await supabase
        .from('acertos_maleta')
        .select('*')
        .eq('suitcase_id', suitcaseId)
        .order('settlement_date', { ascending: false });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error("Erro ao buscar histórico de acertos:", error);
      return [];
    }
  }
}
