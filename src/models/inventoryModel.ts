
import { supabase } from "@/integrations/supabase/client";

// Interface para o item do inventário
export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  description?: string;
  price: number;
  cost_price?: number;
  quantity: number;
  category_id?: string;
  category_name?: string;
  supplier_id?: string;
  supplier_name?: string;
  created_at?: string;
  updated_at?: string;
  photos?: { photo_url: string }[];
  photo_url?: string;
  status: 'available' | 'reserved' | 'sold' | 'damaged';
  suitcase_id?: string;
}

export class InventoryModel {
  // Método para buscar um item do inventário pelo ID
  static async getInventoryItemById(id: string): Promise<InventoryItem | null> {
    if (!id) throw new Error("ID do item é necessário");
    
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        *,
        inventory_categories (
          name
        ),
        suppliers (
          name
        )
      `)
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    
    if (!data) return null;
    
    return {
      ...data,
      category_name: data.inventory_categories?.name,
      supplier_name: data.suppliers?.name
    };
  }

  // Método para atualizar o status de um item no inventário
  static async updateInventoryItemStatus(id: string, status: 'available' | 'reserved' | 'sold' | 'damaged', suitcaseId?: string): Promise<InventoryItem> {
    if (!id) throw new Error("ID do item é necessário");
    
    const updates: any = { 
      status,
      updated_at: new Date().toISOString()
    };
    
    // Se houver suitcaseId e o status for reserved, vincular ao ID da maleta
    if (suitcaseId && status === 'reserved') {
      updates.suitcase_id = suitcaseId;
    }
    
    // Se o status não for reserved, remover o vínculo com a maleta
    if (status !== 'reserved') {
      updates.suitcase_id = null;
    }
    
    const { data, error } = await supabase
      .from('inventory')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error("Erro ao atualizar status do item no inventário: nenhum dado retornado");
    
    return data;
  }

  // Método para obter itens da maleta
  static async getInventoryItemsBySuitcaseId(suitcaseId: string): Promise<InventoryItem[]> {
    if (!suitcaseId) throw new Error("ID da maleta é necessário");
    
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        *,
        inventory_categories (
          name
        ),
        suppliers (
          name
        )
      `)
      .eq('suitcase_id', suitcaseId)
      .eq('status', 'reserved');
    
    if (error) throw error;
    
    if (!data) return [];
    
    return data.map(item => ({
      ...item,
      category_name: item.inventory_categories?.name,
      supplier_name: item.suppliers?.name
    }));
  }

  // Método para retornar um item da maleta para o estoque
  static async returnItemFromSuitcase(id: string): Promise<InventoryItem> {
    return await this.updateInventoryItemStatus(id, 'available');
  }
}
