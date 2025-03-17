
import { supabase } from "@/integrations/supabase/client";

// Definição de tipos e interfaces
export interface InventoryCategory {
  id: string;
  name: string;
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

export interface PlatingType {
  id: string;
  name: string;
  gram_value: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryPhoto {
  id: string;
  inventory_id: string;
  photo_url: string;
  is_primary: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  category_id: string;
  category_name?: string;
  supplier_id?: string;
  supplier_name?: string;
  plating_type_id?: string;
  quantity: number;
  price: number;
  unit_cost: number;
  suggested_price: number;
  min_stock: number;
  weight?: number;
  width?: number;
  height?: number;
  depth?: number;
  material_weight?: number;
  packaging_cost?: number;
  markup_percentage?: number;
  photos?: InventoryPhoto[];
  created_at?: string;
  updated_at?: string;
}

export interface InventoryFilters {
  search?: string;
  category_id?: string;
  min_price?: number;
  max_price?: number;
  status?: string;
  minQuantity?: number;
  maxQuantity?: number;
  searchTerm?: string;
  category?: string;
}

export class InventoryModel {
  // Métodos relacionados a itens do inventário
  static async getAllItems(filters: InventoryFilters = {}) {
    try {
      console.log("Buscando itens com filtros:", filters);
      
      let query = supabase
        .from('inventory')
        .select(`
          *,
          inventory_categories(name),
          suppliers(name),
          inventory_photos(id, photo_url, is_primary)
        `);

      // Aplicar filtros
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,barcode.ilike.%${filters.search}%`);
      }

      if (filters.category_id && filters.category_id !== 'all') {
        query = query.eq('category_id', filters.category_id);
      }

      if (filters.min_price) {
        query = query.gte('price', filters.min_price);
      }

      if (filters.max_price) {
        query = query.lte('price', filters.max_price);
      }

      if (filters.minQuantity !== undefined) {
        query = query.gte('quantity', filters.minQuantity);
      }

      if (filters.maxQuantity !== undefined) {
        query = query.lte('quantity', filters.maxQuantity);
      }

      // Ordenar por nome
      query = query.order('name', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      // Processar resultados
      const items = (data || []).map(item => ({
        ...item,
        category_name: item.inventory_categories?.name,
        supplier_name: item.suppliers?.name,
        photos: item.inventory_photos
      }));

      console.log(`Encontrados ${items.length} itens`);
      return items;
    } catch (error) {
      console.error("Erro ao buscar itens:", error);
      throw error;
    }
  }

  static async getItemById(id: string) {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          inventory_categories(id, name),
          suppliers(id, name),
          plating_types(id, name, gram_value),
          inventory_photos(id, photo_url, is_primary)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Erro ao buscar item ${id}:`, error);
      throw error;
    }
  }

  static async createItem(itemData: Partial<InventoryItem>) {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .insert([itemData])
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error("Erro ao criar item:", error);
      throw error;
    }
  }

