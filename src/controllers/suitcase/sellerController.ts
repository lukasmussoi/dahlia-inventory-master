
/**
 * Controlador de Revendedores e Promotoras
 * @file Este arquivo controla as operações relacionadas aos revendedores e promotoras
 */
import { SuitcaseModel } from "@/models/suitcaseModel";

export class SellerController {
  static async getAllSellers() {
    try {
      return await SuitcaseModel.getAllSellers();
    } catch (error) {
      console.error("Erro ao buscar revendedoras:", error);
      throw error;
    }
  }

  static async getSellerById(sellerId: string) {
    try {
      return await SuitcaseModel.getSellerById(sellerId);
    } catch (error) {
      console.error("Erro ao buscar revendedora por ID:", error);
      throw error;
    }
  }

  static async getPromoterForReseller(resellerId: string): Promise<any | null> {
    try {
      const promotoras = [
        {
          id: "1",
          name: "Maria Silva",
          phone: "(11) 99999-9999",
          reseller_id: "79a3269f-9e6f-4b97-b990-30984dd9f1ca",
        },
        {
          id: "2",
          name: "João Santos",
          phone: "(21) 88888-8888",
          reseller_id: "2",
        },
      ];

      const promotora = promotoras.find(
        (p) => p.reseller_id === resellerId
      );

      return promotora || null;
    } catch (error) {
      console.error("Erro ao buscar promotora da revendedora:", error);
      return null;
    }
  }
}
