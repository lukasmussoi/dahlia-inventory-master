
import { ResellerModel } from "@/models/resellerModel";
import { toast } from "sonner";
import { Reseller, ResellerInput } from "@/types/reseller";

export class ResellerController {
  // Buscar todas as revendedoras
  static async getAll() {
    try {
      const resellers = await ResellerModel.getAll();
      return resellers;
    } catch (error) {
      console.error("Erro ao buscar revendedoras:", error);
      toast.error("Erro ao carregar revendedoras");
      throw error;
    }
  }

  // Alias para getAll para compatibilidade com componentes existentes
  static async getAllResellers() {
    return this.getAll();
  }

  // Buscar revendedora por ID
  static async getById(id: string) {
    try {
      const reseller = await ResellerModel.getById(id);
      if (!reseller) {
        throw new Error(`Revendedora com ID ${id} não encontrada`);
      }
      return reseller;
    } catch (error) {
      console.error(`Erro ao buscar revendedora ${id}:`, error);
      toast.error("Erro ao carregar detalhes da revendedora");
      throw error;
    }
  }

  // Alias para getById para compatibilidade com componentes existentes
  static async getResellerById(id: string) {
    return this.getById(id);
  }

  // Criar nova revendedora
  static async createReseller(data: ResellerInput) {
    try {
      const reseller = await ResellerModel.create(data);
      toast.success("Revendedora cadastrada com sucesso!");
      return reseller;
    } catch (error) {
      console.error("Erro ao cadastrar revendedora:", error);
      toast.error("Erro ao cadastrar revendedora");
      throw error;
    }
  }

  // Atualizar revendedora existente
  static async updateReseller(id: string, data: ResellerInput) {
    try {
      const reseller = await ResellerModel.update(id, data);
      toast.success("Revendedora atualizada com sucesso!");
      return reseller;
    } catch (error) {
      console.error(`Erro ao atualizar revendedora ${id}:`, error);
      toast.error("Erro ao atualizar revendedora");
      throw error;
    }
  }

  // Excluir revendedora
  static async deleteReseller(id: string) {
    try {
      await ResellerModel.delete(id);
      toast.success("Revendedora excluída com sucesso!");
      return true;
    } catch (error) {
      console.error(`Erro ao excluir revendedora ${id}:`, error);
      toast.error("Erro ao excluir revendedora");
      throw error;
    }
  }
  
  // Buscar revendedoras por termo
  static async searchResellers(query: string, status?: string, promoterId?: string) {
    try {
      return await ResellerModel.searchResellers(query, status, promoterId);
    } catch (error) {
      console.error("Erro ao buscar revendedoras:", error);
      toast.error("Erro ao pesquisar revendedoras");
      throw error;
    }
  }
}
