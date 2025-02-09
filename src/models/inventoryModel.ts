
import { supabase } from "@/integrations/supabase/client";

// Interface para item do inventário
export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  created_at?: string;
  updated_at?: string;
}

export class InventoryModel {
  // Buscar total de itens em estoque
  static async getTotalInventory(): Promise<number> {
    const { data, error } = await supabase
      .from('inventory')
      .select('quantity');
    
    if (error) throw error;
    
    return data.reduce((sum, item) => sum + item.quantity, 0);
  }

  // Buscar todos os itens do inventário
  static async getAllItems(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('category', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  // Criar novo item
  static async createItem(item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventory')
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Atualizar item existente
  static async updateItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventory')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Deletar item
  static async deleteItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
