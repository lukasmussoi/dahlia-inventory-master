
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export class SupplierModel {
  // Buscar todos os fornecedores
  static async getSuppliers() {
    try {
      console.log('Buscando fornecedores...');
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');

      if (error) {
        console.error('Erro ao buscar fornecedores:', error);
        throw error;
      }
      
      console.log('Fornecedores encontrados:', data);
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
      console.log('Criando fornecedor:', { name, contactInfo });
      const { data, error } = await supabase
        .from('suppliers')
        .insert([{ name, contact_info: contactInfo }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar fornecedor:', error);
        throw error;
      }
      
      console.log('Fornecedor criado:', data);
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
      console.log('Atualizando fornecedor:', { id, name, contactInfo });
      const { data, error } = await supabase
        .from('suppliers')
        .update({ name, contact_info: contactInfo })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar fornecedor:', error);
        throw error;
      }
      
      console.log('Fornecedor atualizado:', data);
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
      console.log('Removendo fornecedor:', id);
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao remover fornecedor:', error);
        throw error;
      }
      
      console.log('Fornecedor removido com sucesso');
      toast.success('Fornecedor removido com sucesso!');
    } catch (error) {
      console.error('Erro ao remover fornecedor:', error);
      toast.error('Erro ao remover fornecedor');
      throw error;
    }
  }
}
