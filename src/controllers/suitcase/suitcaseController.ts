
/**
 * Controlador Principal de Maletas
 * @file Este arquivo controla as operações básicas de maletas
 */
import { OriginalSuitcaseModel } from "@/models/suitcase";
import { SuitcaseItemModel } from "@/models/suitcase";
import { BaseSuitcaseModel } from "@/models/suitcase";
import { SuitcaseStatus, SuitcaseItemStatus, Suitcase, SuitcaseItem } from "@/types/suitcase";

export const SuitcaseController = {
  async getSuitcases(filters?: any) {
    try {
      return await OriginalSuitcaseModel.getAllSuitcases(filters);
    } catch (error) {
      console.error("Erro ao buscar maletas:", error);
      throw error;
    }
  },

  async getSuitcaseById(id: string) {
    try {
      return await OriginalSuitcaseModel.getSuitcaseById(id);
    } catch (error) {
      console.error("Erro ao buscar maleta por ID:", error);
      throw error;
    }
  },

  async getSuitcaseItems(suitcaseId: string) {
    try {
      return await SuitcaseItemModel.getSuitcaseItems(suitcaseId);
    } catch (error) {
      console.error("Erro ao buscar itens da maleta:", error);
      throw error;
    }
  },

  async createSuitcase(suitcaseData: any) {
    try {
      return await OriginalSuitcaseModel.createSuitcase(suitcaseData);
    } catch (error) {
      console.error("Erro ao criar maleta:", error);
      throw error;
    }
  },

  async updateSuitcase(id: string, updates: any) {
    try {
      return await OriginalSuitcaseModel.updateSuitcase(id, updates);
    } catch (error) {
      console.error("Erro ao atualizar maleta:", error);
      throw error;
    }
  },

  async deleteSuitcase(id: string) {
    try {
      await OriginalSuitcaseModel.deleteSuitcase(id);
    } catch (error) {
      console.error("Erro ao excluir maleta:", error);
      throw error;
    }
  },

  async searchSuitcases(filters: any) {
    try {
      return await OriginalSuitcaseModel.searchSuitcases(filters);
    } catch (error) {
      console.error("Erro ao buscar maletas:", error);
      throw error;
    }
  },

  async generateSuitcaseCode() {
    try {
      return await BaseSuitcaseModel.generateSuitcaseCode();
    } catch (error) {
      console.error("Erro ao gerar código da maleta:", error);
      throw error;
    }
  },

  async getSuitcaseSummary() {
    try {
      return await OriginalSuitcaseModel.getSuitcaseSummary();
    } catch (error) {
      console.error("Erro ao buscar resumo das maletas:", error);
      throw error;
    }
  }
};
