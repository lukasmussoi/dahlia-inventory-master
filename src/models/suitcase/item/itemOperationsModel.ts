
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
  static async checkItemAvailability(inventoryId: string): Promise<{ available: boolean, message: string }> {
    try {
      // Verificar se o item existe no inventário
      const { data: inventoryItem, error: inventoryError } = await supabase
        .from('inventory')
        .select('quantity, quantity_reserved')
        .eq('id', inventoryId)
        .single();
      
      if (inventoryError) {
        return { available: false, message: "Item não encontrado no inventário" };
      }
      
      // Calcular quantidade disponível (total - reservado)
      const availableQuantity = (inventoryItem.quantity || 0) - (inventoryItem.quantity_reserved || 0);
      
      if (availableQuantity <= 0) {
        return { available: false, message: "Item sem estoque disponível" };
      }
      
      // Verificar se o item já está em alguma maleta
      const { data: suitcaseItems, error: suitcaseError } = await supabase
        .from('suitcase_items')
        .select('suitcase_id, suitcases(code)')
        .eq('inventory_id', inventoryId)
        .eq('status', 'in_possession')
        .maybeSingle();
      
      if (suitcaseError) {
        console.error("Erro ao verificar status do item:", suitcaseError);
        return { available: false, message: "Erro ao verificar disponibilidade do item" };
      }
      
      if (suitcaseItems) {
        return { 
          available: false, 
          message: `Item já está na maleta ${suitcaseItems.suitcases?.code || suitcaseItems.suitcase_id}` 
        };
      }
      
      return { available: true, message: "Item disponível" };
    } catch (error) {
      console.error("Erro ao verificar disponibilidade:", error);
      return { available: false, message: "Erro ao verificar disponibilidade do item" };
    }
  }

  /**
   * Adiciona um item à maleta
   * @param data Dados do item a ser adicionado
   * @returns Item adicionado
   */
  static async addItemToSuitcase(data: {
    suitcase_id: string;
    inventory_id: string;
    quantity?: number;
  }) {
    try {
      const { suitcase_id, inventory_id, quantity = 1 } = data;
      
      // Verificar disponibilidade do item
      const { available, message } = await this.checkItemAvailability(inventory_id);
      
      if (!available) {
        throw new Error(message);
      }
      
      // Adicionar item à maleta
      const { data: suitcaseItem, error } = await supabase
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
      
      if (error) {
        throw error;
      }
      
      // NOVA LÓGICA: Em vez de reduzir o estoque, apenas reservamos a quantidade
      try {
        // Usar RPC para reservar os itens no estoque
        const { error: rpcError } = await supabase
          .rpc('reserve_inventory_for_suitcase', {
            inventory_id: inventory_id,
            reserve_quantity: quantity
          });
        
        if (rpcError) {
          console.error("Erro ao reservar item no estoque:", rpcError);
          // Mesmo se der erro, não impedir o fluxo principal
        }
      } catch (rpcError) {
        console.error("Erro ao chamar RPC para reservar item:", rpcError);
      }
      
      return suitcaseItem;
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
        .select('inventory_id, quantity, suitcase_id')
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
      
      // NOVA LÓGICA: Liberar a quantidade reservada no estoque
      if (itemData) {
        try {
          // Usar RPC para liberar os itens reservados
          const { error: rpcError } = await supabase
            .rpc('release_reserved_inventory', {
              inventory_id: itemData.inventory_id,
              release_quantity: itemData.quantity || 1
            });
          
          if (rpcError) {
            console.error("Erro ao liberar reserva no estoque:", rpcError);
          }
        } catch (rpcError) {
          console.error("Erro ao chamar RPC para liberar reserva:", rpcError);
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
        .select('inventory_id, quantity, suitcase_id')
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
      
      // NOVA LÓGICA: Atualizar a quantidade reservada no estoque
      if (quantityDiff !== 0) {
        try {
          if (quantityDiff < 0) {
            // Liberar parte da reserva no estoque
            const { error: rpcError } = await supabase
              .rpc('release_reserved_inventory', {
                inventory_id: itemData.inventory_id,
                release_quantity: Math.abs(quantityDiff)
              });
            
            if (rpcError) {
              console.error("Erro ao liberar parte da reserva no estoque:", rpcError);
            }
          } else {
            // Aumentar a reserva no estoque
            const { error: rpcError } = await supabase
              .rpc('reserve_inventory_for_suitcase', {
                inventory_id: itemData.inventory_id,
                reserve_quantity: quantityDiff
              });
            
            if (rpcError) {
              console.error("Erro ao aumentar reserva no estoque:", rpcError);
            }
          }
        } catch (rpcError) {
          console.error("Erro ao chamar RPC para atualizar reserva:", rpcError);
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
        const { error: damageError } = await supabase
          .from('inventory_damaged_items')
          .insert({
            inventory_id: itemData.inventory_id,
            suitcase_id: itemData.suitcase_id,
            quantity: itemData.quantity || 1,
            reason: 'Devolvido com danos da maleta',
            damage_type: 'unknown' // Uso de um tipo válido do enum damage_type
          });
          
        if (damageError) {
          console.error("Erro ao registrar item danificado:", damageError);
        }
        
        // NOVA LÓGICA: Para itens danificados, removê-los definitivamente do estoque
        try {
          // Usar RPC para finalizar a venda (que neste caso é uma baixa por dano)
          const { error: rpcError } = await supabase
            .rpc('finalize_inventory_sale', {
              inventory_id: itemData.inventory_id,
              sale_quantity: itemData.quantity || 1
            });
          
          if (rpcError) {
            console.error("Erro ao remover item danificado do estoque:", rpcError);
          }
        } catch (rpcError) {
          console.error("Erro ao chamar RPC para remover item danificado:", rpcError);
        }
      } else {
        // NOVA LÓGICA: Para itens não danificados, apenas liberar a reserva
        try {
          // Usar RPC para liberar os itens reservados
          const { error: rpcError } = await supabase
            .rpc('release_reserved_inventory', {
              inventory_id: itemData.inventory_id,
              release_quantity: itemData.quantity || 1
            });
          
          if (rpcError) {
            console.error("Erro ao liberar reserva no estoque:", rpcError);
          }
        } catch (rpcError) {
          console.error("Erro ao chamar RPC para liberar reserva:", rpcError);
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
