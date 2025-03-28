
/**
 * Controlador de Revendedoras
 * @file Este arquivo contém operações relacionadas às revendedoras
 */
import { supabase } from "@/integrations/supabase/client";

export class SellerController {
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
        .select(`
          id,
          name,
          phone,
          email,
          commission_rate,
          address,
          promoter:promoters(id, name, phone)
        `)
        .eq('id', sellerId)
        .single();
        
      if (error) throw error;
      
      // Formatar o endereço para garantir que seja um objeto
      if (data) {
        // Garantir que o endereço é um objeto, não um array ou string
        if (!data.address || Array.isArray(data.address)) {
          data.address = {};
        } else if (typeof data.address === 'string') {
          try {
            data.address = JSON.parse(data.address);
          } catch {
            data.address = {};
          }
        }
      }
      
      return data;
    } catch (error) {
      console.error("Erro ao buscar revendedora:", error);
      return null;
    }
  }

  /**
   * Alias para getSellerById (compatibilidade)
   */
  static async getSellerNameById(sellerId: string) {
    return this.getSellerById(sellerId);
  }

  /**
   * Busca todas as revendedoras ativas
   * @returns Lista de revendedoras
   */
  static async getAllSellers() {
    try {
      const { data, error } = await supabase
        .from('resellers')
        .select(`
          id, 
          name,
          phone,
          email,
          status,
          commission_rate,
          address,
          promoter_id,
          promoter:promoters(id, name)
        `)
        .eq('status', 'Ativa')
        .order('name');
        
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error("Erro ao buscar revendedoras:", error);
      return [];
    }
  }
}
