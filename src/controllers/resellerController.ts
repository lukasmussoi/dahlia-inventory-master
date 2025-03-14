
import { ResellerModel } from "@/models/resellerModel";
import { Reseller, ResellerInput } from "@/types/reseller";

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

  static async createReseller(reseller: ResellerInput): Promise<any> {
    try {
      return await ResellerModel.create(reseller);
    } catch (error) {
      console.error('Erro ao criar revendedora:', error);
      throw error;
    }
  }

  static async updateReseller(id: string, reseller: ResellerInput): Promise<any> {
    try {
      return await ResellerModel.update(id, reseller);
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

  static async searchResellers(query: string, status?: string, promoterId?: string): Promise<Reseller[]> {
    try {
      return await ResellerModel.searchResellers(query, status, promoterId);
    } catch (error) {
      console.error('Erro ao buscar revendedoras:', error);
      throw error;
    }
  }
}
