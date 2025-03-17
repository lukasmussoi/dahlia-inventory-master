
// Arquivo models/resellerModel.ts (snippets)
import { supabase } from "@/integrations/supabase/client";

export class ResellerModel {
  // Buscar todas as revendedoras
  static async getAll() {
    try {
      const { data, error } = await supabase
        .from("resellers")
        .select("*")
        .order("name");

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error("Erro ao buscar revendedoras:", error);
      throw error;
    }
  }

  // Buscar uma revendedora pelo ID
  static async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from("resellers")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error("Erro ao buscar revendedora por ID:", error);
      throw error;
    }
  }

  // Criar uma nova revendedora
  static async create(data: any) {
    try {
      const { data: newData, error } = await supabase
        .from("resellers")
        .insert([data])
        .select();

      if (error) throw error;

      return newData?.[0];
    } catch (error) {
      console.error("Erro ao criar revendedora:", error);
      throw error;
    }
  }

  // Atualizar uma revendedora existente
  static async update(id: string, data: any) {
    try {
      const { data: updatedData, error } = await supabase
        .from("resellers")
        .update(data)
        .eq("id", id)
        .select();

      if (error) throw error;

      return updatedData?.[0];
    } catch (error) {
      console.error("Erro ao atualizar revendedora:", error);
      throw error;
    }
  }

  // Excluir uma revendedora
  static async delete(id: string) {
    try {
      const { error } = await supabase
        .from("resellers")
        .delete()
        .eq("id", id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error("Erro ao excluir revendedora:", error);
      throw error;
    }
  }
}
