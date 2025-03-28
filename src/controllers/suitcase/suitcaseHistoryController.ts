
/**
 * Controlador de Histórico de Maletas
 * @file Este arquivo contém operações relacionadas ao histórico de acertos de maletas
 */
import { supabase } from "@/integrations/supabase/client";
import { Acerto } from "@/types/suitcase";

export class SuitcaseHistoryController {
  /**
   * Busca o histórico de acertos de uma maleta
   * @param suitcaseId ID da maleta
   * @returns Lista de acertos da maleta
   */
  static async getHistoricoAcertos(suitcaseId: string): Promise<Acerto[]> {
    try {
      if (!suitcaseId) return [];
      
      // Buscar todos os acertos da maleta
      const { data: acertos, error } = await supabase
        .from('acertos_maleta')
        .select(`
          *,
          items_vendidos:acerto_itens_vendidos(
            *,
            product:inventory(id, name, sku, price, unit_cost, photo_url)
          )
        `)
        .eq('suitcase_id', suitcaseId)
        .order('settlement_date', { ascending: false });
      
      if (error) throw error;
      
      // Converter para o tipo Acerto
      return (acertos as any[]).map(acerto => ({
        ...acerto,
        items_vendidos: acerto.items_vendidos || []
      }));
    } catch (error) {
      console.error("Erro ao buscar histórico de acertos:", error);
      return [];
    }
  }
}
