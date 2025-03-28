
/**
 * Controlador de Promotoras
 * @file Este arquivo contém operações relacionadas às promotoras de vendas
 */
import { supabase } from "@/integrations/supabase/client";

export class PromoterController {
  /**
   * Busca a promotora associada a uma revendedora
   * @param sellerId ID da revendedora
   * @returns Informações da promotora
   */
  static async getPromoterForReseller(sellerId: string) {
    try {
      if (!sellerId) return null;
      
      // Buscar a revendedora com sua promotora
      const { data, error } = await supabase
        .from('resellers')
        .select(`
          *,
          promoter:promoters!resellers_promoter_id_fkey (*)
        `)
        .eq('id', sellerId)
        .single();
      
      if (error) throw error;
      
      return data?.promoter || null;
    } catch (error) {
      console.error("Erro ao buscar promotora da revendedora:", error);
      return null;
    }
  }
}
