
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export class SupplierModel {
  // Buscar todos os fornecedores
  static async getSuppliers() {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error);
      toast.error('Erro ao buscar fornecedores');
      return [];
    }
  }

  // Criar novo fornecedor
  static async createSupplier(name: string, contactInfo?: string) {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([{ name, contact_info: contactInfo }])
        .select()
        .single();

      if (error) throw error;
      toast.success('Fornecedor criado com sucesso!');
      return data;
    } catch (error) {
      console.error('Erro ao criar fornecedor:', error);
      toast.error('Erro ao criar fornecedor');
      throw error;
    }
  }

  // Atualizar fornecedor
  static async updateSupplier(id: string, name: string, contactInfo?: string) {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .update({ name, contact_info: contactInfo })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      toast.success('Fornecedor atualizado com sucesso!');
      return data;
    } catch (error) {
      console.error('Erro ao atualizar fornecedor:', error);
      toast.error('Erro ao atualizar fornecedor');
      throw error;
    }
  }

  // Deletar fornecedor
  static async deleteSupplier(id: string) {
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Fornecedor removido com sucesso!');
    } catch (error) {
      console.error('Erro ao remover fornecedor:', error);
      toast.error('Erro ao remover fornecedor');
      throw error;
    }
  }
}
