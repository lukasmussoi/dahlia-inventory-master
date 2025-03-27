
/**
 * Modelo de Item de Inventário
 * @file Este arquivo contém operações específicas para itens do inventário
 */
import { supabase } from "@/integrations/supabase/client";
import { InventoryItem } from "./types";
import { BaseInventoryModel } from "./baseModel";
import { LabelModel } from "../labelModel";

export class InventoryItemModel {
  // Criar novo item
  static async createItem(itemData: Partial<InventoryItem>): Promise<InventoryItem> {
    if (!itemData.name) throw new Error("Nome do item é obrigatório");
    if (!itemData.category_id) throw new Error("Categoria é obrigatória");
    if (itemData.price === undefined) throw new Error("Preço é obrigatório");
    
    // Log para verificar valores antes de inserir
    console.log("[ItemModel] Valores antes de salvar no banco:", {
      unit_cost: itemData.unit_cost, // Custo Total (calculado)
      raw_cost: itemData.raw_cost,   // Preço do Bruto (matéria-prima)
      tipo_unit_cost: typeof itemData.unit_cost,
      tipo_raw_cost: typeof itemData.raw_cost
    });
    
    // Garantir que ambos os campos estejam tratados como números
    const unitCost = typeof itemData.unit_cost === 'string' 
      ? parseFloat(itemData.unit_cost) 
      : itemData.unit_cost || 0;
      
    const rawCost = typeof itemData.raw_cost === 'string'
      ? parseFloat(itemData.raw_cost)
      : itemData.raw_cost || 0;
    
    const { data, error } = await supabase
      .from('inventory')
      .insert({
        name: itemData.name,
        sku: itemData.sku,
        barcode: itemData.barcode,
        category_id: itemData.category_id,
        quantity: itemData.quantity || 0,
        price: itemData.price,
        unit_cost: unitCost,      // Custo Total (calculado)
        raw_cost: rawCost,        // Preço do Bruto (matéria-prima)
        suggested_price: itemData.suggested_price || 0,
        weight: itemData.weight,
        width: itemData.width,
        height: itemData.height,
        depth: itemData.depth,
        min_stock: itemData.min_stock || 0,
        supplier_id: itemData.supplier_id,
        popularity: itemData.popularity || 0,
        plating_type_id: itemData.plating_type_id,
        material_weight: itemData.material_weight,
        packaging_cost: itemData.packaging_cost || 0,
        gram_value: itemData.gram_value || 0,
        profit_margin: itemData.profit_margin || 0,
        reseller_commission: itemData.reseller_commission || 0.3,
        markup_percentage: itemData.markup_percentage || 30
      })
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error("Erro ao criar item: nenhum dado retornado");
    
    // Log para verificar valores salvos
    console.log("[ItemModel] Valores salvos no banco:", {
      unit_cost: data.unit_cost,  // Custo Total (calculado)
      raw_cost: data.raw_cost     // Preço do Bruto (matéria-prima)
    });
    
    return data;
  }

  // Atualizar item existente
  static async updateItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    const { photos, category_name, supplier_name, plating_type_name, inventory_photos, ...cleanUpdates } = updates;
    
    // Log para verificar valores antes de atualizar
    console.log("[ItemModel] Valores antes de atualizar no banco:", {
      unit_cost: cleanUpdates.unit_cost,  // Custo Total (calculado)
      raw_cost: cleanUpdates.raw_cost,    // Preço do Bruto (matéria-prima)
      tipo_unit_cost: typeof cleanUpdates.unit_cost,
      tipo_raw_cost: typeof cleanUpdates.raw_cost
    });
    
    // Garantir que ambos os campos estejam tratados como números
    if (cleanUpdates.unit_cost !== undefined) {
      cleanUpdates.unit_cost = typeof cleanUpdates.unit_cost === 'string' 
        ? parseFloat(cleanUpdates.unit_cost)
        : cleanUpdates.unit_cost;
    }
    
    if (cleanUpdates.raw_cost !== undefined) {
      cleanUpdates.raw_cost = typeof cleanUpdates.raw_cost === 'string'
        ? parseFloat(cleanUpdates.raw_cost)
        : cleanUpdates.raw_cost;
    }
    
    const { data, error } = await supabase
      .from('inventory')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error("Erro ao atualizar item: nenhum dado retornado");
    
    // Log para verificar valores atualizados
    console.log("[ItemModel] Valores atualizados no banco:", {
      unit_cost: data.unit_cost,  // Custo Total (calculado)
      raw_cost: data.raw_cost     // Preço do Bruto (matéria-prima)
    });
    
