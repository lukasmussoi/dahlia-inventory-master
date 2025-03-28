
/**
 * Controlador de Revendedoras
 * @file Este arquivo contém operações relacionadas às revendedoras
 */
import { supabase } from "@/integrations/supabase/client";

export class SellerController {
  /**
   * Busca todas as revendedoras ativas
   * @returns Lista de revendedoras
   */
  static async getAllSellers() {
    try {
      const { data, error } = await supabase
        .from('resellers')
        .select('*')
        .eq('status', 'Ativa')
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error("Erro ao buscar revendedoras:", error);
      return [];
    }
  }
  
  /**
   * Busca uma revendedora pelo ID
   * @param sellerId ID da revendedora
   * @returns Informações da revendedora
   */
  static async getSellerById(sellerId: string) {
    try {
      if (!sellerId) return null;
      
      const { data, error } = await supabase
        .from('resellers')
        .select('*')
        .eq('id', sellerId)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error("Erro ao buscar revendedora:", error);
      return null;
    }
  }
}
