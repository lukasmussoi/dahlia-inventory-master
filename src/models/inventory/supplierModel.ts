
/**
 * Modelo de Fornecedores
 * @file Este arquivo contém operações relacionadas aos fornecedores
 */
import { supabase } from "@/integrations/supabase/client";
import { Supplier } from "./types";

export class SupplierModel {
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
}
