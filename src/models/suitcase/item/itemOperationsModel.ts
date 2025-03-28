
/**
 * Modelo de Operações de Itens de Maleta
 * @file Este arquivo contém operações comuns para gerenciar itens de maleta
 */
import { supabase } from "@/integrations/supabase/client";
import { SuitcaseItemStatus } from "@/types/suitcase";

export class ItemOperationsModel {
  /**
   * Adiciona um item do inventário à maleta
   * @param suitcaseId ID da maleta
   * @param inventoryId ID do item no inventário
   * @param quantity Quantidade a ser adicionada (padrão: 1)
   * @returns Resultado da operação
   */
  static async addItemToSuitcase(suitcaseId: string, inventoryId: string, quantity: number = 1) {
    if (!suitcaseId || !inventoryId) {
      throw new Error("IDs de maleta e inventário são obrigatórios");
    }

    try {
      // Reservar a quantidade desejada no inventário
      const reserveResult = await supabase.rpc('reserve_inventory_for_suitcase', {
        inventory_id: inventoryId,
        reserve_quantity: quantity
      });

      if (reserveResult.error) {
        throw new Error(`Erro ao reservar item no inventário: ${reserveResult.error.message}`);
      }

      // Adicionar o item à maleta
      const { data, error } = await supabase
        .from('suitcase_items')
        .insert({
          suitcase_id: suitcaseId,
          inventory_id: inventoryId,
          status: 'in_possession' as SuitcaseItemStatus,
          quantity: quantity
        })
        .select(`
          *,
          product:inventory(id, name, sku, price, photo_url)
        `)
        .single();

      if (error) {
        // Em caso de erro, tentar liberar a quantidade reservada
        await supabase.rpc('release_reserved_inventory', {
          inventory_id: inventoryId,
          release_quantity: quantity
        });
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Erro ao adicionar item à maleta:", error);
      throw error;
    }
  }

  /**
   * Atualiza o status de um item na maleta
   * @param itemId ID do item
   * @param status Novo status
   * @returns Resultado da operação
   */
  static async updateSuitcaseItemStatus(itemId: string, status: SuitcaseItemStatus) {
    if (!itemId) {
      throw new Error("ID do item é obrigatório");
    }

    try {
      const { data, error } = await supabase
        .from('suitcase_items')
        .update({ status })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Erro ao atualizar status do item:", error);
      throw error;
    }
  }

  /**
   * Atualiza a quantidade de um item na maleta
   * @param itemId ID do item
   * @param quantity Nova quantidade
   * @returns Resultado da operação
   */
  static async updateSuitcaseItemQuantity(itemId: string, quantity: number) {
    if (!itemId || quantity < 1) {
      throw new Error("ID do item e quantidade válida são obrigatórios");
    }

    try {
      const { data, error } = await supabase
        .from('suitcase_items')
        .update({ quantity })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Erro ao atualizar quantidade do item:", error);
      throw error;
    }
  }

  /**
   * Remove um item da maleta
   * @param itemId ID do item
   * @returns Resultado da operação
   */
  static async removeSuitcaseItem(itemId: string) {
    if (!itemId) {
      throw new Error("ID do item é obrigatório");
    }

    try {
      // Buscar informações do item antes de removê-lo
      const { data: itemData, error: itemError } = await supabase
        .from('suitcase_items')
        .select('inventory_id, quantity')
        .eq('id', itemId)
        .single();

      if (itemError) throw itemError;

      // Liberar a quantidade reservada no inventário
      const { error: releaseError } = await supabase.rpc('release_reserved_inventory', {
        inventory_id: itemData.inventory_id,
        release_quantity: itemData.quantity || 1
      });

      if (releaseError) throw releaseError;

      // Remover o item da maleta
      const { data, error } = await supabase
        .from('suitcase_items')
        .delete()
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Erro ao remover item da maleta:", error);
      throw error;
    }
  }

  /**
   * Devolve um item da maleta para o inventário
   * @param itemId ID do item
   * @param isDamaged Define se o item está danificado
   * @returns Resultado da operação
   */
  static async returnItemToInventory(itemId: string, isDamaged: boolean = false) {
    if (!itemId) {
      throw new Error("ID do item é obrigatório");
    }

    try {
      // Buscar informações do item
      const { data: itemData, error: itemError } = await supabase
        .from('suitcase_items')
        .select('inventory_id, suitcase_id, quantity, status')
        .eq('id', itemId)
        .single();

      if (itemError) throw itemError;

      // Se o item já estiver com status "returned", ignorar
      if (itemData.status === 'returned') {
        return true;
      }

      // Liberar a quantidade reservada no inventário
      await supabase.rpc('release_reserved_inventory', {
        inventory_id: itemData.inventory_id,
        release_quantity: itemData.quantity || 1
      });

      // Se o item estiver danificado, registrar na tabela de itens danificados
      if (isDamaged) {
        // Registrar item como danificado
        const { error: damageError } = await supabase
          .from('inventory_damaged_items')
          .insert({
            inventory_id: itemData.inventory_id,
            suitcase_id: itemData.suitcase_id,
            quantity: itemData.quantity || 1,
            reason: 'Devolução de maleta - item danificado',
            damage_type: 'customer_damage' // Usando um valor válido do enum
          });

        if (damageError) throw damageError;
      }

      // Atualizar o status do item para "returned"
      const { error: updateError } = await supabase
        .from('suitcase_items')
        .update({ status: 'returned' as SuitcaseItemStatus })
        .eq('id', itemId);

      if (updateError) throw updateError;

      return true;
    } catch (error) {
      console.error("Erro ao devolver item para o inventário:", error);
      return false;
    }
  }
}
