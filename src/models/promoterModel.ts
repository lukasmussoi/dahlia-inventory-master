
import { supabase } from "@/integrations/supabase/client";
import { Promoter, PromoterInput } from "@/types/promoter";

export class PromoterModel {
  static async getAll(): Promise<Promoter[]> {
    const { data, error } = await supabase
      .from('promoters')
      .select('*')
      .order('name');

    if (error) throw error;

    // Mapear os resultados para o formato esperado
    return data.map((promoter: any) => ({
      ...promoter,
      cpfCnpj: promoter.cpf_cnpj,
      createdAt: promoter.created_at,
      updatedAt: promoter.updated_at,
      // Converter o endereço de JSON para objeto, com verificação de tipo
      address: promoter.address ? {
        street: typeof promoter.address === 'object' && 'street' in promoter.address ? String(promoter.address.street || '') : '',
        number: typeof promoter.address === 'object' && 'number' in promoter.address ? String(promoter.address.number || '') : '',
        complement: typeof promoter.address === 'object' && 'complement' in promoter.address ? String(promoter.address.complement || '') : '',
        neighborhood: typeof promoter.address === 'object' && 'neighborhood' in promoter.address ? String(promoter.address.neighborhood || '') : '',
        city: typeof promoter.address === 'object' && 'city' in promoter.address ? String(promoter.address.city || '') : '',
        state: typeof promoter.address === 'object' && 'state' in promoter.address ? String(promoter.address.state || '') : '',
        zipCode: typeof promoter.address === 'object' && 'zipCode' in promoter.address ? String(promoter.address.zipCode || '') : ''
      } : undefined
    })) as Promoter[];
  }

  static async getById(id: string): Promise<Promoter> {
    const { data, error } = await supabase
      .from('promoters')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return {
      ...data,
      cpfCnpj: data.cpf_cnpj,
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
    } as Promoter;
  }

  static async create(promoter: PromoterInput): Promise<any> {
    const { data, error } = await supabase
      .from('promoters')
      .insert({
        name: promoter.name,
        cpf_cnpj: promoter.cpfCnpj,
        phone: promoter.phone,
        email: promoter.email,
        address: promoter.address as any,
        status: promoter.status
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

  static async update(id: string, promoter: PromoterInput): Promise<any> {
    const { data, error } = await supabase
      .from('promoters')
      .update({
        name: promoter.name,
        cpf_cnpj: promoter.cpfCnpj,
        phone: promoter.phone,
        email: promoter.email,
        address: promoter.address as any,
        status: promoter.status
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

  static async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('promoters')
        .delete()
        .eq('id', id);

      if (error) {
        // Verificar se é erro de violação de chave estrangeira (revendedoras associadas)
        if (error.code === '23503') {
          throw new Error('Não é possível excluir esta promotora pois existem revendedoras associadas a ela');
        }
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Erro ao excluir promotora:', error);
      throw error;
    }
  }

  static async searchPromoters(query: string, status?: string): Promise<Promoter[]> {
    let request = supabase
      .from('promoters')
      .select('*')
      .order('name');

    // Adicionar filtros se fornecidos
    if (query) {
      request = request.ilike('name', `%${query}%`);
    }

    if (status && (status === 'Ativa' || status === 'Inativa')) {
      request = request.eq('status', status);
    }

    const { data, error } = await request;

    if (error) throw error;

    // Mapear os resultados para o formato esperado
    return data.map((promoter: any) => ({
      ...promoter,
      cpfCnpj: promoter.cpf_cnpj,
      createdAt: promoter.created_at,
      updatedAt: promoter.updated_at,
      address: promoter.address ? {
        street: typeof promoter.address === 'object' && 'street' in promoter.address ? String(promoter.address.street || '') : '',
        number: typeof promoter.address === 'object' && 'number' in promoter.address ? String(promoter.address.number || '') : '',
        complement: typeof promoter.address === 'object' && 'complement' in promoter.address ? String(promoter.address.complement || '') : '',
        neighborhood: typeof promoter.address === 'object' && 'neighborhood' in promoter.address ? String(promoter.address.neighborhood || '') : '',
        city: typeof promoter.address === 'object' && 'city' in promoter.address ? String(promoter.address.city || '') : '',
        state: typeof promoter.address === 'object' && 'state' in promoter.address ? String(promoter.address.state || '') : '',
        zipCode: typeof promoter.address === 'object' && 'zipCode' in promoter.address ? String(promoter.address.zipCode || '') : ''
      } : undefined
    })) as Promoter[];
  }

  static async hasAssociatedResellers(id: string): Promise<boolean> {
    const { data, error, count } = await supabase
      .from('resellers')
      .select('id', { count: 'exact', head: true })
      .eq('promoter_id', id);

    if (error) throw error;

    return count !== null && count > 0;
  }
}
