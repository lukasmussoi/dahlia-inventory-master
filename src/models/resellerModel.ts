
import { supabase } from "@/integrations/supabase/client";

// Interface para revendedor com tipagem correta
export interface Reseller {
  id: string;
  name: string;
  cpf_cnpj: string;
  phone: string;
  email?: string;
  status: 'Ativa' | 'Inativa';
  address?: any;
  promoter_id: string;
  created_at: string;
  updated_at: string;
  // Propriedades virtuais para mapeamento
  cpfCnpj?: string;
  promoterId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Interface para filtros de busca
export interface ResellerFilters {
  search?: string;
  status?: string;
  promoterId?: string;
}

export class ResellerModel {
  // Buscar todas as revendedoras
  static async getAll() {
    try {
      const { data, error } = await supabase
        .from("resellers")
        .select("*")
        .order("name");

      if (error) throw error;

      // Mapeie os dados para garantir compatibilidade de propriedades
      const mappedData = (data || []).map(reseller => ({
        ...reseller,
        // Adicione propriedades virtuais para compatibilidade
        cpfCnpj: reseller.cpf_cnpj,
        promoterId: reseller.promoter_id,
        createdAt: reseller.created_at,
        updatedAt: reseller.updated_at
      }));

      return mappedData;
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

      if (!data) return null;

      // Mapeia para garantir compatibilidade
      return {
        ...data,
        cpfCnpj: data.cpf_cnpj,
        promoterId: data.promoter_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
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

      const reseller = newData?.[0];
      if (!reseller) throw new Error("Falha ao criar revendedora");

      // Mapeia para garantir compatibilidade
      return {
        ...reseller,
        cpfCnpj: reseller.cpf_cnpj,
        promoterId: reseller.promoter_id,
        createdAt: reseller.created_at,
        updatedAt: reseller.updated_at
      };
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

      const reseller = updatedData?.[0];
      if (!reseller) throw new Error("Falha ao atualizar revendedora");

      // Mapeia para garantir compatibilidade
      return {
        ...reseller,
        cpfCnpj: reseller.cpf_cnpj,
        promoterId: reseller.promoter_id,
        createdAt: reseller.created_at,
        updatedAt: reseller.updated_at
      };
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

  // Buscar revendedoras por termo de pesquisa
  static async searchResellers(query: string) {
    try {
      let queryBuilder = supabase
        .from('resellers')
        .select('*');

      if (query) {
        queryBuilder = queryBuilder.or(
          `name.ilike.%${query}%,cpf_cnpj.ilike.%${query}%,phone.ilike.%${query}%`
        );
      }

      const { data, error } = await queryBuilder.order('name');

      if (error) throw error;

      // Mapeia para garantir compatibilidade
      return (data || []).map(reseller => ({
        ...reseller,
        cpfCnpj: reseller.cpf_cnpj,
        promoterId: reseller.promoter_id,
        createdAt: reseller.created_at,
        updatedAt: reseller.updated_at
      }));
    } catch (error) {
      console.error("Erro ao buscar revendedoras:", error);
      throw error;
    }
  }
}
