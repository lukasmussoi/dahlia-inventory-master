
/**
 * Controlador Principal de Maletas
 * @file Este arquivo controla as operações básicas de maletas
 */
import { SuitcaseModel } from "@/models/suitcaseModel";
import { SuitcaseStatus, SuitcaseItemStatus, Suitcase, SuitcaseItem } from "@/types/suitcase";

export class SuitcaseController {
  static async getSuitcases(filters?: any) {
    try {
      return await SuitcaseModel.getAllSuitcases(filters);
    } catch (error) {
      console.error("Erro ao buscar maletas:", error);
      throw error;
    }
  }

  static async getSuitcaseById(id: string) {
    try {
      return await SuitcaseModel.getSuitcaseById(id);
    } catch (error) {
      console.error("Erro ao buscar maleta por ID:", error);
      throw error;
    }
  }

  static async getSuitcaseItems(suitcaseId: string) {
    try {
      return await SuitcaseModel.getSuitcaseItems(suitcaseId);
    } catch (error) {
      console.error("Erro ao buscar itens da maleta:", error);
      throw error;
    }
  }

  static async createSuitcase(suitcaseData: any) {
    try {
      return await SuitcaseModel.createSuitcase(suitcaseData);
    } catch (error) {
      console.error("Erro ao criar maleta:", error);
      throw error;
    }
  }

  static async updateSuitcase(id: string, updates: any) {
    try {
      return await SuitcaseModel.updateSuitcase(id, updates);
    } catch (error) {
      console.error("Erro ao atualizar maleta:", error);
      throw error;
    }
  }

  static async deleteSuitcase(id: string) {
    try {
      await SuitcaseModel.deleteSuitcase(id);
    } catch (error) {
      console.error("Erro ao excluir maleta:", error);
      throw error;
    }
  }

  static async searchSuitcases(filters: any) {
    try {
      return await SuitcaseModel.searchSuitcases(filters);
    } catch (error) {
      console.error("Erro ao buscar maletas:", error);
      throw error;
    }
  }

  static async generateSuitcaseCode() {
    try {
      return await SuitcaseModel.generateSuitcaseCode();
    } catch (error) {
      console.error("Erro ao gerar código da maleta:", error);
      throw error;
    }
  }

  static async getSuitcaseSummary() {
    try {
      return await SuitcaseModel.getSuitcaseSummary();
    } catch (error) {
      console.error("Erro ao buscar resumo das maletas:", error);
      throw error;
    }
  }
}
