
import { supabase } from "@/integrations/supabase/client";

// Interfaces para tipagem
export interface InventoryPhoto {
  id: string;
  inventory_id: string;
  photo_url: string;
  is_primary: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryCategory {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface PlatingType {
  id: string;
  name: string;
  gram_value: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_info?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  category_id: string;
  quantity: number;
  price: number;
  unit_cost: number;
  suggested_price: number;
  weight?: number;
  width?: number;
  height?: number;
  depth?: number;
  min_stock: number;
  supplier_id?: string;
  popularity: number;
  plating_type_id?: string;
  material_weight?: number;
  packaging_cost?: number;
  gram_value?: number;
  profit_margin?: number;
  reseller_commission?: number;
  markup_percentage?: number;
  created_at?: string;
  updated_at?: string;
  category_name?: string;
  supplier_name?: string;
  plating_type_name?: string;
  photos?: InventoryPhoto[];
  inventory_photos?: InventoryPhoto[];
}

export interface InventoryFilters {
  search?: string;
  category_id?: string;
  min_price?: number;
  max_price?: number;
  status?: 'in_stock' | 'out_of_stock' | 'low_stock' | string;
}

export class InventoryModel {
  // Buscar todos os itens do inventário
  static async getAllItems(filters?: InventoryFilters): Promise<InventoryItem[]> {
    let query = supabase
      .from('inventory')
      .select(`
        *,
        category_name:inventory_categories(name),
        supplier_name:suppliers(name),
        inventory_photos:inventory_photos(id, photo_url, is_primary)
      `);

    // Aplicar filtros se fornecidos
    if (filters) {
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,barcode.ilike.%${filters.search}%`);
      }
      
      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
      }
      
      if (filters.min_price) {
        query = query.gte('price', filters.min_price);
      }
      
      if (filters.max_price) {
        query = query.lte('price', filters.max_price);
      }
      
      if (filters.status === 'in_stock') {
        query = query.gt('quantity', 0);
      } else if (filters.status === 'out_of_stock') {
        query = query.eq('quantity', 0);
      } else if (filters.status === 'low_stock') {
        query = query.lt('quantity', supabase.rpc('get_min_stock_column'));
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Processar dados para mapear fotos de maneira consistente
    const items = data?.map(item => {
      // Extrair fotos
      const photos = item.inventory_photos || [];
      
      // Processar fotos para retornar no formato esperado
      const processedPhotos: InventoryPhoto[] = photos.map((photo: any) => ({
        id: photo.id,
        inventory_id: item.id,
        photo_url: photo.photo_url,
        is_primary: photo.is_primary || false
      }));
      
      return {
        ...item,
        photos: processedPhotos, // Adicionar fotos processadas
        category_name: item.category_name?.name || '',
        supplier_name: item.supplier_name?.name || ''
      };
    });
    
    return items || [];
  }

  // Buscar um item pelo ID
  static async getItemById(id: string): Promise<InventoryItem | null> {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        *,
        category_name:inventory_categories(name),
        supplier_name:suppliers(name),
        inventory_photos:inventory_photos(id, photo_url, is_primary)
      `)
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    
    if (!data) return null;
    
    // Processar fotos
    const photos = data.inventory_photos || [];
    const processedPhotos: InventoryPhoto[] = photos.map((photo: any) => ({
      id: photo.id,
      inventory_id: data.id,
      photo_url: photo.photo_url,
      is_primary: photo.is_primary || false
    }));
    
    return {
      ...data,
      photos: processedPhotos,
      category_name: data.category_name?.name || '',
      supplier_name: data.supplier_name?.name || ''
    };
  }

  // Criar novo item
  static async createItem(itemData: Partial<InventoryItem>): Promise<InventoryItem> {
    // Validar dados obrigatórios
    if (!itemData.name) throw new Error("Nome do item é obrigatório");
    if (!itemData.category_id) throw new Error("Categoria é obrigatória");
    if (itemData.price === undefined) throw new Error("Preço é obrigatório");
    
    const { data, error } = await supabase
      .from('inventory')
      .insert({
        name: itemData.name,
        sku: itemData.sku,
        barcode: itemData.barcode,
        category_id: itemData.category_id,
        quantity: itemData.quantity || 0,
        price: itemData.price,
        unit_cost: itemData.unit_cost || 0,
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
    
    return data;
  }

  // Atualizar item existente
  static async updateItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    // Remover propriedades que não fazem parte da tabela
    const { photos, category_name, supplier_name, plating_type_name, inventory_photos, ...cleanUpdates } = updates;
    
    const { data, error } = await supabase
      .from('inventory')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error("Erro ao atualizar item: nenhum dado retornado");
    
    return data;
  }

  // Excluir item
  static async deleteItem(id: string): Promise<void> {
    // Primeiro excluir fotos relacionadas
    const { error: photoError } = await supabase
      .from('inventory_photos')
      .delete()
      .eq('inventory_id', id);
    
    if (photoError) throw photoError;
    
    // Depois excluir o item
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Atualizar fotos de um item
  static async updateItemPhotos(itemId: string, photos: { id?: string; photo_url: string; is_primary?: boolean }[]): Promise<InventoryPhoto[]> {
    // Se não houver fotos, não fazer nada
    if (!photos || photos.length === 0) return [];
    
    // Excluir fotos antigas
    const { error: deleteError } = await supabase
      .from('inventory_photos')
      .delete()
      .eq('inventory_id', itemId);
    
    if (deleteError) throw deleteError;
    
    // Inserir novas fotos
    const newPhotos = photos.map(photo => ({
      inventory_id: itemId,
      photo_url: photo.photo_url,
      is_primary: photo.is_primary || false
    }));
    
    const { data, error } = await supabase
      .from('inventory_photos')
      .insert(newPhotos)
      .select();
    
    if (error) throw error;
    
    return data || [];
  }

  // Buscar fotos de um item
  static async getItemPhotos(itemId: string): Promise<InventoryPhoto[]> {
    const { data, error } = await supabase
      .from('inventory_photos')
      .select('*')
      .eq('inventory_id', itemId);
    
    if (error) throw error;
    
    return data || [];
  }

  // Verificar se um item está em uso em alguma maleta
  static async checkItemInSuitcase(itemId: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('suitcase_items')
      .select('*', { count: 'exact', head: true })
      .eq('inventory_id', itemId);
    
    if (error) throw error;
    
    return (count || 0) > 0;
  }

  // CATEGORIAS
  
  // Buscar todas as categorias
  static async getAllCategories(): Promise<InventoryCategory[]> {
    const { data, error } = await supabase
      .from('inventory_categories')
      .select('*')
      .order('name');
    
    if (error) throw error;
    
    return data || [];
  }

  // Criar categoria
  static async createCategory(categoryData: { name: string }): Promise<InventoryCategory> {
    const { data, error } = await supabase
      .from('inventory_categories')
      .insert(categoryData)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error("Erro ao criar categoria: nenhum dado retornado");
    
    return data;
  }

  // Atualizar categoria
  static async updateCategory(id: string, updates: { name: string }): Promise<InventoryCategory> {
    const { data, error } = await supabase
      .from('inventory_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error("Erro ao atualizar categoria: nenhum dado retornado");
    
    return data;
  }

  // Excluir categoria
  static async deleteCategory(id: string): Promise<void> {
    // Verificar se tem itens relacionados
    const { count, error: countError } = await supabase
      .from('inventory')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id);
    
    if (countError) throw countError;
    
    if ((count || 0) > 0) {
      throw new Error("Não é possível excluir esta categoria pois existem itens associados a ela");
    }
    
    const { error } = await supabase
      .from('inventory_categories')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // TIPOS DE BANHO
  
  // Buscar todos os tipos de banho
  static async getAllPlatingTypes(): Promise<PlatingType[]> {
    const { data, error } = await supabase
      .from('plating_types')
      .select('*')
      .order('name');
    
    if (error) throw error;
    
    return data || [];
  }

  // Criar tipo de banho
  static async createPlatingType(typeData: { name: string; gram_value: number; description?: string }): Promise<PlatingType> {
    const { data, error } = await supabase
      .from('plating_types')
      .insert(typeData)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error("Erro ao criar tipo de banho: nenhum dado retornado");
    
    return data;
  }

  // Atualizar tipo de banho
  static async updatePlatingType(id: string, updates: Partial<PlatingType>): Promise<PlatingType> {
    const { data, error } = await supabase
      .from('plating_types')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error("Erro ao atualizar tipo de banho: nenhum dado retornado");
    
    return data;
  }

  // Excluir tipo de banho
  static async deletePlatingType(id: string): Promise<void> {
    // Verificar se tem itens relacionados
    const { count, error: countError } = await supabase
      .from('inventory')
      .select('*', { count: 'exact', head: true })
      .eq('plating_type_id', id);
    
    if (countError) throw countError;
    
    if ((count || 0) > 0) {
      throw new Error("Não é possível excluir este tipo de banho pois existem itens associados a ele");
    }
    
    const { error } = await supabase
      .from('plating_types')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // FORNECEDORES
  
  // Buscar todos os fornecedores
  static async getAllSuppliers(): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');
    
    if (error) throw error;
    
    return data || [];
  }

  // Criar fornecedor
  static async createSupplier(supplierData: { name: string; contact_info?: string }): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .insert(supplierData)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error("Erro ao criar fornecedor: nenhum dado retornado");
    
    return data;
  }

  // Atualizar fornecedor
  static async updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error("Erro ao atualizar fornecedor: nenhum dado retornado");
    
    return data;
  }

  // Excluir fornecedor
  static async deleteSupplier(id: string): Promise<void> {
    // Verificar se tem itens relacionados
    const { count, error: countError } = await supabase
      .from('inventory')
      .select('*', { count: 'exact', head: true })
      .eq('supplier_id', id);
    
    if (countError) throw countError;
    
    if ((count || 0) > 0) {
      throw new Error("Não é possível excluir este fornecedor pois existem itens associados a ele");
    }
    
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
  
  // Estatísticas de Inventário
  static async getTotalInventory(): Promise<{ totalItems: number; totalValue: number }> {
    // Obter contagem total de itens e valor total
    const { data, error } = await supabase
      .from('inventory')
      .select('quantity, price');
    
    if (error) throw error;
    
    const totalItems = data.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalValue = data.reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0), 0);
    
    return { totalItems, totalValue };
  }
}
