
/**
 * Modelo de Categorias de Inventário
 * @file Este arquivo contém operações relacionadas às categorias de inventário
 */
import { supabase } from "@/integrations/supabase/client";
import { InventoryCategory } from "./types";

export class CategoryModel {
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
}
