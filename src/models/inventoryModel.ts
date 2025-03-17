
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
  profit_margin?: number;
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
  // Propriedades adicionais usadas nos componentes
  searchTerm?: string;
  category?: string;
  minQuantity?: number;
  maxQuantity?: number;
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
      status: 'available' // Default status if not present
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
      status: status // Explicitar o status no retorno
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
      status: 'reserved' // Explicit status for items in suitcases
    }));
  }

  // Método para retornar um item da maleta para o estoque
  static async returnItemFromSuitcase(id: string): Promise<InventoryItem> {
    return await this.updateInventoryItemStatus(id, 'available');
  }

  // Método para obter todos os itens do inventário
  static async getInventoryItems(filters?: InventoryFilters): Promise<InventoryItem[]> {
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
    
    if (filters) {
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.search || filters.searchTerm) {
        const searchValue = filters.search || filters.searchTerm;
        query = query.ilike('name', `%${searchValue}%`);
      }
      
      if (filters.category_id || filters.category) {
        const categoryId = filters.category_id || filters.category;
        if (categoryId && categoryId !== 'all') {
          query = query.eq('category_id', categoryId);
        }
      }
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data ? data.map(item => ({
      ...item,
      category_name: item.inventory_categories?.name,
      supplier_name: item.suppliers?.name,
      status: item.status || 'available' // Default status
    })) : [];
  }

  // Método para atualizar um item
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
      status: data.status || 'available' // Default status
    };
  }

  // Método para obter todos os itens
  static async getAllItems(filters?: InventoryFilters): Promise<InventoryItem[]> {
    return this.getInventoryItems(filters);
  }

  // Método para obter todas as categorias
  static async getAllCategories(): Promise<InventoryCategory[]> {
    const { data, error } = await supabase
      .from('inventory_categories')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  // Método para verificar se um item está em uma maleta
  static async checkItemInSuitcase(id: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('inventory')
      .select('suitcase_id, status')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    
    // Safely check if data exists, has suitcase_id and correct status
    return !!(data && data.suitcase_id && data.status === 'reserved');
  }

  // Método para deletar um item
  static async deleteItem(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

  // Método para deletar uma categoria
  static async deleteCategory(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('inventory_categories')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

  // Método para obter todos os fornecedores
  static async getAllSuppliers(): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  // Método para obter as fotos de um item
  static async getItemPhotos(id: string): Promise<{ url: string; isPrimary: boolean }[]> {
    const { data, error } = await supabase
      .from('inventory_photos')
      .select('*')
      .eq('inventory_id', id);
    
    if (error) throw error;
    
    return data ? data.map(photo => ({
      url: photo.photo_url,
      isPrimary: photo.is_primary
    })) : [];
  }

  // Método para criar um tipo de banho
  static async createPlatingType(data: Partial<PlatingType>): Promise<PlatingType> {
    if (!data.name) {
      throw new Error("Nome é obrigatório para o tipo de banho");
    }
    
    const { data: newData, error } = await supabase
      .from('plating_types')
      .insert([data]) // Fixed: was passing an array of objects
      .select()
      .single();
    
    if (error) throw error;
    if (!newData) throw new Error("Erro ao criar tipo de banho");
    
    return newData;
  }

  // Método para obter todos os tipos de banho
  static async getAllPlatingTypes(): Promise<PlatingType[]> {
    const { data, error } = await supabase
      .from('plating_types')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  // Método para deletar um tipo de banho
  static async deletePlatingType(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('plating_types')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

  // Método para obter o valor total do inventário
  static async getTotalInventory(): Promise<number> {
    const { data, error } = await supabase
      .from('inventory')
      .select('price, quantity');
    
    if (error) throw error;
    
    if (!data) return 0;
    
    return data.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  }

  // Método para criar uma categoria
  static async createCategory(name: string): Promise<InventoryCategory> {
    const { data, error } = await supabase
      .from('inventory_categories')
      .insert([{ name }])
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error("Erro ao criar categoria");
    
    return data;
  }

  // Método para atualizar uma categoria
  static async updateCategory(id: string, name: string): Promise<InventoryCategory> {
    const { data, error } = await supabase
      .from('inventory_categories')
      .update({ name })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error("Erro ao atualizar categoria");
    
    return data;
  }

  // Método para atualizar as fotos de um item
  static async updateItemPhotos(itemId: string, photos: File[], primaryIndex: number | null): Promise<{ url: string; isPrimary: boolean }[]> {
    // Simulação - na implementação real, faria upload das fotos para o Supabase Storage
    return photos.map((_, index) => ({
      url: 'https://exemplo.com/foto.jpg',
      isPrimary: index === primaryIndex
    }));
  }

  // Método para criar um item
  static async createItem(itemData: Partial<InventoryItem>): Promise<InventoryItem> {
    // Ensure essential properties are present
    if (!itemData.name || !itemData.category_id || !itemData.price) {
      throw new Error("Nome, categoria e preço são obrigatórios");
    }
    
    // Create a correctly typed object for Supabase
    const inventory = {
      name: itemData.name,
      category_id: itemData.category_id,
      price: itemData.price,
      quantity: itemData.quantity || 0,
      description: itemData.description,
      cost_price: itemData.cost_price,
      supplier_id: itemData.supplier_id,
      unit_cost: itemData.unit_cost,
      suggested_price: itemData.suggested_price,
      weight: itemData.weight,
      width: itemData.width,
      height: itemData.height,
      depth: itemData.depth,
      min_stock: itemData.min_stock,
      plating_type_id: itemData.plating_type_id,
      material_weight: itemData.material_weight,
      packaging_cost: itemData.packaging_cost,
      markup_percentage: itemData.markup_percentage,
      profit_margin: itemData.profit_margin,
      // Not including status because it's set by Supabase trigger
    };
    
    const { data, error } = await supabase
      .from('inventory')
      .insert([inventory])
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error("Erro ao criar item");
    
    return {
      ...data,
      status: 'available' // Default status for new items
    };
  }
}
