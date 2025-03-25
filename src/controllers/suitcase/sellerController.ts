
/**
 * Controlador de Revendedores
 * @file Este arquivo controla as operações relacionadas às revendedoras e suas promotoras
 */
import { SellerModel } from "@/models/suitcase/sellerModel";
import { supabase } from "@/integrations/supabase/client";

export const SellerController = {
  /**
   * Busca todos os vendedores/revendedores
   * @returns Lista de vendedores
   */
  async getAllSellers() {
    try {
      return await SellerModel.getAllSellers();
    } catch (error) {
      console.error("Erro ao buscar vendedores:", error);
      throw error;
    }
  },

  /**
   * Busca um vendedor/revendedor por ID
   * @param sellerId ID do vendedor
   * @returns Informações do vendedor
   */
  async getSellerById(sellerId: string) {
    try {
      return await SellerModel.getSellerById(sellerId);
    } catch (error) {
      console.error("Erro ao buscar vendedor por ID:", error);
      throw error;
    }
  },

  /**
   * Busca a promotora associada a uma revendedora
   * @param resellerId ID da revendedora
   * @returns Informações da promotora
   */
  async getPromoterForReseller(resellerId: string) {
    try {
      if (!resellerId) throw new Error("ID da revendedora é necessário");
      
      const { data: reseller, error } = await supabase
        .from('resellers')
        .select('promoter_id, promoters(*)')
        .eq('id', resellerId)
        .maybeSingle();
      
      if (error) throw error;
      return reseller?.promoters || null;
    } catch (error) {
      console.error("Erro ao buscar promotora para revendedora:", error);
      throw error;
    }
  }
};
