
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

// Interface para filtros de busca
export interface InventoryFilters {
  searchTerm?: string;
  category?: string;
  minQuantity?: number;
  maxQuantity?: number;
  status?: 'available' | 'out_of_stock';
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

  // Buscar todos os itens do inventário com filtros
  static async getAllItems(filters?: InventoryFilters): Promise<InventoryItem[]> {
    let query = supabase
      .from('inventory')
      .select('*');

    // Aplicar filtros se existirem
    if (filters) {
      if (filters.searchTerm) {
        query = query.or(`name.ilike.%${filters.searchTerm}%,category.ilike.%${filters.searchTerm}%`);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.minQuantity !== undefined) {
        query = query.gte('quantity', filters.minQuantity);
      }
      if (filters.maxQuantity !== undefined) {
        query = query.lte('quantity', filters.maxQuantity);
      }
      if (filters.status === 'out_of_stock') {
        query = query.eq('quantity', 0);
      } else if (filters.status === 'available') {
        query = query.gt('quantity', 0);
      }
    }

    const { data, error } = await query.order('category', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  // Buscar categorias únicas
  static async getUniqueCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('inventory')
      .select('category')
      .order('category');
    
    if (error) throw error;
    
    // Remover duplicatas
    return [...new Set(data.map(item => item.category))];
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

  // Verificar se item está vinculado a uma maleta
  static async checkItemInSuitcase(id: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('suitcase_items')
      .select('id')
      .eq('inventory_id', id)
      .eq('status', 'in_possession')
      .limit(1);

    if (error) throw error;
    return data.length > 0;
  }
}
