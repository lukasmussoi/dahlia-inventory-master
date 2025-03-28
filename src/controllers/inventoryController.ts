/**
 * Controlador de Inventário
 * @file Este arquivo contém funcionalidades para gerenciar o inventário de produtos
 */
import { InventoryModel } from "@/models/inventory";
import { LabelModel } from "@/models/labelModel";
import { supabase } from "@/integrations/supabase/client";

export const InventoryController = {
  // Buscar todos os itens do inventário
  async getAllItems(filters = {}) {
    try {
      console.log("Controller: Buscando todos os itens", filters);
      const items = await InventoryModel.getAllItems(filters);
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
      // Verificar se o item tem movimentações e está em maletas ativas
      const { inSuitcase, isActiveCase } = await this.checkItemInSuitcase(id);
      
      if (inSuitcase && isActiveCase) {
        throw new Error("Não é possível excluir o item pois ele está em uma maleta ativa. Devolva a maleta primeiro.");
      }
      
      console.log("Iniciando exclusão de item do inventário:", id);
      
      // Chamar diretamente a função de exclusão no modelo, que agora cuida de todas as dependências
      await InventoryModel.deleteItem(id);
      console.log("Item excluído com sucesso:", id);
      return true;
    } catch (error) {
      console.error("Erro ao excluir item do inventário:", error);
      throw error;
    }
  },
  
  // Arquivar um item do inventário
  async archiveItem(id: string) {
    try {
      await InventoryModel.archiveItem(id);
      return true;
    } catch (error) {
      console.error("Erro ao arquivar item do inventário:", error);
      throw error;
    }
  },
  
  // Restaurar um item arquivado
  async restoreItem(id: string) {
    try {
      await InventoryModel.restoreItem(id);
      return true;
    } catch (error) {
      console.error("Erro ao restaurar item do inventário:", error);
      throw error;
    }
  },
  
  // Buscar itens com filtros
  async getFilteredItems(filters: any) {
    try {
      console.log("Controller: Buscando itens filtrados", filters);
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
            // Importar o controlador de maletas diretamente para evitar erro de "require is not defined"
            const suitcaseInfo = await this.checkItemInSuitcase(item.id);
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
      const suitcaseInfo = await InventoryModel.checkItemInSuitcase(inventoryId);
      
      // Verificar se foi retornado algo do modelo
      if (suitcaseInfo) {
        // Verificar se o objeto já tem a estrutura esperada
        if ('hasError' in suitcaseInfo) {
          return suitcaseInfo;
        }
        
        // Definir objeto de retorno com valores padrão para evitar erros de tipo
        return {
          inSuitcase: true,
          isActiveCase: typeof suitcaseInfo === 'object' && 
                        'status' in suitcaseInfo && 
                        (suitcaseInfo.status === 'in_use' || suitcaseInfo.status === 'in_replenishment'),
          hasError: false,
          suitcase_id: typeof suitcaseInfo === 'object' && 'suitcase_id' in suitcaseInfo ? 
                      suitcaseInfo.suitcase_id : null,
          suitcase_code: typeof suitcaseInfo === 'object' && 'suitcase_code' in suitcaseInfo ? 
                        suitcaseInfo.suitcase_code : 'Desconhecido',
          status: typeof suitcaseInfo === 'object' && 'status' in suitcaseInfo ? 
                suitcaseInfo.status : 'unknown',
          seller_name: typeof suitcaseInfo === 'object' && 'seller_name' in suitcaseInfo ? 
                      suitcaseInfo.seller_name : 'Desconhecido'
        };
      }
      
      // Se não há informações da maleta, o item não está em nenhuma maleta
      return { 
        inSuitcase: false, 
        isActiveCase: false, 
        hasError: false,
        suitcaseInfo: null
      };
    } catch (error) {
      console.error("Erro ao verificar se item está em maleta:", error);
      // Alteração: retornar explicitamente o estado para indicar que houve um erro
      // Isso evita que a aplicação tente excluir o item quando houver erro na verificação
      return { inSuitcase: false, isActiveCase: false, hasError: true };
    }
  },

  // Criar um movimento de inventário
  async createMovement(movementData: {
    inventory_id: string;
    quantity: number;
    movement_type: string;
    reason: string;
  }) {
    try {
      console.log("[InventoryController] Criando movimento:", movementData);
      
      // Buscar informações do item para registrar o custo unitário
      const itemData = await this.getItemById(movementData.inventory_id);
      
      const { error } = await supabase
        .from('inventory_movements')
        .insert({
          inventory_id: movementData.inventory_id,
          quantity: movementData.quantity,
          movement_type: movementData.movement_type,
          reason: movementData.reason,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          unit_cost: itemData?.unit_cost || 0
        });
      
      if (error) throw error;
      console.log("[InventoryController] Movimento criado com sucesso");
      
      return true;
    } catch (error) {
      console.error("[InventoryController] Erro ao criar movimento:", error);
      throw error;
    }
  }
};

// Exportar como alias para compatibilidade com código existente
export const inventoryController = InventoryController;
