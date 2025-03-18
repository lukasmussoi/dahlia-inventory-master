import { SuitcaseModel } from "@/models/suitcaseModel";
import { SuitcaseItemStatus, InventoryItemSuitcaseInfo } from "@/types/suitcase";

export const suitcaseController = {
  async getAllSuitcases(filters?: any) {
    try {
      const suitcases = await SuitcaseModel.getAllSuitcases(filters);
      return suitcases;
    } catch (error) {
      console.error("Erro ao buscar maletas:", error);
      throw new Error("Erro ao buscar maletas");
    }
  },

  async getSuitcaseById(id: string) {
    try {
      const suitcase = await SuitcaseModel.getSuitcaseById(id);
      return suitcase;
    } catch (error) {
      console.error("Erro ao buscar maleta:", error);
      throw new Error("Erro ao buscar maleta");
    }
  },

  async createSuitcase(data: any) {
    try {
      const newSuitcase = await SuitcaseModel.createSuitcase(data);
      return newSuitcase;
    } catch (error) {
      console.error("Erro ao criar maleta:", error);
      throw new Error("Erro ao criar maleta");
    }
  },

  async updateSuitcase(id: string, data: any) {
    try {
      const updatedSuitcase = await SuitcaseModel.updateSuitcase(id, data);
      return updatedSuitcase;
    } catch (error) {
      console.error("Erro ao atualizar maleta:", error);
      throw new Error("Erro ao atualizar maleta");
    }
  },

  async deleteSuitcase(id: string) {
    try {
      await SuitcaseModel.deleteSuitcase(id);
      return true;
    } catch (error) {
      console.error("Erro ao excluir maleta:", error);
      throw new Error("Erro ao excluir maleta");
    }
  },

  async getSuitcaseItems(suitcaseId: string) {
    try {
      const items = await SuitcaseModel.getSuitcaseItems(suitcaseId);
      return items;
    } catch (error) {
      console.error("Erro ao buscar itens da maleta:", error);
      throw new Error("Erro ao buscar itens da maleta");
    }
  },

  async addItemToSuitcase(suitcaseId: string, inventoryId: string) {
    try {
      const availability = await SuitcaseModel.checkItemAvailability(inventoryId);
      
      if (!availability.available) {
        if (availability.in_suitcase) {
          throw new Error(`Item "${availability.item_info?.name}" já está na maleta ${availability.in_suitcase.suitcase_code} (${availability.in_suitcase.seller_name})`);
        } else {
          throw new Error(`Item "${availability.item_info?.name}" não está disponível no estoque`);
        }
      }
      
      const newItem = await SuitcaseModel.addItemToSuitcase({
        suitcase_id: suitcaseId,
        inventory_id: inventoryId,
        status: "in_possession"
      });
      return newItem;
    } catch (error) {
      console.error("Erro ao adicionar item à maleta:", error);
      throw error;
    }
  },

  async removeItemFromSuitcase(itemId: string) {
    try {
      await SuitcaseModel.removeSuitcaseItem(itemId);
      return true;
    } catch (error) {
      console.error("Erro ao remover item da maleta:", error);
      throw new Error("Erro ao remover item da maleta");
    }
  },

  async updateSuitcaseItemStatus(itemId: string, status: SuitcaseItemStatus) {
    try {
      const validStatus = ["in_possession", "sold", "returned", "lost"] as const;
      
      if (!validStatus.includes(status as any)) {
        throw new Error(`Status inválido: ${status}`);
      }
      
      const updatedItem = await SuitcaseModel.updateSuitcaseItemStatus(
        itemId, 
        status as "in_possession" | "sold" | "returned" | "lost"
      );
      return updatedItem;
    } catch (error) {
      console.error("Erro ao atualizar status do item:", error);
      throw new Error("Erro ao atualizar status do item");
    }
  },

  async getSuitcaseSummary() {
    try {
      const summary = await SuitcaseModel.getSuitcaseSummary();
      return summary;
    } catch (error) {
      console.error("Erro ao buscar resumo das maletas:", error);
      throw new Error("Erro ao buscar resumo das maletas");
    }
  },
  
  async searchSuitcases(filters: any) {
    try {
      const suitcases = await SuitcaseModel.searchSuitcases(filters);
      return suitcases;
    } catch (error) {
      console.error("Erro ao buscar maletas:", error);
      throw new Error("Erro ao buscar maletas");
    }
  },
  
  async getResellersForSelect() {
    try {
      const resellers = await SuitcaseModel.getAllSellers();
      return resellers.map((reseller: any) => ({
        value: reseller.id,
        label: reseller.name
      }));
    } catch (error) {
      console.error("Erro ao buscar revendedoras:", error);
      throw new Error("Erro ao buscar revendedoras");
    }
  },
  
  formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'in_use': 'Em Uso',
      'returned': 'Devolvida',
      'in_replenishment': 'Em Reposição',
      'in_possession': 'Em Posse',
      'sold': 'Vendido',
      'reserved': 'Reservado',
      'available': 'Disponível',
      'lost': 'Perdido'
    };
    
    return statusMap[status] || status;
  },
  
  async searchInventoryItems(query: string) {
    try {
      const items = await SuitcaseModel.searchInventoryItems(query);
      return items;
    } catch (error) {
      console.error("Erro ao buscar itens:", error);
      throw new Error("Erro ao buscar itens");
    }
  },

  async getItemSuitcaseInfo(inventoryId: string): Promise<InventoryItemSuitcaseInfo | null> {
    try {
      const suitcaseInfo = await SuitcaseModel.getItemSuitcaseInfo(inventoryId);
      return suitcaseInfo;
    } catch (error) {
      console.error("Erro ao buscar informações da maleta que contém o item:", error);
      throw error;
    }
  }
};

// Criar um alias para compatibilidade com código existente
export const SuitcaseController = suitcaseController;
