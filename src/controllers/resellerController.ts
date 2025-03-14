
import { ResellerModel } from "@/models/resellerModel";
import { Reseller, ResellerInput } from "@/types/reseller";
import { PromoterModel } from "@/models/promoterModel";
import { Promoter } from "@/types/promoter";

export class ResellerController {
  static async getAllResellers(): Promise<Reseller[]> {
    try {
      return await ResellerModel.getAll();
    } catch (error) {
      console.error('Erro ao buscar revendedoras:', error);
      throw error;
    }
  }

  static async getResellerById(id: string): Promise<Reseller> {
    try {
      return await ResellerModel.getById(id);
    } catch (error) {
      console.error(`Erro ao buscar revendedora ${id}:`, error);
      throw error;
    }
  }

  static async createReseller(resellerData: ResellerInput): Promise<string | null> {
    try {
      return await ResellerModel.create(resellerData);
    } catch (error) {
      console.error('Erro ao criar revendedora:', error);
      throw error;
    }
  }

  static async updateReseller(id: string, resellerData: Partial<ResellerInput>): Promise<boolean> {
    try {
      return await ResellerModel.update(id, resellerData);
    } catch (error) {
      console.error(`Erro ao atualizar revendedora ${id}:`, error);
      throw error;
    }
  }

  static async deleteReseller(id: string): Promise<boolean> {
    try {
      return await ResellerModel.delete(id);
    } catch (error) {
      console.error(`Erro ao excluir revendedora ${id}:`, error);
      throw error;
    }
  }

  static async getAllPromoters(): Promise<Promoter[]> {
    try {
      return await PromoterModel.getAll();
    } catch (error) {
      console.error('Erro ao buscar promotoras:', error);
      throw error;
    }
  }
}
