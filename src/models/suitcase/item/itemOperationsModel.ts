/**
 * Modelo de Operações com Itens de Maleta
 * @file Funções para gerenciar operações de inclusão, atualização e remoção de itens em maletas
 * @relacionamento Utiliza supabase client diretamente
 */
import { supabase } from "@/integrations/supabase/client";
import { SuitcaseItemStatus } from "@/types/suitcase";

export class ItemOperationsModel {
  /**
   * Verifica disponibilidade de um item para adicionar à maleta
   * @param inventoryId ID do item no inventário
   * @returns Status de disponibilidade e mensagem
   */
  static async checkItemAvailability(inventoryId: string): Promise<{ 
    available: boolean; 
    message: string; 
    quantity?: number;
    quantity_reserved?: number;
    quantity_available?: number;
  }> {
    try {
      // Verificar se o item existe no inventário
      const { data: inventoryItem, error: inventoryError } = await supabase
        .from('inventory')
        .select('quantity, quantity_reserved')
        .eq('id', inventoryId)
        .single();
      
      if (inventoryError) {
        console.error("Erro ao verificar disponibilidade no inventário:", inventoryError);
        return { available: false, message: "Item não encontrado no inventário" };
      }
      
      // Calcular quantidade disponível (total - reservada)
      const quantity = inventoryItem?.quantity || 0;
      const quantity_reserved = inventoryItem?.quantity_reserved || 0;
      const quantity_available = quantity - quantity_reserved;
      
      if (quantity_available <= 0) {
        return { 
          available: false, 
          message: "Item sem estoque disponível para reserva", 
          quantity,
          quantity_reserved,
          quantity_available
        };
      }
      
      return { 
        available: true, 
        message: "Item disponível", 
        quantity,
        quantity_reserved,
        quantity_available
      };
    } catch (error) {
      console.error("Erro ao verificar disponibilidade:", error);
      return { available: false, message: "Erro ao verificar disponibilidade do item" };
    }
  }

  /**
   * Verifica se o item já está em uma maleta específica
   * @param inventoryId ID do item no inventário
   * @param suitcaseId ID da maleta
   * @returns Status e informações do item na maleta, se existir
   */
  static async checkItemInSuitcase(inventoryId: string, suitcaseId: string): Promise<{
    inSuitcase: boolean;
    item?: any;
    message: string;
  }> {
    try {
      // Verificar se o item já está na maleta específica
      const { data: existingItem, error } = await supabase
        .from('suitcase_items')
        .select('id, quantity, status')
        .eq('inventory_id', inventoryId)
        .eq('suitcase_id', suitcaseId)
        .eq('status', 'in_possession')
        .maybeSingle();
      
      if (error) {
        console.error("Erro ao verificar item na maleta:", error);
        return { inSuitcase: false, message: "Erro ao verificar item na maleta" };
      }
      
      if (existingItem) {
        return { 
          inSuitcase: true, 
          item: existingItem,
          message: `Item já está na maleta com quantidade ${existingItem.quantity}`
        };
      }
      
      return { inSuitcase: false, message: "Item não está na maleta" };
    } catch (error) {
      console.error("Erro ao verificar item na maleta:", error);
      return { inSuitcase: false, message: "Erro ao verificar item na maleta" };
    }
  }