    return data;
  }

  /**
   * Excluir item completo com todas as dependências
   * Implementa uma exclusão "em cascata manual" para garantir
   * que todas as relações sejam removidas corretamente
   * @param id ID do item a ser excluído
   */
  static async deleteItem(id: string): Promise<void> {
    try {
      console.log("[ItemModel] Iniciando processo completo de exclusão do item:", id);
      
      // 1. Verificar se o item existe
      const { data: itemData, error: itemError } = await supabase
        .from('inventory')
        .select('id, name')
        .eq('id', id)
        .maybeSingle();
      
      if (itemError) {
        console.error("[ItemModel] Erro ao verificar existência do item:", itemError);
        throw new Error("Erro ao verificar existência do item");
      }
      
      if (!itemData) {
        console.error("[ItemModel] Item não encontrado para exclusão:", id);
        throw new Error("Item não encontrado");
      }
      
      console.log(`[ItemModel] Item encontrado para exclusão: ${itemData.name} (${id})`);
      
      // 2. Excluir histórico de etiquetas relacionadas
      console.log("[ItemModel] Excluindo histórico de etiquetas relacionadas ao item:", id);
      const { error: labelHistoryError } = await supabase
        .from('inventory_label_history')
        .delete()
        .eq('inventory_id', id);
      
      if (labelHistoryError) {
        console.error("[ItemModel] Erro ao excluir histórico de etiquetas:", labelHistoryError);
        // Registrar erro, mas continuar com outras exclusões
        console.log("[ItemModel] Continuando processo de exclusão após erro em histórico de etiquetas");
      } else {
        console.log("[ItemModel] Histórico de etiquetas excluído com sucesso");
      }
      
      // 3. Buscar itens de maleta relacionados à peça
      const { data: suitcaseItemsData, error: suitcaseItemsError } = await supabase
        .from('suitcase_items')
        .select('id')
        .eq('inventory_id', id);
      
      if (suitcaseItemsError) {
        console.error("[ItemModel] Erro ao buscar itens de maleta:", suitcaseItemsError);
        // Registrar erro, mas continuar com outras exclusões
        console.log("[ItemModel] Continuando processo de exclusão após erro na busca de itens de maleta");
      } else if (suitcaseItemsData?.length > 0) {
        console.log(`[ItemModel] Encontrados ${suitcaseItemsData.length} itens de maleta para excluir`);
        
        // 4. Para cada item de maleta, excluir suas vendas relacionadas
        for (const suitcaseItem of suitcaseItemsData) {
          console.log(`[ItemModel] Excluindo vendas do item de maleta ${suitcaseItem.id}`);
          const { error: salesError } = await supabase
            .from('suitcase_item_sales')
            .delete()
            .eq('suitcase_item_id', suitcaseItem.id);
          
          if (salesError) {
            console.error(`[ItemModel] Erro ao excluir vendas do item de maleta ${suitcaseItem.id}:`, salesError);
            // Registrar erro, mas continuar com exclusões
            console.log("[ItemModel] Continuando processo de exclusão após erro em vendas de item de maleta");
          } else {
            console.log(`[ItemModel] Vendas do item de maleta ${suitcaseItem.id} excluídas com sucesso`);
          }
        }
        
        // 5. Agora excluir todos os itens de maleta relacionados
        console.log(`[ItemModel] Excluindo ${suitcaseItemsData.length} itens de maleta relacionados ao item:`, id);
        const { error: suitcaseItemsDeleteError } = await supabase
          .from('suitcase_items')
          .delete()
          .eq('inventory_id', id);
          
        if (suitcaseItemsDeleteError) {
          console.error("[ItemModel] Erro ao excluir itens de maleta:", suitcaseItemsDeleteError);
          // Registrar erro, mas continuar com outras exclusões
          console.log("[ItemModel] Continuando processo de exclusão após erro em itens de maleta");
        } else {
          console.log("[ItemModel] Itens de maleta excluídos com sucesso");
        }
      } else {
        console.log("[ItemModel] Nenhum item de maleta encontrado para excluir");
      }
      
      // 6. Verificar e excluir registros em acerto_itens_vendidos
      console.log("[ItemModel] Verificando itens vendidos em acertos para o item:", id);
      const { error: acertoItensError } = await supabase
        .from('acerto_itens_vendidos')
        .delete()
        .eq('inventory_id', id);
      
      if (acertoItensError) {
        console.error("[ItemModel] Erro ao excluir itens vendidos em acertos:", acertoItensError);
        // Registrar erro, mas continuar com outras exclusões
        console.log("[ItemModel] Continuando processo de exclusão após erro em itens vendidos em acertos");
      } else {
        console.log("[ItemModel] Itens vendidos em acertos excluídos com sucesso (se houverem)");
      }
      
      // 7. Excluir movimentações de estoque
      console.log("[ItemModel] Excluindo movimentações de estoque do item:", id);
      const { error: movementsError } = await supabase
        .from('inventory_movements')
        .delete()
        .eq('inventory_id', id);
      
      if (movementsError) {
        console.error("[ItemModel] Erro ao excluir movimentações:", movementsError);
        // Registrar erro, mas continuar com outras exclusões
        console.log("[ItemModel] Continuando processo de exclusão após erro em movimentações de estoque");
      } else {
        console.log("[ItemModel] Movimentações de estoque excluídas com sucesso");
      }
      
      // 8. Excluir fotos relacionadas
      console.log("[ItemModel] Excluindo fotos relacionadas ao item:", id);
      const { error: photoError } = await supabase
        .from('inventory_photos')
        .delete()
        .eq('inventory_id', id);
      
      if (photoError) {
        console.error("[ItemModel] Erro ao excluir fotos:", photoError);
        // Registrar erro, mas continuar com outras exclusões
        console.log("[ItemModel] Continuando processo de exclusão após erro em fotos");
      } else {
        console.log("[ItemModel] Fotos excluídas com sucesso");
      }
      
      // 9. Verificar e excluir registros de itens danificados
      console.log("[ItemModel] Excluindo registros de itens danificados para o item:", id);
      const { error: damagedItemsError } = await supabase
        .from('inventory_damaged_items')
        .delete()
        .eq('inventory_id', id);
      
      if (damagedItemsError) {
        console.error("[ItemModel] Erro ao excluir registros de itens danificados:", damagedItemsError);
        // Registrar erro, mas continuar com outras exclusões
        console.log("[ItemModel] Continuando processo de exclusão após erro em itens danificados");
      } else {
        console.log("[ItemModel] Registros de itens danificados excluídos com sucesso (se houverem)");
      }
      
      // 10. Verificação final - buscar novamente todas as dependências para garantir que foram removidas
      // Esta etapa é crítica para validar se realmente todas as dependências foram tratadas
      
      // 10.1 Verificar se ainda existem etiquetas
      const { data: remainingLabels, error: labelsCheckError } = await supabase
        .from('inventory_label_history')
        .select('count')
        .eq('inventory_id', id)
        .count();
      
      if (labelsCheckError) {
        console.error("[ItemModel] Erro ao verificar etiquetas remanescentes:", labelsCheckError);
      } else if (remainingLabels && remainingLabels.count > 0) {
        console.error(`[ItemModel] ALERTA: Ainda existem ${remainingLabels.count} etiquetas relacionadas ao item!`);
        // Tentar excluir novamente
        await supabase.from('inventory_label_history').delete().eq('inventory_id', id);
      }
      
      // 10.2 Verificar se ainda existem itens de maleta
      const { data: remainingSuitcaseItems, error: suitcaseItemsCheckError } = await supabase
        .from('suitcase_items')
        .select('count')
        .eq('inventory_id', id)
        .count();
      
      if (suitcaseItemsCheckError) {
        console.error("[ItemModel] Erro ao verificar itens de maleta remanescentes:", suitcaseItemsCheckError);
      } else if (remainingSuitcaseItems && remainingSuitcaseItems.count > 0) {
        console.error(`[ItemModel] ALERTA: Ainda existem ${remainingSuitcaseItems.count} itens de maleta relacionados ao item!`);
        // Tentar excluir novamente
        await supabase.from('suitcase_items').delete().eq('inventory_id', id);
      }
      
      // 11. Finalmente, excluir o item do inventário
      console.log("[ItemModel] Excluindo o item do inventário:", id);
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error("[ItemModel] Erro ao excluir item do inventário:", error);
        throw new Error(`Erro ao excluir item do inventário: ${error.message}`);
      }
      
      console.log("[ItemModel] Item excluído com sucesso:", id);
    } catch (error) {
      console.error("[ItemModel] Erro durante o processo de exclusão do item:", error);
      throw error;
    }
  }

  // Arquivar item (marcar como arquivado)
  static async archiveItem(id: string): Promise<void> {
    try {
      console.log("Arquivando item:", id);
      const { error } = await supabase
        .from('inventory')
        .update({ archived: true })
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error("Erro ao arquivar item:", error);
      throw error;
    }
  }

  // Restaurar item arquivado
  static async restoreItem(id: string): Promise<void> {
    try {
      console.log("Restaurando item:", id);
      const { error } = await supabase
        .from('inventory')
        .update({ archived: false })
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error("Erro ao restaurar item:", error);
      throw error;
    }
  }
}
