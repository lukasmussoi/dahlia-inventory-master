
import { PromoterModel } from "@/models/promoterModel";
import { Promoter, PromoterInput } from "@/types/promoter";

export class PromoterController {
  static async getAllPromoters(): Promise<Promoter[]> {
    try {
      console.log("Controller: Buscando todas as promotoras");
      return await PromoterModel.getAll();
    } catch (error) {
      console.error('Erro ao buscar promotoras:', error);
      throw error;
    }
  }

  static async getPromoterById(id: string): Promise<Promoter> {
    try {
      console.log(`Controller: Buscando promotora com ID ${id}`);
      return await PromoterModel.getById(id);
    } catch (error) {
      console.error(`Erro ao buscar promotora ${id}:`, error);
      throw error;
    }
  }

  static async createPromoter(promoter: PromoterInput): Promise<any> {
    try {
      console.log("Controller: Criando nova promotora", promoter.name);
      return await PromoterModel.create(promoter);
    } catch (error) {
      console.error('Erro ao criar promotora:', error);
      throw error;
    }
  }

  static async updatePromoter(id: string, promoter: PromoterInput): Promise<any> {
    try {
      console.log(`Controller: Atualizando promotora ${id}`, promoter.name);
      return await PromoterModel.update(id, promoter);
    } catch (error) {
      console.error(`Erro ao atualizar promotora ${id}:`, error);
      throw error;
    }
  }

  static async deletePromoter(id: string): Promise<boolean> {
    try {
      console.log(`Controller: Excluindo promotora ${id}`);
      
      // Primeiro verificar se tem revendedoras associadas
      const hasResellers = await PromoterModel.hasAssociatedResellers(id);
      if (hasResellers) {
        throw new Error("Não é possível excluir esta promotora pois existem revendedoras associadas a ela");
      }
      
      return await PromoterModel.delete(id);
    } catch (error) {
      console.error(`Erro ao excluir promotora ${id}:`, error);
      throw error;
    }
  }

  static async searchPromoters(query: string, status?: string): Promise<Promoter[]> {
    try {
      console.log("Controller: Pesquisando promotoras com filtros:", { query, status });
      return await PromoterModel.searchPromoters(query, status);
    } catch (error) {
      console.error('Erro ao buscar promotoras:', error);
      throw error;
    }
  }
}