  /**
   * Reserva um item do inventário para uma maleta
   * @param data Dados para reserva de item
   * @returns Item reservado ou erro
   */
  static async reserveItemToSuitcase(data: {
    suitcase_id: string;
    inventory_id: string;
    quantity: number;
  }) {
    try {
      const { suitcase_id, inventory_id, quantity } = data;
      
      if (quantity <= 0) {
        throw new Error("A quantidade deve ser maior que zero");
      }
      
      // 1. Verificar disponibilidade do item
      const availabilityInfo = await this.checkItemAvailability(inventory_id);
      if (!availabilityInfo.available) {
        throw new Error(availabilityInfo.message);
      }
      
      // Verificar se a quantidade solicitada está disponível
      if (availabilityInfo.quantity_available! < quantity) {
        throw new Error(`Quantidade solicitada (${quantity}) excede o disponível (${availabilityInfo.quantity_available})`);
      }
      
      // 2. Verificar se o item já está na maleta
      const existingItemCheck = await this.checkItemInSuitcase(inventory_id, suitcase_id);
      let suitcaseItem;
      
      // 3. Atualizar a quantidade reservada no inventário
      const newReservedQuantity = (availabilityInfo.quantity_reserved || 0) + quantity;
      const { error: updateInventoryError } = await supabase
        .from('inventory')
        .update({ quantity_reserved: newReservedQuantity })
        .eq('id', inventory_id);
      
      if (updateInventoryError) {
        throw updateInventoryError;
      }
      
      // 4. Adicionar ou atualizar o item na maleta
      if (existingItemCheck.inSuitcase) {
        // Se o item já existe na maleta, atualize a quantidade
        const newQuantity = (existingItemCheck.item.quantity || 0) + quantity;
        
        const { data: updatedItem, error: updateItemError } = await supabase
          .from('suitcase_items')
          .update({ quantity: newQuantity })
          .eq('id', existingItemCheck.item.id)
          .select(`
            *,
            product:inventory_id (
              id,
              name,
              price,
              sku,
              unit_cost,
              photos:inventory_photos(photo_url)
            )
          `)
          .single();
        
        if (updateItemError) {
          // Em caso de erro, reverter a reserva
          await supabase
            .from('inventory')
            .update({ 
              quantity_reserved: availabilityInfo.quantity_reserved 
            })
            .eq('id', inventory_id);
            
          throw updateItemError;
        }
        
        suitcaseItem = updatedItem;
      } else {
        // Se o item não existe na maleta, crie um novo
        const { data: newItem, error: insertItemError } = await supabase
          .from('suitcase_items')
          .insert({
            suitcase_id,
            inventory_id,
            status: 'in_possession',
            quantity
          })
          .select(`
            *,
            product:inventory_id (
              id,
              name,
              price,
              sku,
              unit_cost,
              photos:inventory_photos(photo_url)
            )
          `)
          .single();
        
        if (insertItemError) {
          // Em caso de erro, reverter a reserva
          await supabase
            .from('inventory')
            .update({ 
              quantity_reserved: availabilityInfo.quantity_reserved 
            })
            .eq('id', inventory_id);
            
          throw insertItemError;
        }
        
        suitcaseItem = newItem;
      }
      
      // 5. Registrar o movimento de inventário
      const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert({
          inventory_id,
          quantity,
          movement_type: 'reserva_maleta',
          reason: `Reserva para maleta ${suitcase_id}`,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          unit_cost: suitcaseItem.product?.unit_cost || 0
        });
      
      if (movementError) {
        console.error("Erro ao registrar movimento de inventário:", movementError);
        // Não reverter as operações anteriores, apenas registrar o erro
      }
      
      console.log("Item reservado com sucesso:", suitcaseItem);
      return suitcaseItem;
      
    } catch (error) {
      console.error("Erro ao reservar item para maleta:", error);
      throw error;
    }
  }

  /**
   * Adiciona um item à maleta - MÉTODO LEGADO, usar reserveItemToSuitcase
   * @param data Dados do item a ser adicionado
   * @returns Item adicionado
   */
  static async addItemToSuitcase(data: {
    suitcase_id: string;
    inventory_id: string;
    quantity?: number;
  }) {
    try {
      // Redirecionar para o novo método de reserva
      return await this.reserveItemToSuitcase({
        suitcase_id: data.suitcase_id,
        inventory_id: data.inventory_id,
        quantity: data.quantity || 1
      });
    } catch (error) {
      console.error("Erro ao adicionar item à maleta:", error);
      throw error;
    }
  }

  /**
   * Atualiza o status de um item da maleta
   * @param itemId ID do item
   * @param status Novo status
   * @returns Item atualizado
   */
  static async updateSuitcaseItemStatus(itemId: string, status: SuitcaseItemStatus) {
    try {
      const { data, error } = await supabase
        .from('suitcase_items')
        .update({ status })
        .eq('id', itemId)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error("Erro ao atualizar status do item:", error);
      throw error;
    }
  }

  /**
   * Remove um item da maleta
   * @param itemId ID do item
   * @returns Resultado da operação
   */
  static async removeSuitcaseItem(itemId: string) {
    try {
      // Primeiro, obter informações do item para saber qual inventoryId está sendo removido
      const { data: itemData, error: getError } = await supabase
        .from('suitcase_items')
        .select('inventory_id, quantity')
        .eq('id', itemId)
        .single();
      
      if (getError) {
        throw getError;
      }
      
      // Remover o item da maleta
      const { error } = await supabase
        .from('suitcase_items')
        .delete()
        .eq('id', itemId);
      
      if (error) {
        throw error;
      }
      
      // Devolver ao estoque usando operação manual em vez de RPC
      if (itemData) {
        try {
          // Obter a quantidade atual do inventário
          const { data: inventoryItem } = await supabase
            .from('inventory')
            .select('quantity')
            .eq('id', itemData.inventory_id)
            .single();
            
          if (inventoryItem) {
            // Atualizar com a nova quantidade
            await supabase
              .from('inventory')
              .update({ quantity: inventoryItem.quantity + (itemData.quantity || 1) })
              .eq('id', itemData.inventory_id);
          }
        } catch (updateError) {
          console.error("Erro ao atualizar estoque:", updateError);
        }
      }
      
      return { success: true, message: "Item removido com sucesso" };
    } catch (error) {
      console.error("Erro ao remover item da maleta:", error);
      throw error;
    }
  }

