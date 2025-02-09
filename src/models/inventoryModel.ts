
import { supabase } from "@/integrations/supabase/client";

// Interface para fornecedor
export interface Supplier {
  id: string;
  name: string;
  contact_info?: string;
  created_at?: string;
  updated_at?: string;
}

// Interface para categoria do inventário
export interface InventoryCategory {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

// Interface para item do inventário
export interface InventoryItem {
  id: string;
  name: string;
  category_id: string;
  quantity: number;
  price: number;
  sku?: string;
  barcode?: string;
  unit_cost: number;
  suggested_price: number;
  weight?: number;
  width?: number;
  height?: number;
  depth?: number;
  min_stock: number;
  supplier_id?: string;
  popularity: number;
  created_at?: string;
  updated_at?: string;
  // Propriedades virtuais para exibição
  category_name?: string;
  supplier_name?: string;
}

// Interface para movimentação de estoque
export interface InventoryMovement {
  id: string;
  inventory_id: string;
  user_id: string;
  quantity: number;
  movement_type: 'entrada' | 'saida';
  reason: string;
  unit_cost: number;
  notes?: string;
  created_at: string;
}

// Interface para filtros de busca
export interface InventoryFilters {
  searchTerm?: string;
  category?: string;
  supplier?: string;
  minQuantity?: number;
  maxQuantity?: number;
  status?: 'available' | 'out_of_stock' | 'low_stock';
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
      .select(`
        *,
        inventory_categories (
          name
        ),
        suppliers (
          name
        )
      `);

    // Aplicar filtros se existirem
    if (filters) {
      if (filters.searchTerm) {
        query = query.or(`name.ilike.%${filters.searchTerm}%,sku.ilike.%${filters.searchTerm}%,barcode.ilike.%${filters.searchTerm}%`);
      }
      if (filters.category) {
        query = query.eq('category_id', filters.category);
      }
      if (filters.supplier) {
        query = query.eq('supplier_id', filters.supplier);
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
      } else if (filters.status === 'low_stock') {
        query = query.lt('quantity', query.ref('min_stock'));
      }
    }

    const { data, error } = await query;
    
    if (error) throw error;

    // Mapear os resultados para incluir o nome da categoria e fornecedor
    return (data || []).map(item => ({
      ...item,
      category_name: item.inventory_categories?.name,
      supplier_name: item.suppliers?.name
    }));
  }

  // Buscar fornecedores
  static async getAllSuppliers(): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  // Criar novo fornecedor
  static async createSupplier(supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .insert(supplier)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Buscar movimentações de estoque de um item
  static async getItemMovements(inventoryId: string): Promise<InventoryMovement[]> {
    const { data, error } = await supabase
      .from('inventory_movements')
      .select('*')
      .eq('inventory_id', inventoryId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Criar nova categoria
  static async createCategory(name: string): Promise<InventoryCategory> {
    const { data, error } = await supabase
      .from('inventory_categories')
      .insert({ name })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Atualizar categoria
  static async updateCategory(id: string, name: string): Promise<InventoryCategory> {
    const { data, error } = await supabase
      .from('inventory_categories')
      .update({ name })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Deletar categoria
  static async deleteCategory(id: string): Promise<void> {
    // Verificar se existem itens usando esta categoria
    const { data: items } = await supabase
      .from('inventory')
      .select('id')
      .eq('category_id', id)
      .limit(1);

    if (items && items.length > 0) {
      throw new Error("Não é possível excluir uma categoria que possui itens vinculados");
    }

    const { error } = await supabase
      .from('inventory_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Criar novo item
  static async createItem(item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at' | 'sku' | 'barcode' | 'popularity'>): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventory')
      .insert({
        ...item,
        popularity: 0
      })
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
