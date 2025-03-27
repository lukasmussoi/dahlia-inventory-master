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
      unit_cost: itemData.unit_cost, 
      tipo_unit_cost: typeof itemData.unit_cost,
      raw_cost: itemData.raw_cost,
      tipo_raw_cost: typeof itemData.raw_cost
    });
    
    // Converter para número caso seja string
    const unitCost = typeof itemData.unit_cost === 'string' 
      ? parseFloat(itemData.unit_cost) 
      : itemData.unit_cost;
      
    const rawCost = typeof itemData.raw_cost === 'string'
      ? parseFloat(itemData.raw_cost)
      : itemData.raw_cost;
    
    const { data, error } = await supabase
      .from('inventory')
      .insert({
        name: itemData.name,
        sku: itemData.sku,
        barcode: itemData.barcode,
        category_id: itemData.category_id,
        quantity: itemData.quantity || 0,
        price: itemData.price,
        unit_cost: unitCost,
        raw_cost: rawCost || 0,
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
      unit_cost: data.unit_cost,
      raw_cost: data.raw_cost ?? 0 // Agora podemos acessar diretamente
    });
    
    // Garantir que o objeto retornado tenha a propriedade raw_cost
    return {
      ...data,
      raw_cost: data.raw_cost ?? 0 // Agora podemos acessar diretamente
    };
  }

  // Atualizar item existente
  static async updateItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    const { photos, category_name, supplier_name, plating_type_name, inventory_photos, ...cleanUpdates } = updates;
    
    // Log para verificar valores antes de atualizar
    console.log("[ItemModel] Valores antes de atualizar no banco:", {
      unit_cost: cleanUpdates.unit_cost, 
      tipo_unit_cost: typeof cleanUpdates.unit_cost,
      raw_cost: cleanUpdates.raw_cost,
      tipo_raw_cost: typeof cleanUpdates.raw_cost
    });
    
    // Converter para número caso seja string
    if (cleanUpdates.unit_cost !== undefined) {
      cleanUpdates.unit_cost = typeof cleanUpdates.unit_cost === 'string' 
        ? parseFloat(cleanUpdates.unit_cost)
        : cleanUpdates.unit_cost;
    }
    
    if (cleanUpdates.raw_cost !== undefined) {
      cleanUpdates.raw_cost = typeof cleanUpdates.raw_cost === 'string'
        ? parseFloat(cleanUpdates.raw_cost)
        : cleanUpdates.raw_cost;
    } else {
      // Se não foi fornecido, manter como null/undefined para não alterar o valor existente
      delete cleanUpdates.raw_cost;
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
      unit_cost: data.unit_cost,
      raw_cost: data.raw_cost ?? 0 // Agora podemos acessar diretamente
    });
    
    // Garantir que o objeto retornado tenha a propriedade raw_cost
    return {
      ...data,
      raw_cost: data.raw_cost ?? 0 // Agora podemos acessar diretamente
    };
  }

  // Excluir item
  static async deleteItem(id: string): Promise<void> {
    try {
      console.log("Iniciando processo de exclusão do item:", id);
      
      // 1. Excluir histórico de etiquetas relacionadas
      console.log("Excluindo histórico de etiquetas relacionadas ao item:", id);
      await LabelModel.deleteLabelHistory(id);
      
      // 2. Excluir movimentações relacionadas
      console.log("Excluindo movimentações de estoque relacionadas ao item:", id);
      const { error: movementsError } = await supabase
        .from('inventory_movements')
        .delete()
        .eq('inventory_id', id);
      
      if (movementsError) {
        console.error("Erro ao excluir movimentações:", movementsError);
        throw movementsError;
      }
      
      // 3. Excluir fotos relacionadas
      console.log("Excluindo fotos relacionadas ao item:", id);
      const { error: photoError } = await supabase
        .from('inventory_photos')
        .delete()
        .eq('inventory_id', id);
      
      if (photoError) {
        console.error("Erro ao excluir fotos:", photoError);
        throw photoError;
      }
      
      // 4. Verificar se o item tem relação com vendas em acertos
      const { data: salesData, error: salesCheckError } = await supabase
        .from('acerto_itens_vendidos')
        .select('id')
        .eq('inventory_id', id);
        
      if (salesCheckError) {
        console.error("Erro ao verificar vendas relacionadas:", salesCheckError);
        throw salesCheckError;
      }
      
      // 5. Se houver vendas relacionadas, excluí-las
      if (salesData && salesData.length > 0) {
        console.log(`Excluindo ${salesData.length} registros de vendas relacionados ao item:`, id);
        const { error: salesDeleteError } = await supabase
          .from('acerto_itens_vendidos')
          .delete()
          .eq('inventory_id', id);
          
        if (salesDeleteError) {
          console.error("Erro ao excluir vendas relacionadas:", salesDeleteError);
          throw salesDeleteError;
        }
      }
      
      // 6. Verificar se o item está em alguma maleta
      const { data: suitcaseItemsData, error: suitcaseItemsCheckError } = await supabase
        .from('suitcase_items')
        .select('id')
        .eq('inventory_id', id);
        
      if (suitcaseItemsCheckError) {
        console.error("Erro ao verificar itens de maleta relacionados:", suitcaseItemsCheckError);
        throw suitcaseItemsCheckError;
      }
      
      // 7. Se o item estiver em maletas, excluir essas relações
      if (suitcaseItemsData && suitcaseItemsData.length > 0) {
        console.log(`Excluindo ${suitcaseItemsData.length} registros de itens de maleta relacionados ao item:`, id);
        const { error: suitcaseItemsDeleteError } = await supabase
          .from('suitcase_items')
          .delete()
          .eq('inventory_id', id);
          
        if (suitcaseItemsDeleteError) {
          console.error("Erro ao excluir itens de maleta relacionados:", suitcaseItemsDeleteError);
          throw suitcaseItemsDeleteError;
        }
      }
      
      // 8. Verificar e excluir registros de itens danificados
      console.log("Verificando e excluindo registros de itens danificados para o item:", id);
      const { error: damagedItemsError } = await supabase
        .from('inventory_damaged_items')
        .delete()
        .eq('inventory_id', id);
      
      if (damagedItemsError) {
        console.error("Erro ao excluir registros de itens danificados:", damagedItemsError);
        throw damagedItemsError;
      }
      
      // 9. Finalmente, excluir o item do inventário
      console.log("Excluindo o item do inventário:", id);
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error("Erro ao excluir item do inventário:", error);
        throw error;
      }
      
      console.log("Item excluído com sucesso:", id);
    } catch (error) {
      console.error("Erro durante o processo de exclusão do item:", error);
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
