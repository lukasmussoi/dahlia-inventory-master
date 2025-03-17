
import { SuitcaseModel } from "@/models/suitcaseModel";
import { InventoryModel } from "@/models/inventoryModel";
import { ResellerModel } from "@/models/resellerModel";
import { supabase } from "@/integrations/supabase/client";

export class SuitcaseController {
  static async getSuitcases(page = 1, limit = 10) {
    try {
      console.log(`Controller: Buscando maletas (página ${page}, limite ${limit})`);
      const suitcases = await SuitcaseModel.getAllSuitcases();
      return suitcases.slice((page - 1) * limit, page * limit);
    } catch (error) {
      console.error('Erro ao buscar maletas:', error);
      throw error;
    }
  }

  static async getAllSuitcases() {
    try {
      console.log('Controller: Buscando todas as maletas');
      const suitcases = await SuitcaseModel.getAllSuitcases();
      return suitcases;
    } catch (error) {
      console.error('Erro ao buscar todas as maletas:', error);
      throw error;
    }
  }

  static async getSuitcaseSummary() {
    try {
      console.log('Controller: Buscando resumo das maletas');
      const total = await SuitcaseModel.getAllSuitcases();
      
      // Filtrar maletas por status
      const in_use = total.filter(s => s.status === 'in_use').length;
      const returned = total.filter(s => s.status === 'returned').length;
      const in_replenishment = total.filter(s => s.status === 'in_replenishment').length;
      
      return {
        total: total.length,
        in_use,
        returned,
        in_replenishment
      };
    } catch (error) {
      console.error('Erro ao buscar resumo das maletas:', error);
      throw error;
    }
  }

  static async getSuitcaseById(id: string) {
    try {
      console.log(`Controller: Buscando maleta com ID ${id}`);
      return await SuitcaseModel.getSuitcaseById(id);
    } catch (error) {
      console.error(`Erro ao buscar maleta ${id}:`, error);
      throw error;
    }
  }

  static async getSuitcaseItems(suitcaseId: string) {
    try {
      console.log(`Controller: Buscando itens da maleta ${suitcaseId}`);
      return await SuitcaseModel.getSuitcaseItems(suitcaseId);
    } catch (error) {
      console.error(`Erro ao buscar itens da maleta ${suitcaseId}:`, error);
      throw error;
    }
  }

  static async createSuitcase(data: any) {
    try {
      console.log('Controller: Criando nova maleta');
      return await SuitcaseModel.createSuitcase(data);
    } catch (error) {
      console.error('Erro ao criar maleta:', error);
      throw error;
    }
  }

  static async updateSuitcase(id: string, data: any) {
    try {
      console.log(`Controller: Atualizando maleta ${id}`);
      return await SuitcaseModel.updateSuitcase(id, data);
    } catch (error) {
      console.error(`Erro ao atualizar maleta ${id}:`, error);
      throw error;
    }
  }

  static async deleteSuitcase(id: string) {
    try {
      console.log(`Controller: Excluindo maleta ${id}`);
      return await SuitcaseModel.deleteSuitcase(id);
    } catch (error) {
      console.error(`Erro ao excluir maleta ${id}:`, error);
      throw error;
    }
  }

  static async updateSuitcaseItemStatus(
    id: string, 
    status: 'in_possession' | 'sold' | 'returned' | 'lost', 
    clientName?: string, 
    paymentMethod?: string
  ) {
    try {
      console.log(`Controller: Atualizando status do item da maleta ${id} para ${status}`);
      
      // Preparar informações de venda se for o caso
      const saleInfo = status === 'sold' ? {
        customer_name: clientName,
        payment_method: paymentMethod 
      } : undefined;
      
      const result = await SuitcaseModel.updateSuitcaseItemStatus(id, status, saleInfo);
      
      // Se o item foi marcado como vendido, atualizar o status do inventário
      if (status === 'sold' && result.inventory_id) {
        await InventoryModel.updateInventoryItemStatus(result.inventory_id, 'sold');
      }
      
      return result;
    } catch (error) {
      console.error(`Erro ao atualizar status do item da maleta ${id}:`, error);
      throw error;
    }
  }

