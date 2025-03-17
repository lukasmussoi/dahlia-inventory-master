
import { supabase } from "@/integrations/supabase/client";
import { Reseller, ResellerInput, Address } from "@/types/reseller";

export class ResellerModel {
  // Buscar todas as revendedoras
  static async getAll() {
    try {
      const { data, error } = await supabase
        .from("resellers")
        .select(`
          *,
          promoters(name)
        `)
        .order("name");

      if (error) throw error;

      // Mapear os dados para o formato correto da aplicação
      const mappedData = (data || []).map(reseller => ({
        id: reseller.id,
        name: reseller.name,
        cpfCnpj: reseller.cpf_cnpj,
        phone: reseller.phone,
        email: reseller.email || "",
        status: reseller.status || "Ativa",
        address: reseller.address ? this.mapAddressFromJson(reseller.address) : undefined,
        promoterId: reseller.promoter_id,
        promoterName: reseller.promoters?.name || "",
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
        .select(`
          *,
          promoters(name)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;

      if (!data) return null;

      // Mapear para o formato correto da aplicação
      return {
        id: data.id,
        name: data.name,
        cpfCnpj: data.cpf_cnpj,
        phone: data.phone,
        email: data.email || "",
        status: data.status || "Ativa",
        address: data.address ? this.mapAddressFromJson(data.address) : undefined,
        promoterId: data.promoter_id,
        promoterName: data.promoters?.name || "",
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error("Erro ao buscar revendedora por ID:", error);
      throw error;
    }
  }

  // Criar uma nova revendedora
  static async create(data: ResellerInput) {
    try {
      // Mapear os dados para o formato do banco de dados
      const dbData = {
        name: data.name,
        cpf_cnpj: data.cpfCnpj,
        phone: data.phone,
        email: data.email,
        status: data.status,
        address: data.address ? this.mapAddressToJson(data.address) : null,
        promoter_id: data.promoterId
      };

      const { data: newData, error } = await supabase
        .from("resellers")
        .insert([dbData])
        .select(`
          *,
          promoters(name)
        `);

      if (error) throw error;

      const reseller = newData?.[0];
      if (!reseller) throw new Error("Falha ao criar revendedora");

      // Mapear para o formato correto da aplicação
      return {
        id: reseller.id,
        name: reseller.name,
        cpfCnpj: reseller.cpf_cnpj,
        phone: reseller.phone,
        email: reseller.email || "",
        status: reseller.status || "Ativa",
        address: reseller.address ? this.mapAddressFromJson(reseller.address) : undefined,
        promoterId: reseller.promoter_id,
        promoterName: reseller.promoters?.name || "",
        createdAt: reseller.created_at,
        updatedAt: reseller.updated_at
      };
    } catch (error) {
      console.error("Erro ao criar revendedora:", error);
      throw error;
    }
  }

  // Atualizar uma revendedora existente
  static async update(id: string, data: ResellerInput) {
    try {
      // Mapear os dados para o formato do banco de dados
      const dbData = {
        name: data.name,
        cpf_cnpj: data.cpfCnpj,
        phone: data.phone,
        email: data.email,
        status: data.status,
        address: data.address ? this.mapAddressToJson(data.address) : null,
        promoter_id: data.promoterId
      };

      const { data: updatedData, error } = await supabase
        .from("resellers")
        .update(dbData)
        .eq("id", id)
        .select(`
          *,
          promoters(name)
        `);

      if (error) throw error;

      const reseller = updatedData?.[0];
      if (!reseller) throw new Error("Falha ao atualizar revendedora");

      // Mapear para o formato correto da aplicação
      return {
        id: reseller.id,
        name: reseller.name,
        cpfCnpj: reseller.cpf_cnpj,
        phone: reseller.phone,
        email: reseller.email || "",
        status: reseller.status || "Ativa",
        address: reseller.address ? this.mapAddressFromJson(reseller.address) : undefined,
        promoterId: reseller.promoter_id,
        promoterName: reseller.promoters?.name || "",
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

  // Buscar revendedoras por termo de pesquisa, status e promotora
  static async searchResellers(query: string, status?: string, promoterId?: string) {
    try {
      let queryBuilder = supabase
        .from('resellers')
        .select(`
          *,
          promoters(name)
        `);

      // Filtrar por termo de pesquisa
      if (query) {
        queryBuilder = queryBuilder.or(
          `name.ilike.%${query}%,cpf_cnpj.ilike.%${query}%,phone.ilike.%${query}%`
        );
      }

      // Filtrar por status
      if (status && status !== 'todos') {
        queryBuilder = queryBuilder.eq('status', status);
      }

      // Filtrar por promotora
      if (promoterId && promoterId !== 'todos') {
        queryBuilder = queryBuilder.eq('promoter_id', promoterId);
      }

      const { data, error } = await queryBuilder.order('name');

      if (error) throw error;

      // Mapear os dados para o formato correto da aplicação
      const mappedData = (data || []).map(reseller => ({
        id: reseller.id,
        name: reseller.name,
        cpfCnpj: reseller.cpf_cnpj,
        phone: reseller.phone,
        email: reseller.email || "",
        status: reseller.status || "Ativa",
        address: reseller.address ? this.mapAddressFromJson(reseller.address) : undefined,
        promoterId: reseller.promoter_id,
        promoterName: reseller.promoters?.name || "",
        createdAt: reseller.created_at,
        updatedAt: reseller.updated_at
      }));

      return mappedData;
    } catch (error) {
      console.error("Erro ao buscar revendedoras:", error);
      throw error;
    }
  }

  // Função auxiliar para mapear o endereço do formato JSON para o objeto Address
  private static mapAddressFromJson(address: any): Address | undefined {
    if (!address) return undefined;
    
    return {
      street: address.street || '',
      number: address.number || '',
      complement: address.complement || '',
      neighborhood: address.neighborhood || '',
      city: address.city || '',
      state: address.state || '',
      zipCode: address.zipCode || ''
    };
  }

  // Função auxiliar para mapear o objeto Address para o formato JSON
  private static mapAddressToJson(address: Address): any {
    return {
      street: address.street,
      number: address.number,
      complement: address.complement || '',
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode
    };
  }
}
