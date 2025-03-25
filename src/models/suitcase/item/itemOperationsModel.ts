/**
 * Modelo de Operações de Itens de Maleta
 * @file Funções para adicionar, atualizar e remover itens de maleta
 * @relacionamento Utiliza ItemQueryModel e BaseItemModel
 */
import { supabase } from "@/integrations/supabase/client";
import { SuitcaseItemStatus, SuitcaseItem, SuitcaseItemSale } from "@/types/suitcase";
import { ItemQueryModel } from "./itemQueryModel";
import { BaseItemModel } from "./baseItemModel";

export class ItemOperationsModel {
  /**
   * Verificar se um item está disponível para adição à maleta
   * @param inventory_id ID do item no inventário
   * @returns Informações de disponibilidade do item
   */
  static async checkItemAvailability(inventory_id: string): Promise<{
    available: boolean;
    quantity: number;
    item_info?: {
      name: string;
      sku: string;
    };
    in_suitcase?: any;
  }> {
    // Buscar a quantidade disponível em estoque
    const { data: inventoryData, error: inventoryError } = await supabase
      .from('inventory')
      .select('quantity, name, sku')
      .eq('id', inventory_id)
      .maybeSingle();
    
    if (inventoryError) throw inventoryError;
    if (!inventoryData) return { available: false, quantity: 0 };
    
    // Se não há estoque disponível, retornar indisponível
    if (inventoryData.quantity <= 0) {
      return { 
        available: false, 
        quantity: 0,
        item_info: { 
          name: inventoryData.name,
          sku: inventoryData.sku
        }
      };
    }
    
    // Para peças com apenas uma unidade em estoque, verificar se já está em alguma maleta
    if (inventoryData.quantity === 1) {
      const inSuitcase = await ItemQueryModel.getItemSuitcaseInfo(inventory_id);
      
      // Se já está em uma maleta, retornar indisponível junto com a informação da maleta
      if (inSuitcase) {
        return {
          available: false,
          quantity: 1,
          item_info: {
            name: inventoryData.name,
            sku: inventoryData.sku
          },
          in_suitcase: inSuitcase
        };
      }
    }
    
    // Se não está em nenhuma maleta ou tem mais de uma unidade, está disponível
    return {
      available: true,
      quantity: inventoryData.quantity,
      item_info: { 
        name: inventoryData.name,
        sku: inventoryData.sku
      }
    };
  }

  /**
   * Adicionar peça à maleta
   * @param itemData Dados do item a ser adicionado
   * @returns Item adicionado
   */
  static async addItemToSuitcase(itemData: {
    suitcase_id: string;
    inventory_id: string;
    quantity?: number;
    status?: SuitcaseItemStatus;
  }): Promise<SuitcaseItem> {
    if (!itemData.suitcase_id) throw new Error("ID da maleta é necessário");
    if (!itemData.inventory_id) throw new Error("ID do inventário é necessário");
    
    // Garantir que quantidade seja válida
    const quantity = itemData.quantity && itemData.quantity > 0 ? itemData.quantity : 1;
    
    // Verificar disponibilidade do item
    const availability = await this.checkItemAvailability(itemData.inventory_id);
    
    if (!availability.available) {
      if (availability.in_suitcase) {
        throw new Error(`Item "${availability.item_info?.name}" já está na maleta ${availability.in_suitcase.suitcase_code} (${availability.in_suitcase.seller_name})`);
      } else {
        throw new Error(`Item "${availability.item_info?.name}" não está disponível no estoque`);
      }
    }
    
    // Verificar se a quantidade solicitada está disponível
    if (availability.quantity < quantity) {
      throw new Error(`Quantidade solicitada (${quantity}) excede o estoque disponível (${availability.quantity})`);
    }
    
    // Iniciar transação para garantir consistência
    try {
      // 1. Adicionar item à maleta
      const { data, error } = await supabase
        .from('suitcase_items')
        .insert({
          ...itemData,
          quantity: quantity
        })
        .select()
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error("Erro ao adicionar peça à maleta: nenhum dado retornado");
      
      // 2. Reduzir o estoque
      const { error: inventoryError } = await supabase
        .from('inventory')
        .update({ 
          quantity: availability.quantity - quantity 
        })
        .eq('id', itemData.inventory_id);
      
      if (inventoryError) {
        // Tentar reverter a inserção do item na maleta
        await supabase
          .from('suitcase_items')
          .delete()
          .eq('id', data.id);
          
        throw inventoryError;
      }
      
      const added_at = data.created_at || new Date().toISOString();
      
      return {
        id: data.id,
        suitcase_id: data.suitcase_id,
        inventory_id: data.inventory_id,
        status: data.status as SuitcaseItemStatus,
        added_at: added_at,
        created_at: data.created_at,
        updated_at: data.updated_at,
        quantity: data.quantity,
        sales: []
      };
    } catch (error) {
      console.error("Erro na transação de adicionar item à maleta:", error);
      throw error;
    }
  }

  /**
   * Atualizar status de uma peça da maleta
   * @param itemId ID da peça
   * @param status Novo status
   * @param saleInfo Informações de venda, se aplicável
   * @returns Item atualizado
   */
  static async updateSuitcaseItemStatus(
    itemId: string, 
    status: SuitcaseItemStatus,
    saleInfo?: Partial<SuitcaseItemSale>
  ): Promise<SuitcaseItem> {
    if (!itemId) throw new Error("ID da peça é necessário");
    
    // Primeiro atualizar o status da peça
    const { data, error } = await supabase
      .from('suitcase_items')
      .update({ status })
      .eq('id', itemId)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error("Erro ao atualizar status da peça: nenhum dado retornado");
    
    // Se for venda e tiver informações adicionais, registrar a venda
    if (status === 'sold' && saleInfo) {
      const { error: saleError } = await supabase
        .from('suitcase_item_sales')
        .insert({
          ...saleInfo,
          suitcase_item_id: itemId
        });
      
      if (saleError) throw saleError;
    }
    
    return BaseItemModel.processItemData(data);
  }

