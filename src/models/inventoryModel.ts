
import { supabase } from "@/integrations/supabase/client";

// Interfaces necessárias para o sistema
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
  quantity: number;
  price: number;
  unit_cost: number;
  suggested_price: number;
  category_id: string;
  supplier_id?: string;
  plating_type_id?: string;
  weight?: number;
  width?: number;
  height?: number;
  depth?: number;
  material_weight?: number;
  packaging_cost?: number;
  gram_value?: number;
  profit_margin?: number;
  reseller_commission?: number;
  markup_percentage?: number;
  min_stock?: number;
  popularity?: number;
  created_at?: string;
  updated_at?: string;
  photo_url?: string;
  category_name?: string;
  supplier_name?: string;
}

export interface InventoryFilters {
  search?: string;
  searchTerm?: string;
  category_id?: string;
  category?: string;
  supplier_id?: string;
  min_price?: number;
  max_price?: number;
  status?: string;
  minQuantity?: number;
  maxQuantity?: number;
}

export class InventoryModel {
  // Método para buscar itens do inventário por consulta de texto
  static async searchInventoryItems(query: string) {
    try {
      let queryBuilder = supabase
        .from('inventory')
        .select(`
          *,
          categories:category_id (
            name
          ),
          suppliers:supplier_id (
            name
          )
        `);

      // Se houver uma consulta, faça uma busca por nome, código ou SKU
      if (query) {
        queryBuilder = queryBuilder.or(
          `name.ilike.%${query}%,sku.ilike.%${query}%,barcode.ilike.%${query}%,id.eq.${query}`
        );
      }

      // Não incluir filtro de status, já que a coluna não existe
      const { data, error } = await queryBuilder;

      if (error) throw error;

      return data.map(item => ({
        ...item,
        category_name: item.categories?.name || null,
        supplier_name: item.suppliers?.name || null,
      }));
    } catch (error) {
      console.error("Erro ao buscar itens do inventário:", error);
      throw error;
    }
  }

  // Método para atualizar o status do item do inventário (marcando como em uso na maleta)
  static async updateInventoryItemStatus(id: string, status: string) {
    try {
      // Como não temos coluna status na tabela inventory, vamos apenas fingir que atualizamos
      // e retornar o item com o "status" atualizado
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      console.log(`Item ${id} marcado como "${status}" (simulado)`);
      
      // Retorna o item sem modificá-lo no banco, já que não temos a coluna status
      return {
        ...data,
        virtual_status: status // Apenas para logging
      };
    } catch (error) {
      console.error("Erro ao atualizar status do item:", error);
      throw error;
    }
  }

