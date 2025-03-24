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
  archived?: boolean;
}

export interface InventoryFilters {
  search?: string;
  category_id?: string;
  min_price?: number;
  max_price?: number;
  status?: 'in_stock' | 'out_of_stock' | 'low_stock' | 'archived' | string;
  minQuantity?: number;
  maxQuantity?: number;
  searchTerm?: string;
  category?: string;
  showArchived?: boolean;
}

export class InventoryModel {
  // Buscar todos os itens do inventário
  static async getAllItems(filters?: InventoryFilters): Promise<InventoryItem[]> {
    console.log("getAllItems chamado com filtros:", filters);
    
    let query = supabase
      .from('inventory')
      .select(`
        *,
        category_name:inventory_categories(name),
        supplier_name:suppliers(name),
        plating_type_name:plating_types(name),
        inventory_photos:inventory_photos(id, photo_url, is_primary)
      `);
    
    // Aplicar filtro de arquivados
    if (filters?.status === 'archived' || filters?.showArchived === true) {
      console.log("Filtrando apenas itens arquivados");
      query = query.eq('archived', true);
    } else {
      // Por padrão, não mostrar itens arquivados
      console.log("Filtrando para excluir itens arquivados");
      query = query.eq('archived', false);
    }
    
    // Aplicar filtros se fornecidos
    if (filters) {
      if (filters.search) {
        console.log("Aplicando filtro de busca:", filters.search);
        query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,barcode.ilike.%${filters.search}%`);
      }
      
      if (filters.category_id && filters.category_id !== 'all') {
        console.log("Aplicando filtro de categoria:", filters.category_id);
        query = query.eq('category_id', filters.category_id);
      }
      
      if (filters.min_price) {
        console.log("Aplicando filtro de preço mínimo:", filters.min_price);
        query = query.gte('price', filters.min_price);
      }
      
      if (filters.max_price) {
        console.log("Aplicando filtro de preço máximo:", filters.max_price);
        query = query.lte('price', filters.max_price);
      }
      
      if (filters.status === 'in_stock') {
        console.log("Aplicando filtro de itens em estoque");
        query = query.gt('quantity', 0);
      } else if (filters.status === 'out_of_stock') {
        console.log("Aplicando filtro de itens sem estoque");
        query = query.eq('quantity', 0);
      } else if (filters.status === 'low_stock') {
        console.log("Aplicando filtro de itens com estoque baixo");
        query = query.lt('quantity', 5).gt('quantity', 0);
      }

      if (filters.minQuantity !== undefined) {
        console.log("Aplicando filtro de quantidade mínima:", filters.minQuantity);
        query = query.gte('quantity', filters.minQuantity);
      }
      
      if (filters.maxQuantity !== undefined) {
        console.log("Aplicando filtro de quantidade máxima:", filters.maxQuantity);
        query = query.lte('quantity', filters.maxQuantity);
      }
    }

    console.log("Executando consulta ao banco de dados");
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error("Erro ao buscar itens:", error);
      throw error;
    }
    
    console.log(`Retornados ${data?.length || 0} itens do inventário`);
    
    const items = data?.map(item => {
      const photosData = item.inventory_photos || [];
      const processedPhotos: InventoryPhoto[] = photosData.map((photo: any) => ({
        id: photo.id,
        inventory_id: item.id,
        photo_url: photo.photo_url,
        is_primary: photo.is_primary || false
      }));
      
      const processedItem: InventoryItem = {
        ...item,
        photos: processedPhotos,
        inventory_photos: processedPhotos,
        category_name: item.category_name?.name || '',
        supplier_name: item.supplier_name?.name || '',
        plating_type_name: item.plating_type_name?.name || ''
      };
      
      return processedItem;
    }) || [];
    
    return items;
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
    
    const photosData = data.inventory_photos || [];
    const processedPhotos: InventoryPhoto[] = photosData.map((photo: any) => ({
      id: photo.id,
      inventory_id: data.id,
      photo_url: photo.photo_url,
      is_primary: photo.is_primary || false
    }));
    
    const processedItem: InventoryItem = {
      ...data,
      photos: processedPhotos,
      inventory_photos: processedPhotos,
      category_name: data.category_name?.name || '',
      supplier_name: data.supplier_name?.name || ''
    };
    
    return processedItem;
  }

  // Criar novo item
  static async createItem(itemData: Partial<InventoryItem>): Promise<InventoryItem> {
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
    const { error: photoError } = await supabase
      .from('inventory_photos')
      .delete()
      .eq('inventory_id', id);
    
    if (photoError) throw photoError;
    
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
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

  // Atualizar fotos de um item - modificado para aceitar Files
  static async updateItemPhotos(itemId: string, photos: File[] | { id?: string; photo_url: string; is_primary?: boolean }[]): Promise<InventoryPhoto[]> {
    if (!photos || photos.length === 0) return [];

    const processedPhotos: { inventory_id: string; photo_url: string; is_primary: boolean }[] = [];

    for (const photo of photos) {
      if ('photo_url' in photo) {
        processedPhotos.push({
          inventory_id: itemId,
          photo_url: photo.photo_url,
          is_primary: photo.is_primary || false
        });
      } else if (photo instanceof File) {
        processedPhotos.push({
          inventory_id: itemId,
          photo_url: URL.createObjectURL(photo),
          is_primary: false
        });
      }
    }
    
    const { error: deleteError } = await supabase
      .from('inventory_photos')
      .delete()
      .eq('inventory_id', itemId);
    
    if (deleteError) throw deleteError;
    
    if (processedPhotos.length === 0) return [];
    
    const { data, error } = await supabase
      .from('inventory_photos')
      .insert(processedPhotos)
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
  static async checkItemInSuitcase(itemId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('suitcase_items')
        .select(`
          id,
          suitcase_id,
          suitcases:suitcase_id (
            id,
            code,
            status,
            seller_id,
            resellers:seller_id (
              name
            )
          )
        `)
        .eq('inventory_id', itemId)
        .eq('status', 'in_possession')
        .maybeSingle();
      
      if (error) throw error;
      
      if (!data) return null;
      
      return {
        id: data.id,
        suitcase_id: data.suitcase_id,
        status: data.suitcases?.status,
        suitcase_code: data.suitcases?.code,
        seller_id: data.suitcases?.seller_id,
        seller_name: data.suitcases?.resellers?.name
      };
    } catch (error) {
      console.error("Erro ao verificar se item está em maleta:", error);
      throw error;
    }
  }

  // Verificar se um item possui movimentações registradas
  static async checkItemHasMovements(id: string): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from('inventory_movements')
        .select('*', { count: 'exact', head: true })
        .eq('inventory_id', id);
      
      if (error) throw error;
      
      return (count || 0) > 0;
    } catch (error) {
      console.error("Erro ao verificar movimentações do item:", error);
      throw error;
    }
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
  static async createCategory(categoryData: string | { name: string }): Promise<InventoryCategory> {
    const formattedData = typeof categoryData === 'string' 
      ? { name: categoryData } 
      : categoryData;
    
    const { data, error } = await supabase
      .from('inventory_categories')
      .insert(formattedData)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error("Erro ao criar categoria: nenhum dado retornado");
    
    return data;
  }

  // Atualizar categoria
  static async updateCategory(id: string, updates: string | { name: string }): Promise<InventoryCategory> {
    const formattedUpdates = typeof updates === 'string'
      ? { name: updates }
      : updates;
    
    const { data, error } = await supabase
      .from('inventory_categories')
      .update(formattedUpdates)
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error("Erro ao atualizar categoria: nenhum dado retornado");
    
    return data;
  }

  // Excluir categoria
  static async deleteCategory(id: string): Promise<void> {
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
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('quantity, price');

      if (error) throw error;

      const totalItems = data.reduce((sum, item) => sum + (item.quantity || 0), 0);
      const totalValue = data.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0)), 0);

      return { totalItems, totalValue };
    } catch (error) {
      console.error('Erro ao obter total do inventário:', error);
      return { totalItems: 0, totalValue: 0 };
    }
  }
}

