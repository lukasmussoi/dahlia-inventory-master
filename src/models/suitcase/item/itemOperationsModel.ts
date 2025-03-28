
/**
 * Modelo de Operações de Itens de Maleta
 * @file Este arquivo contém operações de manipulação de estoque relacionadas aos itens de maleta
 */
import { supabase } from "@/integrations/supabase/client";
import { SuitcaseItem } from "@/types/suitcase";

export class SuitcaseItemOperations {
  /**
   * Reserva quantidade de um item no inventário para uma maleta
   * @param inventoryId ID do item no inventário
   * @param quantity Quantidade a ser reservada
   * @returns true se a operação foi bem-sucedida
   */
  static async reserveForSuitcase(inventoryId: string, quantity: number = 1): Promise<boolean> {
    try {
      console.log(`[SuitcaseItemOperations] Reservando ${quantity} unidades do item ${inventoryId} para maleta`);
      
      // 1. Verificar se há quantidade suficiente no estoque
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select('quantity, quantity_reserved')
        .eq('id', inventoryId)
        .single();
      
      if (inventoryError) {
        console.error('[SuitcaseItemOperations] Erro ao verificar estoque:', inventoryError);
        throw inventoryError;
      }
      
      const availableQuantity = (inventoryData.quantity || 0) - (inventoryData.quantity_reserved || 0);
      if (availableQuantity < quantity) {
        console.error(`[SuitcaseItemOperations] Quantidade insuficiente. Disponível: ${availableQuantity}, Solicitado: ${quantity}`);
        return false;
      }
      
      // 2. Incrementar quantidade reservada no inventário
      const { error: updateError } = await supabase
        .from('inventory')
        .update({ 
          quantity_reserved: (inventoryData.quantity_reserved || 0) + quantity 
        })
        .eq('id', inventoryId);
      
      if (updateError) {
        console.error('[SuitcaseItemOperations] Erro ao reservar estoque:', updateError);
        throw updateError;
      }
      
      console.log(`[SuitcaseItemOperations] ${quantity} unidades do item ${inventoryId} reservadas com sucesso`);
      return true;
    } catch (error) {
      console.error('[SuitcaseItemOperations] Erro ao reservar item para maleta:', error);
      return false;
    }
  }
  
  /**
   * Libera quantidade de um item no inventário quando removido da maleta
   * @param inventoryId ID do item no inventário
   * @param quantity Quantidade a ser liberada
   * @returns true se a operação foi bem-sucedida
   */
  static async releaseFromSuitcase(inventoryId: string, quantity: number = 1): Promise<boolean> {
    try {
      console.log(`[SuitcaseItemOperations] Liberando ${quantity} unidades reservadas do item ${inventoryId}`);
      
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select('quantity_reserved')
        .eq('id', inventoryId)
        .single();
      
      if (inventoryError) {
        console.error('[SuitcaseItemOperations] Erro ao verificar reservas:', inventoryError);
        throw inventoryError;
      }
      
      // Garantir que não teremos valores negativos
      const newReservedQuantity = Math.max(0, (inventoryData.quantity_reserved || 0) - quantity);
      
      const { error: updateError } = await supabase
        .from('inventory')
        .update({ quantity_reserved: newReservedQuantity })
        .eq('id', inventoryId);
      
      if (updateError) {
        console.error('[SuitcaseItemOperations] Erro ao liberar reserva:', updateError);
        throw updateError;
      }
      
      console.log(`[SuitcaseItemOperations] ${quantity} unidades do item ${inventoryId} liberadas com sucesso`);
      return true;
    } catch (error) {
      console.error('[SuitcaseItemOperations] Erro ao liberar item da maleta:', error);
      return false;
    }
  }
  
