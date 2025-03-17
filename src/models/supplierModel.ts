
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export class SupplierModel {
  // Buscar todos os fornecedores
  static async getSuppliers() {
    try {
      // Verificar se o usuário está autenticado antes de fazer a consulta
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error("Erro de autenticação:", authError);
        throw new Error("Usuário não autenticado");
      }

      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');

      if (error) {
        console.error("Erro ao buscar fornecedores:", error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error);
      throw error; // Propagar o erro para ser tratado no componente
    }
  }

  // Criar novo fornecedor
  static async createSupplier(name: string, contactInfo?: string) {
    try {
      // Verificar se o usuário está autenticado antes de fazer a inserção
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error("Erro de autenticação:", authError);
        throw new Error("Usuário não autenticado");
      }

      const { data, error } = await supabase
        .from('suppliers')
        .insert([{ name, contact_info: contactInfo }])
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar fornecedor:", error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Erro ao criar fornecedor:', error);
      throw error; // Propagar o erro para ser tratado no componente
    }
  }

  // Atualizar fornecedor
  static async updateSupplier(id: string, name: string, contactInfo?: string) {
    try {
      // Verificar se o usuário está autenticado antes de fazer a atualização
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error("Erro de autenticação:", authError);
        throw new Error("Usuário não autenticado");
      }

      const { data, error } = await supabase
        .from('suppliers')
        .update({ name, contact_info: contactInfo })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error("Erro ao atualizar fornecedor:", error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Erro ao atualizar fornecedor:', error);
      throw error; // Propagar o erro para ser tratado no componente
    }
  }

  // Deletar fornecedor
  static async deleteSupplier(id: string) {
    try {
      // Verificar se o usuário está autenticado antes de fazer a exclusão
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error("Erro de autenticação:", authError);
        throw new Error("Usuário não autenticado");
      }

      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Erro ao remover fornecedor:", error);
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao remover fornecedor:', error);
      throw error; // Propagar o erro para ser tratado no componente
    }
  }
}