  /**
   * Remover peça da maleta
   * @param itemId ID do item
   */
  static async removeSuitcaseItem(itemId: string): Promise<void> {
    if (!itemId) throw new Error("ID do item é necessário");
    
    const { error } = await supabase
      .from('suitcase_items')
      .delete()
      .eq('id', itemId);
    
    if (error) throw error;
  }

  /**
   * Atualizar quantidade de um item da maleta
   * @param itemId ID da peça
   * @param quantity Nova quantidade
   * @returns Item atualizado
   */
  static async updateSuitcaseItemQuantity(itemId: string, quantity: number): Promise<SuitcaseItem> {
    if (!itemId) throw new Error("ID da peça é necessário");
    if (quantity < 1) throw new Error("A quantidade deve ser maior que zero");
    
    // Primeiro, verificar se o item existe e seu status atual
    const item = await ItemQueryModel.getSuitcaseItemById(itemId);
    if (!item) throw new Error("Item não encontrado");
    
    // Verificar se o item está em posse (só podemos alterar qtd se estiver em posse)
    if (item.status !== 'in_possession') {
      throw new Error(`Não é possível alterar a quantidade de um item ${item.status === 'sold' ? 'vendido' : item.status === 'returned' ? 'devolvido' : 'perdido'}`);
    }
    
    // Atualizar a quantidade
    const { data, error } = await supabase
      .from('suitcase_items')
      .update({ quantity })
      .eq('id', itemId)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error("Erro ao atualizar quantidade do item: nenhum dado retornado");
    
    return BaseItemModel.processItemData(data);
  }

  /**
   * Retornar um item para o estoque
   * @param itemId ID do item
   * @returns Promise que resolve quando o item for devolvido ao estoque
   */
  static async returnItemToInventory(itemId: string): Promise<void> {
    if (!itemId) throw new Error("ID do item é necessário");
    
    try {
      // Buscar informações do item
      const item = await ItemQueryModel.getSuitcaseItemById(itemId);
      if (!item) {
        console.warn(`Item ${itemId} não encontrado, pulando retorno ao estoque`);
        return;
      }
      
      // Registrar que o item estava na maleta e será devolvido ao estoque
      console.log(`Iniciando processamento para retornar item ${itemId} ao estoque. Status atual: ${item.status}`);
      
      // Incrementar a quantidade no estoque
      const quantidade = item.quantity || 1;
      
      // Buscar quantidade atual no estoque
      const { data: inventoryData, error: getError } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('id', item.inventory_id)
        .maybeSingle();
      
      if (getError) {
        console.error(`Erro ao buscar quantidade no estoque para o item ${item.inventory_id}:`, getError);
        throw getError;
      }
      
      if (inventoryData) {
        const newQuantity = (inventoryData.quantity || 0) + quantidade;
        
        // Atualizar quantidade no estoque
        const { error: updateInventoryError } = await supabase
          .from('inventory')
          .update({ quantity: newQuantity })
          .eq('id', item.inventory_id);
        
        if (updateInventoryError) {
          console.error(`Erro ao atualizar estoque para o item ${item.inventory_id}:`, updateInventoryError);
          throw updateInventoryError;
        }
        
        console.log(`Estoque atualizado para o item ${item.inventory_id}: ${inventoryData.quantity} -> ${newQuantity}`);
      }
      
      // Atualizar o status do item para "returned" (devolvido)
      const { error: updateItemError } = await supabase
        .from('suitcase_items')
        .update({ status: 'returned' })
        .eq('id', itemId);
      
      if (updateItemError) {
        console.error(`Erro ao atualizar status do item ${itemId} para 'returned':`, updateItemError);
        throw updateItemError;
      }
      
      // CORREÇÃO: Verificar se há dependências em acerto_itens_vendidos antes de remover
      const { data: dependencies } = await supabase
        .from('acerto_itens_vendidos')
        .select('id')
        .eq('suitcase_item_id', itemId);
      
      if (dependencies && dependencies.length > 0) {
        console.log(`O item ${itemId} tem ${dependencies.length} dependências em acerto_itens_vendidos. Não será removido diretamente.`);
        // Neste caso, atualizamos para 'returned' acima, mas não removemos diretamente
      } else {
        // Remover completamente o item da maleta após atualizações
        const { error: deleteError } = await supabase
          .from('suitcase_items')
          .delete()
          .eq('id', itemId);
        
        if (deleteError) {
          console.error(`Erro ao remover item ${itemId} da maleta:`, deleteError);
          
          // Se houver erro de constraint, verificamos se é possível identificar a causa
          if (deleteError.message?.includes('foreign key constraint')) {
            console.warn(`Erro de restrição de chave estrangeira ao excluir o item ${itemId}. Mantendo o item com status 'returned'.`);
          } else {
            throw deleteError;
          }
        } else {
          console.log(`Item ${itemId} devolvido ao estoque com sucesso e removido da maleta`);
        }
      }
    } catch (error) {
      console.error("Erro ao retornar item ao estoque:", error);
      throw error;
    }
  }
}
