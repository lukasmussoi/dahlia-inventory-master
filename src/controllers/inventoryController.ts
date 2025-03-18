
import { InventoryModel } from "@/models/inventoryModel";

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
      const items = await InventoryModel.getFilteredItems(filters);
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
      
      const items = await InventoryModel.searchItems(searchTerm);
      return items;
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
  }
};

// Exportar como alias para compatibilidade com código existente
export const inventoryController = InventoryController;
