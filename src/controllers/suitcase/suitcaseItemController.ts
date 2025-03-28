
/**
 * Controlador de Itens de Maleta
 * @file Este arquivo contém operações para gerenciar itens dentro de maletas
 */
import { SuitcaseItemModel } from "@/models/suitcase/item";
import { supabase } from "@/integrations/supabase/client";

export class SuitcaseItemController {
  /**
   * Busca um item de maleta pelo ID
   * @param itemId ID do item
   * @returns Informações do item
   */
  static async getSuitcaseItemById(itemId: string) {
    try {
      return await SuitcaseItemModel.getSuitcaseItemById(itemId);
    } catch (error) {
      console.error("Erro ao buscar item da maleta:", error);
      throw error;
    }
  }

  /**
   * Busca todos os itens de uma maleta
   * @param suitcaseId ID da maleta
   * @returns Lista de itens da maleta
   */
  static async getSuitcaseItems(suitcaseId: string) {
    try {
      return await SuitcaseItemModel.getSuitcaseItems(suitcaseId);
    } catch (error) {
      console.error("Erro ao buscar itens da maleta:", error);
      throw error;
    }
  }

  /**
   * Obtém informações sobre em qual maleta um item do inventário está
   * @param inventoryId ID do item no inventário
   * @returns Informações da maleta e revendedora
   */
  static async getItemSuitcaseInfo(inventoryId: string) {
    try {
      return await SuitcaseItemModel.getItemSuitcaseInfo(inventoryId);
    } catch (error) {
      console.error("Erro ao buscar informações da maleta do item:", error);
      return null;
    }
  }

  /**
   * Adiciona um item do inventário a uma maleta
   * @param suitcaseId ID da maleta
   * @param inventoryId ID do item no inventário
   * @param quantity Quantidade a adicionar
   * @returns Item adicionado
   */
  static async addItemToSuitcase(suitcaseId: string, inventoryId: string, quantity: number = 1) {
    try {
      return await SuitcaseItemModel.addItemToSuitcase(suitcaseId, inventoryId, quantity);
    } catch (error) {
      console.error("Erro ao adicionar item à maleta:", error);
      throw error;
    }
  }

  /**
   * Atualiza o status de um item de maleta
   * @param itemId ID do item
   * @param status Novo status
   * @returns true se atualizado com sucesso
   */
  static async updateItemStatus(itemId: string, status: string) {
    try {
      return await SuitcaseItemModel.updateSuitcaseItemStatus(itemId, status);
    } catch (error) {
      console.error("Erro ao atualizar status do item:", error);
      throw error;
    }
  }

  /**
   * Alias para updateItemStatus (compatibilidade)
   */
  static async updateSuitcaseItemStatus(itemId: string, status: string) {
    return this.updateItemStatus(itemId, status);
  }

  /**
   * Atualiza a quantidade de um item na maleta
   * @param itemId ID do item
   * @param quantity Nova quantidade
   * @returns true se atualizado com sucesso
   */
  static async updateSuitcaseItemQuantity(itemId: string, quantity: number) {
    try {
      // Obter item atual para comparar quantidade
      const { data: itemData, error: itemError } = await supabase
        .from('suitcase_items')
        .select('quantity, inventory_id')
        .eq('id', itemId)
        .single();
      
      if (itemError) throw itemError;
      
      // Atualizar quantidade
      const { error } = await supabase
        .from('suitcase_items')
        .update({ quantity })
        .eq('id', itemId);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error("Erro ao atualizar quantidade do item:", error);
      throw error;
    }
  }

  /**
   * Remove um item da maleta
   * @param itemId ID do item
   * @returns true se removido com sucesso
   */
  static async removeSuitcaseItem(itemId: string) {
    try {
      return await SuitcaseItemModel.removeSuitcaseItem(itemId);
    } catch (error) {
      console.error("Erro ao remover item da maleta:", error);
      throw error;
    }
  }

  /**
   * Marca um item como perdido
   * @param itemId ID do item
   * @returns true se marcado com sucesso
   */
  static async markItemAsLost(itemId: string) {
    try {
      return await this.updateSuitcaseItemStatus(itemId, 'lost');
    } catch (error) {
      console.error("Erro ao marcar item como perdido:", error);
      throw error;
    }
  }

  /**
   * Marca um item como danificado
   * @param itemId ID do item
   * @returns true se marcado com sucesso
   */
  static async markItemAsDamaged(itemId: string) {
    try {
      return await SuitcaseItemModel.returnItemToInventory(itemId, true);
    } catch (error) {
      console.error("Erro ao marcar item como danificado:", error);
      throw error;
    }
  }

  /**
   * Devolve um item ao inventário
   * @param itemId ID do item
   * @param isDamaged Indica se o item está danificado
   * @returns true se devolvido com sucesso
   */
  static async returnItemToInventory(itemId: string, isDamaged: boolean = false) {
    try {
      return await SuitcaseItemModel.returnItemToInventory(itemId, isDamaged);
    } catch (error) {
      console.error("Erro ao devolver item ao inventário:", error);
      throw error;
    }
  }

  /**
   * Devolve múltiplos itens ao inventário
   * @param itemIds IDs dos itens
   * @param isDamaged Indica se os itens estão danificados
   * @returns true se todos foram devolvidos com sucesso
   */
  static async returnItemsToInventory(itemIds: string[], isDamaged: boolean = false) {
    try {
      const results = await Promise.all(
        itemIds.map(itemId => this.returnItemToInventory(itemId, isDamaged))
      );
      
      return results.every(result => result === true);
    } catch (error) {
      console.error("Erro ao devolver itens ao inventário:", error);
      throw error;
    }
  }

  /**
   * Vende um item
   * @param itemId ID do item
   * @returns true se vendido com sucesso
   */
  static async sellItem(itemId: string) {
    try {
      return await this.updateSuitcaseItemStatus(itemId, 'sold');
    } catch (error) {
      console.error("Erro ao marcar item como vendido:", error);
      throw error;
    }
  }

  /**
   * Atualiza informações de venda
   * @param itemId ID do item
   * @param field Campo a atualizar
   * @param value Novo valor
   * @returns true se atualizado com sucesso
   */
  static async updateSaleInfo(itemId: string, field: string, value: string) {
    try {
      // Verificar se já existe registro de venda
      const { data: saleData, error: saleError } = await supabase
        .from('suitcase_item_sales')
        .select('id')
        .eq('suitcase_item_id', itemId)
        .maybeSingle();
      
      if (saleError) throw saleError;
      
      // Se existe, atualizar
      if (saleData) {
        const { error } = await supabase
          .from('suitcase_item_sales')
          .update({ [field]: value })
          .eq('id', saleData.id);
        
        if (error) throw error;
      } 
      // Se não existe, criar
      else {
        const { error } = await supabase
          .from('suitcase_item_sales')
          .insert({ 
            suitcase_item_id: itemId,
            [field]: value
          });
        
        if (error) throw error;
      }
      
      return true;
    } catch (error) {
      console.error("Erro ao atualizar informações de venda:", error);
      throw error;
    }
  }
}
