
/**
 * Modelo de Operações com Itens de Maleta
 * @file Este arquivo contém as operações de gerenciamento de itens em maletas
 */
import { supabase } from "@/integrations/supabase/client";
import { InventoryController } from "@/controllers/inventoryController";

export class SuitcaseItemOperationsModel {
  /**
   * Atualiza a quantidade de um item na maleta
   * @param itemId ID do item na maleta
   * @param newQuantity Nova quantidade
   * @returns O item atualizado
   */
  static async updateItemQuantity(itemId: string, newQuantity: number) {
    try {
      console.log(`[SuitcaseItemOperationsModel] Atualizando quantidade do item ${itemId} para ${newQuantity}`);
      
      // Buscar informações atuais do item
      const { data: currentItem, error: queryError } = await supabase
        .from('suitcase_items')
        .select('quantity, inventory_id, suitcase_id')
        .eq('id', itemId)
        .maybeSingle();
      
      if (queryError) throw queryError;
      if (!currentItem) throw new Error("Item não encontrado");
      
      const currentQuantity = currentItem.quantity || 1;
      const quantityDiff = newQuantity - currentQuantity;
      
      // Se não há alteração na quantidade, retornar
      if (quantityDiff === 0) {
        return currentItem;
      }
      
      // Atualizar a quantidade do item na maleta
      const { data, error } = await supabase
        .from('suitcase_items')
        .update({ quantity: newQuantity })
        .eq('id', itemId)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error("Erro ao atualizar quantidade: nenhum dado retornado");
      
      // Se a quantidade aumentou, reservar mais unidades no estoque
      if (quantityDiff > 0) {
        // Alteração: Atualizar manualmente sem usar supabase.sql
        await supabase
          .from('inventory')
          .update({ quantity_reserved: currentItem.quantity_reserved + quantityDiff })
          .eq('id', currentItem.inventory_id);
          
        // Registrar o movimento
        await InventoryController.createMovement({
          inventory_id: currentItem.inventory_id,
          quantity: quantityDiff,
          movement_type: 'reserva_maleta',
          reason: `Reserva adicional para maleta ${currentItem.suitcase_id}`
        });
      } 
      // Se a quantidade diminuiu, liberar unidades no estoque
      else if (quantityDiff < 0) {
        // Alteração: Atualizar manualmente sem usar supabase.sql
        const absQuantityDiff = Math.abs(quantityDiff);
        
        // Buscar valor atual de quantity_reserved
        const { data: inventory } = await supabase
          .from('inventory')
          .select('quantity_reserved')
          .eq('id', currentItem.inventory_id)
          .single();
          
        // Calcular novo valor, garantindo que não seja negativo
        const newReservedValue = Math.max(0, (inventory?.quantity_reserved || 0) - absQuantityDiff);
        
        await supabase
          .from('inventory')
          .update({ quantity_reserved: newReservedValue })
          .eq('id', currentItem.inventory_id);
          
        // Registrar o movimento
        await InventoryController.createMovement({
          inventory_id: currentItem.inventory_id,
          quantity: quantityDiff,
          movement_type: 'retorno_maleta',
          reason: `Redução de reserva da maleta ${currentItem.suitcase_id}`
        });
      }
      
      return data;
    } catch (error) {
      console.error("[SuitcaseItemOperationsModel] Erro ao atualizar quantidade do item:", error);
      throw error;
    }
  }

  /**
   * Devolve um item da maleta ao estoque
   * @param itemId ID do item na maleta
   * @param isDamaged Se o item está danificado
   * @returns true se a devolução foi bem-sucedida
   */
  static async returnItemToInventory(itemId: string, isDamaged: boolean = false) {
    try {
      console.log(`[SuitcaseItemOperationsModel] Devolvendo item ${itemId} ao estoque. Danificado: ${isDamaged}`);
      
      // Buscar informações do item
      const { data: item, error: itemError } = await supabase
        .from('suitcase_items')
        .select('inventory_id, quantity, suitcase_id, status')
        .eq('id', itemId)
        .maybeSingle();
      
      if (itemError) throw itemError;
      if (!item) throw new Error("Item não encontrado");
      
      const quantity = item.quantity || 1;
      
      // Se o item estiver danificado, registrar na tabela de itens danificados
      if (isDamaged) {
        console.log(`[SuitcaseItemOperationsModel] Registrando item ${item.inventory_id} como danificado`);
        
        // Corrigido: Alterar o tipo para corresponder ao enum no banco de dados
        const { error: damageError } = await supabase
          .from('inventory_damaged_items')
          .insert({
            inventory_id: item.inventory_id,
            quantity: quantity,
            reason: `Item danificado de maleta`,
            notes: `Maleta ID: ${item.suitcase_id}`,
            damage_type: 'customer_damage', // Usando um tipo válido do enum
            suitcase_id: item.suitcase_id
          });
        
        if (damageError) {
          console.error("[SuitcaseItemOperationsModel] Erro ao registrar item danificado:", damageError);
          // Continuar o processo mesmo com erro no registro de dano
        }
        
        // Buscar valor atual dos campos quantity e quantity_reserved
        const { data: inventory } = await supabase
          .from('inventory')
          .select('quantity, quantity_reserved')
          .eq('id', item.inventory_id)
          .single();
          
        // Calcular novos valores, garantindo que não sejam negativos
        const newQuantity = Math.max(0, (inventory?.quantity || 0) - quantity);
        const newReservedValue = Math.max(0, (inventory?.quantity_reserved || 0) - quantity);
        
        // Remover do estoque (baixa definitiva)
        await supabase
          .from('inventory')
          .update({ 
            quantity: newQuantity,
            quantity_reserved: newReservedValue
          })
          .eq('id', item.inventory_id);
          
        // Registrar o movimento
        await InventoryController.createMovement({
          inventory_id: item.inventory_id,
          quantity: -quantity, // Negativo para indicar saída
          movement_type: 'danificado',
          reason: `Item danificado da maleta ${item.suitcase_id}`
        });
      } else {
        // Buscar valor atual de quantity_reserved
        const { data: inventory } = await supabase
          .from('inventory')
          .select('quantity_reserved')
          .eq('id', item.inventory_id)
          .single();
          
        // Calcular novo valor, garantindo que não seja negativo
        const newReservedValue = Math.max(0, (inventory?.quantity_reserved || 0) - quantity);
        
        // Liberar apenas a reserva, sem reduzir o estoque
        await supabase
          .from('inventory')
          .update({ quantity_reserved: newReservedValue })
          .eq('id', item.inventory_id);
          
        // Registrar o movimento
        await InventoryController.createMovement({
          inventory_id: item.inventory_id,
          quantity: quantity,
          movement_type: 'retorno_maleta',
          reason: `Retorno da maleta ${item.suitcase_id}`
        });
      }
      
      // Atualizar o status do item para 'returned' ou 'damaged'
      const newStatus = isDamaged ? 'damaged' : 'returned';
      
      const { error: updateError } = await supabase
        .from('suitcase_items')
        .update({ status: newStatus })
        .eq('id', itemId);
      
      if (updateError) throw updateError;
      
      return true;
    } catch (error) {
      console.error("[SuitcaseItemOperationsModel] Erro ao devolver item ao estoque:", error);
      throw error;
    }
  }
}
