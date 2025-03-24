
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
}
