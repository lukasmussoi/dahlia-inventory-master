
import { PromoterModel } from "@/models/promoterModel";
import { Promoter } from "@/types/promoter";

export class PromoterController {
  static async getAllPromoters(): Promise<Promoter[]> {
    try {
      return await PromoterModel.getAll();
    } catch (error) {
      console.error('Erro ao buscar promotoras:', error);
      throw error;
    }
  }

  static async getPromoterById(id: string): Promise<Promoter> {
    try {
      return await PromoterModel.getById(id);
    } catch (error) {
      console.error(`Erro ao buscar promotora ${id}:`, error);
      throw error;
    }
  }
}