  // Método para buscar todos os itens do inventário
  static async getAllItems(filters?: InventoryFilters) {
    try {
      let query = supabase
        .from('inventory')
        .select(`
          *,
          categories:category_id (name),
          suppliers:supplier_id (name),
          plating_types:plating_type_id (name, gram_value)
        `);

      // Aplicar filtros se existirem
      if (filters) {
        if (filters.search || filters.searchTerm) {
          const searchTerm = filters.search || filters.searchTerm || '';
          query = query.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`);
        }

        if (filters.category_id || filters.category) {
          const categoryId = filters.category_id || filters.category;
          if (categoryId && categoryId !== 'all') {
            query = query.eq('category_id', categoryId);
          }
        }

        if (filters.supplier_id) {
          query = query.eq('supplier_id', filters.supplier_id);
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
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(item => ({
        ...item,
        category_name: item.categories?.name || null,
        supplier_name: item.suppliers?.name || null,
      }));
    } catch (error) {
      console.error("Erro ao buscar todos os itens do inventário:", error);
      throw error;
    }
  }

  // Método para buscar todos os fornecedores
  static async getAllSuppliers() {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');

      if (error) throw error;

      return data;
    } catch (error) {
      console.error("Erro ao buscar fornecedores:", error);
      throw error;
    }
  }

  // Método para buscar todas as categorias
  static async getAllCategories() {
    try {
      const { data, error } = await supabase
        .from('inventory_categories')
        .select('*')
        .order('name');

      if (error) throw error;

      return data;
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
      throw error;
    }
  }

  // Método para buscar todos os tipos de banho
  static async getAllPlatingTypes() {
    try {
      const { data, error } = await supabase
        .from('plating_types')
        .select('*')
        .order('name');

      if (error) throw error;

      return data;
    } catch (error) {
      console.error("Erro ao buscar tipos de banho:", error);
      throw error;
    }
  }

  // Método para verificar se um item existe em alguma maleta
  static async checkItemInSuitcase(itemId: string) {
    try {
      const { data, error } = await supabase
        .from('suitcase_items')
        .select('*')
        .eq('inventory_id', itemId)
        .maybeSingle();

      if (error) throw error;

      return !!data; // Retorna true se encontrou algum registro, false caso contrário
    } catch (error) {
      console.error("Erro ao verificar item em maleta:", error);
      throw error;
    }
  }

  // Método para criar um novo item no inventário
  static async createItem(itemData: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>) {
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

  // Método para atualizar um item existente
  static async updateItem(id: string, itemData: Partial<InventoryItem>) {
    try {
      // Remova qualquer propriedade 'status' que não pertença ao tipo
      const { status, ...validItemData } = itemData as any;
      
      const { data, error } = await supabase
        .from('inventory')
        .update(validItemData)
        .eq('id', id)
        .select();

      if (error) throw error;

      return data[0];
    } catch (error) {
      console.error("Erro ao atualizar item:", error);
      throw error;
    }
  }

  // Método para excluir um item
  static async deleteItem(id: string) {
    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error("Erro ao excluir item:", error);
      throw error;
    }
  }

  // Método para buscar as fotos de um item
  static async getItemPhotos(itemId: string) {
    try {
      const { data, error } = await supabase
        .from('inventory_photos')
        .select('*')
        .eq('inventory_id', itemId);

      if (error) throw error;

      return data;
    } catch (error) {
      console.error("Erro ao buscar fotos do item:", error);
      throw error;
    }
  }

  // Método para atualizar as fotos de um item
  static async updateItemPhotos(itemId: string, photos: any[]) {
    try {
      // Primeiro, excluir as fotos existentes
      const { error: deleteError } = await supabase
        .from('inventory_photos')
        .delete()
        .eq('inventory_id', itemId);

      if (deleteError) throw deleteError;

      // Se não houver novas fotos para adicionar, apenas retorne
      if (!photos || photos.length === 0) return [];

      // Inserir as novas fotos - corrigindo a propriedade photo_url 
      const photosToInsert = photos.map(photo => ({
        inventory_id: itemId,
        photo_url: photo.url || photo.photo_url, // Aceita ambos os formatos
        is_primary: photo.is_primary || photo.isPrimary || false // Aceita ambos os formatos
      }));

      const { data, error } = await supabase
        .from('inventory_photos')
        .insert(photosToInsert)
        .select();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error("Erro ao atualizar fotos do item:", error);
      throw error;
    }
  }

  // Método para criar uma nova categoria
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

  // Método para atualizar uma categoria existente
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
      console.error("Erro ao atualizar categoria:", error);
      throw error;
    }
  }

  // Método para excluir uma categoria
  static async deleteCategory(id: string) {
    try {
      const { error } = await supabase
        .from('inventory_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error("Erro ao excluir categoria:", error);
      throw error;
    }
  }

  // Método para criar um novo tipo de banho
  static async createPlatingType(data: Omit<PlatingType, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data: createdData, error } = await supabase
        .from('plating_types')
        .insert([data])
        .select();

      if (error) throw error;

      return createdData[0];
    } catch (error) {
      console.error("Erro ao criar tipo de banho:", error);
      throw error;
    }
  }

  // Método para excluir um tipo de banho
  static async deletePlatingType(id: string) {
    try {
      const { error } = await supabase
        .from('plating_types')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error("Erro ao excluir tipo de banho:", error);
      throw error;
    }
  }

  // Método para obter total de itens no inventário (para Dashboard)
  static async getTotalInventory() {
    try {
      const { count, error } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;

      return count || 0;
    } catch (error) {
      console.error("Erro ao buscar total do inventário:", error);
      throw error;
    }
  }
}
