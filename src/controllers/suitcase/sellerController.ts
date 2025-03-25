
/**
 * Controlador de Revendedores
 * @file Este arquivo controla as operações relacionadas aos revendedores e promotoras
 * @depends models/suitcase/SellerModel - Para acesso aos dados de revendedores
 * @depends supabase/client - Para acesso direto ao banco quando necessário
 */
import { SellerModel } from "@/models/suitcase/sellerModel";
import { supabase } from "@/integrations/supabase/client";

export const SellerController = {
  /**
   * Obtém todos os revendedores
   * @returns Lista de revendedores
   */
  async getAllSellers() {
    try {
      return await SellerModel.getAllSellers();
    } catch (error) {
      console.error("Erro ao buscar revendedores:", error);
      throw error;
    }
  },

  /**
   * Obtém um revendedor pelo ID
   * @param sellerId ID do revendedor
   * @returns Dados do revendedor
   */
  async getSellerById(sellerId: string) {
    try {
      return await SellerModel.getSellerById(sellerId);
    } catch (error) {
      console.error("Erro ao buscar revendedor por ID:", error);
      throw error;
    }
  },

  /**
   * Obtém a promotora associada a um revendedor
   * @param resellerId ID do revendedor
   * @returns Dados da promotora
   */
  async getPromoterForReseller(resellerId: string) {
    try {
      if (!resellerId) {
        console.warn("ID do revendedor não fornecido para buscar promotora");
        return null;
      }

      // Buscar revendedor para obter o ID da promotora
      const { data: reseller, error: resellerError } = await supabase
        .from('resellers')
        .select('promoter_id')
        .eq('id', resellerId)
        .maybeSingle();
      
      if (resellerError) {
        console.error("Erro ao buscar revendedor:", resellerError);
        throw resellerError;
      }

      if (!reseller || !reseller.promoter_id) {
        console.warn(`Revendedor ${resellerId} não possui promotora associada`);
        return null;
      }

      // Buscar dados da promotora
      const { data: promoter, error: promoterError } = await supabase
        .from('promoters')
        .select('*')
        .eq('id', reseller.promoter_id)
        .maybeSingle();
      
      if (promoterError) {
        console.error("Erro ao buscar promotora:", promoterError);
        throw promoterError;
      }

      return promoter;
    } catch (error) {
      console.error("Erro ao buscar promotora do revendedor:", error);
      throw error;
    }
  }
};