  /**
   * Finaliza a venda de um item, diminuindo a quantidade em estoque
   * @param inventoryId ID do item no inventário
   * @param quantity Quantidade vendida
   * @returns true se a operação foi bem-sucedida
   */
  static async finalizeSale(inventoryId: string, quantity: number = 1): Promise<boolean> {
    try {
      console.log(`[SuitcaseItemOperations] Finalizando venda de ${quantity} unidades do item ${inventoryId}`);
      
      // 1. Pegar informações atuais do estoque
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select('quantity, quantity_reserved')
        .eq('id', inventoryId)
        .single();
      
      if (inventoryError) {
        console.error('[SuitcaseItemOperations] Erro ao verificar estoque:', inventoryError);
        throw inventoryError;
      }
      
      // 2. Atualizar quantidades
      const newQuantity = Math.max(0, (inventoryData.quantity || 0) - quantity);
      const newReservedQuantity = Math.max(0, (inventoryData.quantity_reserved || 0) - quantity);
      
      const { error: updateError } = await supabase
        .from('inventory')
        .update({
          quantity: newQuantity,
          quantity_reserved: newReservedQuantity
        })
        .eq('id', inventoryId);
      
      if (updateError) {
        console.error('[SuitcaseItemOperations] Erro ao atualizar estoque após venda:', updateError);
        throw updateError;
      }
      
      console.log(`[SuitcaseItemOperations] Venda de ${quantity} unidades do item ${inventoryId} finalizada com sucesso`);
      return true;
    } catch (error) {
      console.error('[SuitcaseItemOperations] Erro ao finalizar venda:', error);
      return false;
    }
  }

  /**
   * Devolve um item para o inventário
   * @param suitcaseItemId ID do item da maleta
   * @param isDamaged Indica se o item está danificado
   * @returns true se a operação foi bem-sucedida
   */
  static async returnItemToInventory(suitcaseItemId: string, isDamaged: boolean = false): Promise<boolean> {
    try {
      console.log(`[SuitcaseItemOperations] Devolvendo item ${suitcaseItemId} ao inventário, danificado: ${isDamaged}`);
      
      // 1. Obter informações do item da maleta
      const { data: itemData, error: itemError } = await supabase
        .from('suitcase_items')
        .select(`
          id,
          inventory_id,
          suitcase_id,
          quantity,
          status
        `)
        .eq('id', suitcaseItemId)
        .single();
      
      if (itemError) {
        console.error('[SuitcaseItemOperations] Erro ao obter item da maleta:', itemError);
        throw itemError;
      }
      
      // 2. Se o item estiver danificado, registrar no histórico de itens danificados
      if (isDamaged) {
        const { error: damagedError } = await supabase
          .from('inventory_damaged_items')
          .insert({
            inventory_id: itemData.inventory_id,
            suitcase_id: itemData.suitcase_id,
            quantity: itemData.quantity || 1,
            reason: 'Devolvido danificado da maleta',
            damage_type: 'damaged'
          });
        
        if (damagedError) {
          console.error('[SuitcaseItemOperations] Erro ao registrar item danificado:', damagedError);
          throw damagedError;
        }
      } 
      // 3. Se não estiver danificado, liberar a reserva e atualizar o estoque
      else {
        const { error: releaseError } = await this.releaseFromSuitcase(
          itemData.inventory_id, 
          itemData.quantity || 1
        );
        
        if (releaseError) {
          console.error('[SuitcaseItemOperations] Erro ao liberar reserva:', releaseError);
          throw releaseError;
        }
      }
      
      // 4. Atualizar o status do item na maleta para 'returned'
      const { error: updateError } = await supabase
        .from('suitcase_items')
        .update({ status: 'returned' })
        .eq('id', suitcaseItemId);
      
      if (updateError) {
        console.error('[SuitcaseItemOperations] Erro ao atualizar status do item:', updateError);
        throw updateError;
      }
      
      console.log(`[SuitcaseItemOperations] Item ${suitcaseItemId} devolvido ao inventário com sucesso`);
      return true;
    } catch (error) {
      console.error('[SuitcaseItemOperations] Erro ao devolver item ao inventário:', error);
      return false;
    }
  }
}