  /**
   * Atualiza a quantidade de um item na maleta
   * @param itemId ID do item
   * @param quantity Nova quantidade
   * @returns Item atualizado
   */
  static async updateSuitcaseItemQuantity(itemId: string, quantity: number) {
    try {
      // Primeiro, obter informações do item para calcular a diferença de quantidade
      const { data: itemData, error: getError } = await supabase
        .from('suitcase_items')
        .select('inventory_id, quantity')
        .eq('id', itemId)
        .single();
      
      if (getError) {
        throw getError;
      }
      
      const currentQuantity = itemData.quantity || 1;
      const quantityDiff = quantity - currentQuantity;
      
      // Atualizar quantidade no item
      const { data, error } = await supabase
        .from('suitcase_items')
        .update({ quantity })
        .eq('id', itemId)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Atualizar estoque se necessário
      if (quantityDiff !== 0) {
        try {
          // Obter a quantidade atual do inventário
          const { data: inventoryItem } = await supabase
            .from('inventory')
            .select('quantity')
            .eq('id', itemData.inventory_id)
            .single();
            
          if (inventoryItem) {
            if (quantityDiff < 0) {
              // Devolver ao estoque
              await supabase
                .from('inventory')
                .update({ quantity: inventoryItem.quantity + Math.abs(quantityDiff) })
                .eq('id', itemData.inventory_id);
            } else {
              // Retirar do estoque
              await supabase
                .from('inventory')
                .update({ quantity: Math.max(0, inventoryItem.quantity - quantityDiff) })
                .eq('id', itemData.inventory_id);
            }
          }
        } catch (updateError) {
          console.error("Erro ao atualizar estoque:", updateError);
        }
      }
      
      return data;
    } catch (error) {
      console.error("Erro ao atualizar quantidade do item:", error);
      throw error;
    }
  }

  /**
   * Retorna um item para o estoque
   * @param itemId ID do item
   * @param isDamaged Indica se o item está danificado
   * @returns Resultado da operação
   */
  static async returnItemToInventory(itemId: string, isDamaged: boolean = false) {
    try {
      // Primeiro, obter informações do item
      const { data: itemData, error: getError } = await supabase
        .from('suitcase_items')
        .select('inventory_id, quantity, suitcase_id')
        .eq('id', itemId)
        .single();
      
      if (getError) {
        throw getError;
      }
      
      // Atualizar status do item
      const newStatus = isDamaged ? 'damaged' : 'returned';
      const { error: updateError } = await supabase
        .from('suitcase_items')
        .update({ status: newStatus })
        .eq('id', itemId);
      
      if (updateError) {
        throw updateError;
      }
      
      // Se o item estiver danificado, registrar na tabela de itens danificados
      if (isDamaged) {
        // Usar 'unknown' como tipo de dano para compatibilidade com o esquema
        const { error: damageError } = await supabase
          .from('inventory_damaged_items')
          .insert({
            inventory_id: itemData.inventory_id,
            suitcase_id: itemData.suitcase_id,
            quantity: itemData.quantity || 1,
            reason: 'Devolvido com danos da maleta',
            damage_type: 'unknown'
          });
          
        if (damageError) {
          console.error("Erro ao registrar item danificado:", damageError);
        }
      } else {
        // Se não estiver danificado, devolver ao estoque
        try {
          // Obter a quantidade atual do inventário
          const { data: inventoryItem } = await supabase
            .from('inventory')
            .select('quantity')
            .eq('id', itemData.inventory_id)
            .single();
            
          if (inventoryItem) {
            // Atualizar com a nova quantidade
            await supabase
              .from('inventory')
              .update({ quantity: inventoryItem.quantity + (itemData.quantity || 1) })
              .eq('id', itemData.inventory_id);
          }
        } catch (updateError) {
          console.error("Erro ao atualizar estoque:", updateError);
        }
      }
      
      return { 
        success: true, 
        message: isDamaged 
          ? "Item marcado como danificado" 
          : "Item devolvido ao estoque"
      };
    } catch (error) {
      console.error("Erro ao retornar item ao estoque:", error);
      throw error;
    }
  }
}
