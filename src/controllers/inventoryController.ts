import { InventoryModel } from "@/models/inventoryModel";
import { SuitcaseController } from "./suitcaseController";

export const InventoryController = {
  // Buscar todos os itens do inventário
  async getAllItems() {
    try {
      const items = await InventoryModel.getAllItems();
      return items;
    } catch (error) {
      console.error("Erro ao buscar itens do inventário:", error);
      throw error;
    }
  },

  // Buscar um item específico do inventário
  async getItemById(id: string) {
    try {
      const item = await InventoryModel.getItemById(id);
      return item;
    } catch (error) {
      console.error("Erro ao buscar item do inventário:", error);
      throw error;
    }
  },

  // Criar um novo item no inventário
  async createItem(itemData: any) {
    try {
      const newItem = await InventoryModel.createItem(itemData);
      return newItem;
    } catch (error) {
      console.error("Erro ao criar item no inventário:", error);
      throw error;
    }
  },

  // Atualizar um item existente
  async updateItem(id: string, itemData: any) {
    try {
      const updatedItem = await InventoryModel.updateItem(id, itemData);
      return updatedItem;
    } catch (error) {
      console.error("Erro ao atualizar item do inventário:", error);
      throw error;
    }
  },

  // Excluir um item do inventário
  async deleteItem(id: string) {
    try {
      await InventoryModel.deleteItem(id);
      return true;
    } catch (error) {
      console.error("Erro ao excluir item do inventário:", error);
      throw error;
    }
  },

  // Buscar itens com filtros
  async getFilteredItems(filters: any) {
    try {
      // Usar o método getAllItems com os filtros, já que não existe getFilteredItems
      const items = await InventoryModel.getAllItems(filters);
      return items;
    } catch (error) {
      console.error("Erro ao buscar itens filtrados:", error);
      throw error;
    }
  },

  // Buscar itens por termo de pesquisa
  async searchInventoryItems(searchTerm: string) {
    try {
      // Verificar se o termo de busca tem pelo menos 3 caracteres
      if (searchTerm.length < 3) {
        throw new Error("O termo de busca deve ter pelo menos 3 caracteres");
      }
      
      // Usar o método getAllItems com o filtro de busca
      const items = await InventoryModel.getAllItems({ search: searchTerm });
      
      // Para cada item, verificar se está em alguma maleta
      const itemsWithSuitcaseInfo = await Promise.all(
        items.map(async (item) => {
          try {
            const suitcaseInfo = await SuitcaseController.getItemSuitcaseInfo(item.id);
            return {
              ...item,
              suitcase_info: suitcaseInfo
            };
          } catch (error) {
            console.error(`Erro ao buscar informações da maleta para o item ${item.id}:`, error);
            return item;
          }
        })
      );
      
      return itemsWithSuitcaseInfo;
    } catch (error) {
      console.error("Erro ao buscar itens:", error);
      throw error;
    }
  },
  
  // Formatar valores monetários
  formatCurrency(value: number) {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  },
  
  // Calcular estoque disponível (total - reservado)
  calculateAvailableStock(total: number, reserved: number = 0) {
    return Math.max(0, total - reserved);
  },
  
  // Verificar se o estoque está abaixo do mínimo
  isLowStock(quantity: number, minStock: number = 0) {
    return quantity <= minStock;
  },

  // Verificar se um item está em uma maleta
  async checkItemInSuitcase(inventoryId: string) {
    try {
      const suitcaseInfo = await SuitcaseController.getItemSuitcaseInfo(inventoryId);
      return {
        inSuitcase: !!suitcaseInfo,
        suitcaseInfo: suitcaseInfo
      };
    } catch (error) {
      console.error("Erro ao verificar se item está em maleta:", error);
      return { inSuitcase: false };
    }
  }
};

// Exportar como alias para compatibilidade com código existente
export const inventoryController = InventoryController;
