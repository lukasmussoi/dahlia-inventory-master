
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
  // Propriedades adicionais para completar os tipos
  min_stock?: number;
  unit_cost?: number;
  suggested_price?: number;
  weight?: number;
  width?: number;
  height?: number;
  depth?: number;
  markup_percentage?: number;
  plating_type_id?: string;
  material_weight?: number;
  packaging_cost?: number;
  barcode?: string;
}

// Interface para categoria de inventário
export interface InventoryCategory {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

// Interface para filtros de inventário
export interface InventoryFilters {
  search?: string;
  category_id?: string;
  min_price?: number;
  max_price?: number;
  status?: string;
}

// Interface para fornecedor
export interface Supplier {
  id: string;
  name: string;
  contact_info?: string;
  created_at?: string;
  updated_at?: string;
}

// Interface para tipo de banho
export interface PlatingType {
  id: string;
  name: string;
  gram_value: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
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
      supplier_name: data.suppliers?.name,
      status: 'available' // Define um status padrão para correção temporária
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
    
    return {
      ...data,
      status: status // Garantir que o status está definido
    };
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
      supplier_name: item.suppliers?.name,
      status: 'reserved' // Definir status como reserved para itens em maletas
    }));
  }

  // Método para retornar um item da maleta para o estoque
  static async returnItemFromSuitcase(id: string): Promise<InventoryItem> {
    return await this.updateInventoryItemStatus(id, 'available');
  }

  // Método para obter todos os itens do inventário
  static async getInventoryItems(status?: string): Promise<InventoryItem[]> {
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
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data ? data.map(item => ({
      ...item,
      category_name: item.inventory_categories?.name,
      supplier_name: item.suppliers?.name,
      status: item.status || 'available' // Garantir que o status está definido
    })) : [];
  }

  // Métodos auxiliares para compatibilidade com o código existente
  static async updateItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventory')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error("Erro ao atualizar item no inventário");
    
    return {
      ...data,
      status: data.status || 'available' // Garantir que o status está definido
    };
  }

  // Stub para métodos que ainda não foram implementados mas são necessários para a compatibilidade
  static async getAllItems() { return []; }
  static async getAllCategories() { return []; }
  static async checkItemInSuitcase() { return false; }
  static async deleteItem() { return true; }
  static async deleteCategory() { return true; }
  static async getAllSuppliers() { return []; }
  static async getItemPhotos() { return []; }
  static async createPlatingType() { return {}; }
  static async getAllPlatingTypes() { return []; }
  static async deletePlatingType() { return true; }
  static async getTotalInventory() { return 0; }
  static async createCategory() { return {}; }
  static async updateCategory() { return {}; }
  static async updateItemPhotos() { return []; }
  static async createItem() { return { id: '', name: '', sku: '', price: 0, quantity: 0, status: 'available' as const }; }
}
