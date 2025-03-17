
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
      // Converter o endereço de JSON para objeto, com verificação de tipo
      address: reseller.address ? {
        street: typeof reseller.address === 'object' && 'street' in reseller.address ? String(reseller.address.street || '') : '',
        number: typeof reseller.address === 'object' && 'number' in reseller.address ? String(reseller.address.number || '') : '',
        complement: typeof reseller.address === 'object' && 'complement' in reseller.address ? String(reseller.address.complement || '') : '',
        neighborhood: typeof reseller.address === 'object' && 'neighborhood' in reseller.address ? String(reseller.address.neighborhood || '') : '',
        city: typeof reseller.address === 'object' && 'city' in reseller.address ? String(reseller.address.city || '') : '',
        state: typeof reseller.address === 'object' && 'state' in reseller.address ? String(reseller.address.state || '') : '',
        zipCode: typeof reseller.address === 'object' && 'zipCode' in reseller.address ? String(reseller.address.zipCode || '') : ''
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
        street: typeof data.address === 'object' && 'street' in data.address ? String(data.address.street || '') : '',
        number: typeof data.address === 'object' && 'number' in data.address ? String(data.address.number || '') : '',
        complement: typeof data.address === 'object' && 'complement' in data.address ? String(data.address.complement || '') : '',
        neighborhood: typeof data.address === 'object' && 'neighborhood' in data.address ? String(data.address.neighborhood || '') : '',
        city: typeof data.address === 'object' && 'city' in data.address ? String(data.address.city || '') : '',
        state: typeof data.address === 'object' && 'state' in data.address ? String(data.address.state || '') : '',
        zipCode: typeof data.address === 'object' && 'zipCode' in data.address ? String(data.address.zipCode || '') : ''
      } : undefined
    } as Reseller;
  }

  static async create(reseller: ResellerInput) {
    // Converter o endereço para o formato JSON esperado pelo Supabase
    const { data, error } = await supabase
      .from('resellers')
      .insert({
        name: reseller.name,
        cpf_cnpj: reseller.cpfCnpj,
        phone: reseller.phone,
        email: reseller.email,
        // Precisamos usar 'as any' para evitar erros de tipo com o campo address
        address: reseller.address as any,
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
        // Precisamos usar 'as any' para evitar erros de tipo com o campo address
        address: reseller.address as any,
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

    if (status && (status === 'Ativa' || status === 'Inativa')) {
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
        street: typeof reseller.address === 'object' && 'street' in reseller.address ? String(reseller.address.street || '') : '',
        number: typeof reseller.address === 'object' && 'number' in reseller.address ? String(reseller.address.number || '') : '',
        complement: typeof reseller.address === 'object' && 'complement' in reseller.address ? String(reseller.address.complement || '') : '',
        neighborhood: typeof reseller.address === 'object' && 'neighborhood' in reseller.address ? String(reseller.address.neighborhood || '') : '',
        city: typeof reseller.address === 'object' && 'city' in reseller.address ? String(reseller.address.city || '') : '',
        state: typeof reseller.address === 'object' && 'state' in reseller.address ? String(reseller.address.state || '') : '',
        zipCode: typeof reseller.address === 'object' && 'zipCode' in reseller.address ? String(reseller.address.zipCode || '') : ''
      } : undefined
    })) as Reseller[];
  }
}
