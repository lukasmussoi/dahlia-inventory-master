import { SuitcaseModel } from "@/models/suitcaseModel";
import { InventoryItemFilters } from "@/types/inventory";
import { SuitcaseFilters, UserRole } from "@/types/suitcase";

export class SuitcaseController {
  // Função para buscar todas as maletas
  static async getAllSuitcases() {
    try {
      console.log("Controller: Buscando todas as maletas...");
      const suitcases = await SuitcaseModel.getAllSuitcases();
      return suitcases;
    } catch (error) {
      console.error("Controller: Erro ao buscar maletas:", error);
      throw error;
    }
  }

  // Função para buscar uma maleta pelo ID
  static async getSuitcaseById(id: string) {
    try {
      console.log("Controller: Buscando maleta com ID:", id);
      const suitcase = await SuitcaseModel.getSuitcaseById(id);
      return suitcase;
    } catch (error) {
      console.error("Controller: Erro ao buscar maleta:", error);
      throw error;
    }
  }

  // Função para criar uma nova maleta
  static async createSuitcase(data: any) {
    try {
      console.log("Controller: Criando nova maleta...");
      const newSuitcase = await SuitcaseModel.createSuitcase(data);
      return newSuitcase;
    } catch (error) {
      console.error("Controller: Erro ao criar maleta:", error);
      throw error;
    }
  }

  // Função para atualizar uma maleta existente
  static async updateSuitcase(id: string, data: any) {
    try {
      console.log("Controller: Atualizando maleta com ID:", id);
      const updatedSuitcase = await SuitcaseModel.updateSuitcase(id, data);
      return updatedSuitcase;
    } catch (error) {
      console.error("Controller: Erro ao atualizar maleta:", error);
      throw error;
    }
  }

  // Função para excluir uma maleta
  static async deleteSuitcase(id: string) {
    try {
      console.log("Controller: Excluindo maleta com ID:", id);
      await SuitcaseModel.deleteSuitcase(id);
    } catch (error) {
      console.error("Controller: Erro ao excluir maleta:", error);
      throw error;
    }
  }

  // Função para buscar maletas com filtros e paginação
  static async searchSuitcases(filters: SuitcaseFilters) {
    try {
      console.log("Controller: Buscando maletas com filtros:", filters);
      const suitcases = await SuitcaseModel.searchSuitcases(filters);
      return suitcases;
    } catch (error) {
      console.error("Controller: Erro ao buscar maletas com filtros:", error);
      throw error;
    }
  }

  // Função para obter o resumo das maletas
  static async getSuitcaseSummary() {
    try {
      console.log("Controller: Buscando resumo das maletas...");
      const summary = await SuitcaseModel.getSuitcaseSummary();
      return summary;
    } catch (error) {
      console.error("Controller: Erro ao buscar resumo das maletas:", error);
      throw error;
    }
  }

  // Função para buscar itens do inventário com filtros
  static async searchInventoryItems(searchTerm: string) {
    try {
      console.log("Controller: Buscando itens do inventário com termo:", searchTerm);
      const results = await SuitcaseModel.searchInventoryItems(searchTerm);
      return results;
    } catch (error) {
      console.error("Controller: Erro ao buscar itens do inventário:", error);
      throw error;
    }
  }

  // Função para adicionar um item à maleta
  static async addItemToSuitcase(suitcaseId: string, inventoryId: string, quantity: number = 1) {
    try {
      console.log("Controller: Adicionando item à maleta:", suitcaseId, inventoryId, quantity);
      await SuitcaseModel.addItemToSuitcase(suitcaseId, inventoryId, quantity);
    } catch (error) {
      console.error("Controller: Erro ao adicionar item à maleta:", error);
      throw error;
    }
  }

  // Função para buscar itens da maleta
  static async getSuitcaseItems(suitcaseId: string) {
    try {
      console.log("Controller: Buscando itens da maleta:", suitcaseId);
      const items = await SuitcaseModel.getSuitcaseItems(suitcaseId);
      return items;
    } catch (error) {
      console.error("Controller: Erro ao buscar itens da maleta:", error);
      throw error;
    }
  }

  // Função para remover um item da maleta
  static async removeItemFromSuitcase(suitcaseItemId: string) {
    try {
      console.log("Controller: Removendo item da maleta:", suitcaseItemId);
      await SuitcaseModel.removeItemFromSuitcase(suitcaseItemId);
    } catch (error) {
      console.error("Controller: Erro ao remover item da maleta:", error);
      throw error;
    }
  }

  // Função para atualizar o status de um item da maleta
  static async updateSuitcaseItemStatus(suitcaseItemId: string, status: string) {
    try {
      console.log("Controller: Atualizando status do item da maleta:", suitcaseItemId, status);
      await SuitcaseModel.updateSuitcaseItemStatus(suitcaseItemId, status);
    } catch (error) {
      console.error("Controller: Erro ao atualizar status do item da maleta:", error);
      throw error;
    }
  }

  // Método para retornar um item da maleta para o estoque do inventário
  static async returnItemToInventory(suitcaseItemId: string, userRoles: UserRole[]): Promise<boolean> {
    try {
      console.log("Controller: Retornando item para o estoque:", suitcaseItemId);
      
      // Verificar se o usuário tem permissão para executar esta ação
      const canReturn = userRoles.includes(UserRole.ADMIN) || userRoles.includes(UserRole.PROMOTER);
      if (!canReturn) {
        throw new Error("Você não tem permissão para retornar itens ao estoque.");
      }
      
      const result = await SuitcaseModel.returnItemToInventory(suitcaseItemId);
      return result;
    } catch (error: any) {
      console.error("Controller: Erro ao retornar item para o estoque:", error);
      throw new Error(error.message || "Erro ao retornar item para o estoque.");
    }
  }
}