  static async updateItem(id: string, itemData: Partial<InventoryItem>) {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .update(itemData)
        .eq('id', id)
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error(`Erro ao atualizar item ${id}:`, error);
      throw error;
    }
  }

  static async deleteItem(id: string) {
    try {
      // Primeiro excluir as fotos associadas
      const { error: photosError } = await supabase
        .from('inventory_photos')
        .delete()
        .eq('inventory_id', id);

      if (photosError) throw photosError;

      // Depois excluir o item
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Erro ao excluir item ${id}:`, error);
      throw error;
    }
  }

  static async checkItemInSuitcase(id: string) {
    try {
      const { data, error } = await supabase
        .from('suitcase_items')
        .select('id')
        .eq('inventory_id', id)
        .limit(1);

      if (error) throw error;
      return data && data.length > 0;
    } catch (error) {
      console.error(`Erro ao verificar item ${id} em maletas:`, error);
      throw error;
    }
  }

  // Métodos relacionados a fotos do inventário
  static async getItemPhotos(itemId: string) {
    try {
      const { data, error } = await supabase
        .from('inventory_photos')
        .select('*')
        .eq('inventory_id', itemId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Erro ao buscar fotos do item ${itemId}:`, error);
      throw error;
    }
  }

  static async updateItemPhotos(itemId: string, photos: File[]) {
    try {
      console.log(`Atualizando ${photos.length} fotos para o item ${itemId}`);
      
      // Upload das fotos para o bucket do Supabase
      const photoUrls = [];
      for (const photo of photos) {
        const filePath = `inventory/${itemId}/${Date.now()}_${photo.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, photo);

        if (uploadError) throw uploadError;
        
        // Gerar URL pública
        const { data: publicUrl } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);
          
        photoUrls.push(publicUrl.publicUrl);
      }

      // Inserir registros no banco
      if (photoUrls.length > 0) {
        const photosData = photoUrls.map((url, index) => ({
          inventory_id: itemId,
          photo_url: url,
          is_primary: index === 0, // A primeira foto é a principal
        }));

        const { error: insertError } = await supabase
          .from('inventory_photos')
          .insert(photosData);

        if (insertError) throw insertError;
      }

      return true;
    } catch (error) {
      console.error(`Erro ao atualizar fotos do item ${itemId}:`, error);
      throw error;
    }
  }

  // Métodos relacionados a categorias
  static async getAllCategories() {
    try {
      const { data, error } = await supabase
        .from('inventory_categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
      throw error;
    }
  }

  static async createCategory(name: string) {
    try {
      const { data, error } = await supabase
        .from('inventory_categories')
        .insert([{ name }])
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error("Erro ao criar categoria:", error);
      throw error;
    }
  }

  static async updateCategory(id: string, name: string) {
    try {
      const { data, error } = await supabase
        .from('inventory_categories')
        .update({ name })
        .eq('id', id)
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error(`Erro ao atualizar categoria ${id}:`, error);
      throw error;
    }
  }

  static async deleteCategory(id: string) {
    try {
      // Verificar se há itens utilizando esta categoria
      const { data: items, error: checkError } = await supabase
        .from('inventory')
        .select('id')
        .eq('category_id', id)
        .limit(1);

      if (checkError) throw checkError;
      
      if (items && items.length > 0) {
        throw new Error("Não é possível excluir esta categoria porque existem itens vinculados a ela.");
      }

      // Excluir a categoria
      const { error } = await supabase
        .from('inventory_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Erro ao excluir categoria ${id}:`, error);
      throw error;
    }
  }

  // Métodos relacionados a fornecedores
  static async getAllSuppliers() {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Erro ao buscar fornecedores:", error);
      throw error;
    }
  }

  // Métodos relacionados a tipos de banho
  static async getAllPlatingTypes() {
    try {
      const { data, error } = await supabase
        .from('plating_types')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Erro ao buscar tipos de banho:", error);
      throw error;
    }
  }

  static async createPlatingType(platingTypeData: Partial<PlatingType>) {
    try {
      const { data, error } = await supabase
        .from('plating_types')
        .insert([platingTypeData])
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error("Erro ao criar tipo de banho:", error);
      throw error;
    }
  }

  static async updatePlatingType(id: string, platingTypeData: Partial<PlatingType>) {
    try {
      const { data, error } = await supabase
        .from('plating_types')
        .update(platingTypeData)
        .eq('id', id)
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error(`Erro ao atualizar tipo de banho ${id}:`, error);
      throw error;
    }
  }

  static async deletePlatingType(id: string) {
    try {
      // Verificar se há itens utilizando este tipo de banho
      const { data: items, error: checkError } = await supabase
        .from('inventory')
        .select('id')
        .eq('plating_type_id', id)
        .limit(1);

      if (checkError) throw checkError;
      
      if (items && items.length > 0) {
        throw new Error("Não é possível excluir este tipo de banho porque existem itens vinculados a ele.");
      }

      // Excluir o tipo de banho
      const { error } = await supabase
        .from('plating_types')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Erro ao excluir tipo de banho ${id}:`, error);
      throw error;
    }
  }

  // Métodos para relatórios e dashboard
  static async getTotalInventory() {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('id, price, quantity');

      if (error) throw error;

      const totalItems = (data || []).length;
      const totalValue = (data || []).reduce(
        (sum, item) => sum + (item.price * item.quantity), 
        0
      );

      return { totalItems, totalValue };
    } catch (error) {
      console.error("Erro ao calcular valor total do inventário:", error);
      throw error;
    }
  }

  // Método para busca de itens que já existe no arquivo
  static async searchInventoryItems(query: string) {
    try {
      // Verificar se a query parece um UUID
      const isUuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (isUuidPattern.test(query)) {
        // Se for UUID, buscar por ID exato
        return await this.searchInventoryItemsById(query);
      } else {
        // Se não for UUID, buscar por texto (nome, código, etc)
        return await this.searchInventoryItemsByText(query);
      }
    } catch (error) {
      console.error("Erro ao buscar itens do inventário:", error);
      throw error;
    }
  }
  
  static async searchInventoryItemsById(id: string) {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          id, 
          name, 
          sku, 
          barcode, 
          price,
          inventory_photos (
            photo_url
          )
        `)
        .eq('id', id);
        
      if (error) throw error;
      
      // Processar e formatar os resultados
      return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        barcode: item.barcode,
        price: item.price,
        photo_url: item.inventory_photos?.length > 0 ? item.inventory_photos[0].photo_url : null
      }));
    } catch (error) {
      console.error("Erro ao buscar item por ID:", error);
      throw error;
    }
  }
  
  static async searchInventoryItemsByText(query: string) {
    try {
      // Buscar por nome, SKU ou código de barras
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          id, 
          name, 
          sku, 
          barcode, 
          price,
          inventory_photos (
            photo_url
          )
        `)
        .or(`name.ilike.%${query}%,sku.ilike.%${query}%,barcode.ilike.%${query}%`)
        .limit(10);
        
      if (error) throw error;
      
      // Processar e formatar os resultados
      return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        barcode: item.barcode,
        price: item.price,
        photo_url: item.inventory_photos?.length > 0 ? item.inventory_photos[0].photo_url : null
      }));
    } catch (error) {
      console.error("Erro ao buscar itens por texto:", error);
      throw error;
    }
  }
  
  static async updateInventoryItemStatus(id: string, status: string) {
    try {
      // Atualizar apenas o status virtual, sem alterar a tabela
      console.log(`Atualizando status do item ${id} para ${status}`);
      // Na implementação atual, não há coluna de status na tabela inventory
      // Esta função é apenas para compatibilidade com o fluxo atual
      return { success: true, id, status };
    } catch (error) {
      console.error(`Erro ao atualizar status do item ${id}:`, error);
      throw error;
    }
  }
}
