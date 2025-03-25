
/**
 * Modelo de Tipos de Banho
 * @file Este arquivo contém operações relacionadas aos tipos de banho
 */
import { supabase } from "@/integrations/supabase/client";
import { PlatingType } from "./types";

export class PlatingTypeModel {
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
}
