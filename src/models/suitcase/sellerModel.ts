
/**
 * Modelo de Revendedores
 * @file Funções relacionadas aos revendedores das maletas
 */
import { supabase } from "@/integrations/supabase/client";

export class SellerModel {
  // Buscar todos os vendedores/revendedores
  static async getAllSellers(): Promise<any[]> {
    const { data, error } = await supabase
      .from('resellers')
      .select('*');
    
    if (error) throw error;
    return data || [];
  }

  // Buscar vendedor/revendedor por ID
  static async getSellerById(sellerId: string): Promise<any> {
    if (!sellerId) throw new Error("ID do vendedor é necessário");
    
    const { data, error } = await supabase
      .from('resellers')
      .select('*')
      .eq('id', sellerId)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }
  
  // Buscar taxa de comissão de um vendedor específico
  static async getSellerCommissionRate(sellerId: string): Promise<number> {
    try {
      if (!sellerId) return 0.3; // Taxa padrão de 30%
      
      const { data, error } = await supabase
        .from('resellers')
        .select('commission_rate')
        .eq('id', sellerId)
        .maybeSingle();
      
      if (error) throw error;
      
      // Retornar a taxa de comissão do vendedor ou o valor padrão de 30%
      return data?.commission_rate || 0.3;
    } catch (error) {
      console.error("Erro ao buscar taxa de comissão:", error);
      return 0.3; // Taxa padrão em caso de erro
    }
  }
}