  static async addItemToSuitcase(suitcaseId: string, inventoryId: string) {
    try {
      console.log(`Controller: Adicionando item ${inventoryId} à maleta ${suitcaseId}`);
      
      // Verificar se o item existe no inventário
      const inventoryItems = await InventoryModel.searchInventoryItems(inventoryId);
      if (!inventoryItems || inventoryItems.length === 0) {
        throw new Error('Item não encontrado no inventário');
      }
      
      // Adiciona o item à maleta
      const result = await SuitcaseModel.addItemToSuitcase({
        suitcase_id: suitcaseId,
        inventory_id: inventoryId
      });
      
      // Atualiza o "status virtual" do item no inventário
      console.log(`Marcando item ${inventoryId} como em uso na maleta`);
      await InventoryModel.updateInventoryItemStatus(inventoryId, 'in_suitcase');
      
      return result;
    } catch (error) {
      console.error(`Erro ao adicionar item à maleta:`, error);
      throw error;
    }
  }

  static async removeItemFromSuitcase(suitcaseItemId: string) {
    try {
      console.log(`Controller: Removendo item ${suitcaseItemId} da maleta`);
      
      // Busca o item para obter o inventory_id
      const item = await SuitcaseModel.getSuitcaseItemById(suitcaseItemId);
      
      // Remove o item da maleta
      const { error } = await supabase
        .from('suitcase_items')
        .delete()
        .eq('id', suitcaseItemId);
      
      if (error) throw error;
      
      // Atualiza o "status virtual" do item no inventário (se item existe)
      if (item && item.inventory_id) {
        await InventoryModel.updateInventoryItemStatus(item.inventory_id, 'available');
      }
      
      return { success: true };
    } catch (error) {
      console.error(`Erro ao remover item da maleta:`, error);
      throw error;
    }
  }

  static async searchSuitcases(filters: any) {
    try {
      console.log('Controller: Buscando maletas com filtros', filters);
      return await SuitcaseModel.searchSuitcases(filters);
    } catch (error) {
      console.error('Erro ao buscar maletas:', error);
      throw error;
    }
  }

  static formatStatus(status: string) {
    const statusMap: {[key: string]: string} = {
      'in_use': 'Em uso',
      'returned': 'Devolvida',
      'in_replenishment': 'Em reposição',
      'sold': 'Vendido',
      'reserved': 'Reservado',
      'available': 'Disponível',
      'in_suitcase': 'Em maleta',
      'in_possession': 'Em posse'
    };
    
    return statusMap[status] || status;
  }

  static async getResellers() {
    try {
      console.log('Controller: Buscando revendedoras');
      return await ResellerModel.getAll();
    } catch (error) {
      console.error('Erro ao buscar revendedoras:', error);
      throw error;
    }
  }

  static async getResellerById(id: string) {
    try {
      console.log(`Controller: Buscando revendedora com ID ${id}`);
      return await ResellerModel.getById(id);
    } catch (error) {
      console.error(`Erro ao buscar revendedora ${id}:`, error);
      throw error;
    }
  }

  static async updateInventoryItemStatus(id: string, status: string) {
    try {
      console.log(`Controller: Atualizando status do item do inventário ${id} para ${status}`);
      
      // Verifica se o status é válido
      const validStatus = ['available', 'in_suitcase', 'sold', 'reserved'];
      if (!validStatus.includes(status)) {
        throw new Error('Status inválido');
      }
      
      return await InventoryModel.updateInventoryItemStatus(id, status);
    } catch (error) {
      console.error(`Erro ao atualizar status do item do inventário ${id}:`, error);
      throw error;
    }
  }

  static async searchInventoryItems(query: string) {
    try {
      console.log(`Controller: Buscando itens do inventário com query "${query}"`);
      return await InventoryModel.searchInventoryItems(query);
    } catch (error) {
      console.error(`Erro ao buscar itens do inventário:`, error);
      throw error;
    }
  }

  // Método para obter revendedoras no formato para select
  static async getResellersForSelect() {
    try {
      const resellers = await ResellerModel.getAll();
      return resellers.map(reseller => ({
        value: reseller.id,
        label: reseller.name
      }));
    } catch (error) {
      console.error('Erro ao buscar revendedoras para select:', error);
      throw error;
    }
  }
}
