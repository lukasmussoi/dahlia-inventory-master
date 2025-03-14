
import { supabase } from "@/integrations/supabase/client";
import { Reseller, ResellerInput } from "@/types/reseller";

export class ResellerModel {
  static async getAll() {
    const { data, error } = await supabase
      .from('resellers')
      .select(`
        *,
        promoters:promoter_id (
          name
        )
      `)
      .order('name');

    if (error) throw error;

    // Mapear os resultados para o formato esperado
    return data.map((reseller: any) => ({
      ...reseller,
      promoterName: reseller.promoters?.name,
      cpfCnpj: reseller.cpf_cnpj,
      promoterId: reseller.promoter_id,
      createdAt: reseller.created_at,
      updatedAt: reseller.updated_at,
      // Converter o endereço de JSON para objeto
      address: reseller.address ? {
        street: reseller.address.street || '',
        number: reseller.address.number || '',
        complement: reseller.address.complement || '',
        neighborhood: reseller.address.neighborhood || '',
        city: reseller.address.city || '',
        state: reseller.address.state || '',
        zipCode: reseller.address.zipCode || '',
      } : undefined
    })) as Reseller[];
  }

  static async getById(id: string) {
    const { data, error } = await supabase
      .from('resellers')
      .select(`
        *,
        promoters:promoter_id (
          name
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    return {
      ...data,
      promoterName: data.promoters?.name,
      cpfCnpj: data.cpf_cnpj,
      promoterId: data.promoter_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      address: data.address ? {
        street: data.address.street || '',
        number: data.address.number || '',
        complement: data.address.complement || '',
        neighborhood: data.address.neighborhood || '',
        city: data.address.city || '',
        state: data.address.state || '',
        zipCode: data.address.zipCode || '',
      } : undefined
    } as Reseller;
  }

  static async create(reseller: ResellerInput) {
    const { data, error } = await supabase
      .from('resellers')
      .insert({
        name: reseller.name,
        cpf_cnpj: reseller.cpfCnpj,
        phone: reseller.phone,
        email: reseller.email,
        address: reseller.address,
        status: reseller.status,
        promoter_id: reseller.promoterId
      })
      .select();

    if (error) {
      // Verificar se é erro de CPF/CNPJ duplicado
      if (error.code === '23505') {
        throw new Error('CPF/CNPJ já cadastrado no sistema');
      }
      throw error;
    }

    return data[0];
  }

  static async update(id: string, reseller: ResellerInput) {
    const { data, error } = await supabase
      .from('resellers')
      .update({
        name: reseller.name,
        cpf_cnpj: reseller.cpfCnpj,
        phone: reseller.phone,
        email: reseller.email,
        address: reseller.address,
        status: reseller.status,
        promoter_id: reseller.promoterId
      })
      .eq('id', id)
      .select();

    if (error) {
      // Verificar se é erro de CPF/CNPJ duplicado
      if (error.code === '23505') {
        throw new Error('CPF/CNPJ já cadastrado no sistema');
      }
      throw error;
    }

    return data[0];
  }

  static async delete(id: string) {
    const { error } = await supabase
      .from('resellers')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return true;
  }

  static async searchResellers(query: string, status?: string, promoterId?: string) {
    let request = supabase
      .from('resellers')
      .select(`
        *,
        promoters:promoter_id (
          name
        )
      `)
      .order('name');

    // Adicionar filtros se fornecidos
    if (query) {
      request = request.ilike('name', `%${query}%`);
    }

    if (status) {
      request = request.eq('status', status);
    }

    if (promoterId) {
      request = request.eq('promoter_id', promoterId);
    }

    const { data, error } = await request;

    if (error) throw error;

    // Mapear os resultados para o formato esperado
    return data.map((reseller: any) => ({
      ...reseller,
      promoterName: reseller.promoters?.name,
      cpfCnpj: reseller.cpf_cnpj,
      promoterId: reseller.promoter_id,
      createdAt: reseller.created_at,
      updatedAt: reseller.updated_at,
      address: reseller.address ? {
        street: reseller.address.street || '',
        number: reseller.address.number || '',
        complement: reseller.address.complement || '',
        neighborhood: reseller.address.neighborhood || '',
        city: reseller.address.city || '',
        state: reseller.address.state || '',
        zipCode: reseller.address.zipCode || '',
      } : undefined
    })) as Reseller[];
  }
}
