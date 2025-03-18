
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
      id: promoter.id,
      name: promoter.name,
      cpfCnpj: promoter.cpf_cnpj,
      phone: promoter.phone,
      email: promoter.email || "",
      status: promoter.status,
      createdAt: promoter.created_at,
      updatedAt: promoter.updated_at,
      // Converter o endereço de JSON para objeto, com verificação de tipo
      address: promoter.address ? this.mapAddressFromJson(promoter.address) : undefined
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
      id: data.id,
      name: data.name,
      cpfCnpj: data.cpf_cnpj,
      phone: data.phone,
      email: data.email || "",
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      address: data.address ? this.mapAddressFromJson(data.address) : undefined
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

    const createdPromoter = data[0];
    return {
      id: createdPromoter.id,
      name: createdPromoter.name,
      cpfCnpj: createdPromoter.cpf_cnpj,
      phone: createdPromoter.phone,
      email: createdPromoter.email || "",
      status: createdPromoter.status,
      createdAt: createdPromoter.created_at,
      updatedAt: createdPromoter.updated_at,
      address: createdPromoter.address ? this.mapAddressFromJson(createdPromoter.address) : undefined
    } as Promoter;
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

    const updatedPromoter = data[0];
    return {
      id: updatedPromoter.id,
      name: updatedPromoter.name,
      cpfCnpj: updatedPromoter.cpf_cnpj,
      phone: updatedPromoter.phone,
      email: updatedPromoter.email || "",
      status: updatedPromoter.status,
      createdAt: updatedPromoter.created_at,
      updatedAt: updatedPromoter.updated_at,
      address: updatedPromoter.address ? this.mapAddressFromJson(updatedPromoter.address) : undefined
    } as Promoter;
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
      id: promoter.id,
      name: promoter.name,
      cpfCnpj: promoter.cpf_cnpj,
      phone: promoter.phone,
      email: promoter.email || "",
      status: promoter.status,
      createdAt: promoter.created_at,
      updatedAt: promoter.updated_at,
      address: promoter.address ? this.mapAddressFromJson(promoter.address) : undefined
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

  private static mapAddressFromJson(addressJson: any) {
    if (!addressJson) return undefined;
    
    return {
      street: typeof addressJson === 'object' && 'street' in addressJson ? String(addressJson.street || '') : '',
      number: typeof addressJson === 'object' && 'number' in addressJson ? String(addressJson.number || '') : '',
      complement: typeof addressJson === 'object' && 'complement' in addressJson ? String(addressJson.complement || '') : '',
      neighborhood: typeof addressJson === 'object' && 'neighborhood' in addressJson ? String(addressJson.neighborhood || '') : '',
      city: typeof addressJson === 'object' && 'city' in addressJson ? String(addressJson.city || '') : '',
      state: typeof addressJson === 'object' && 'state' in addressJson ? String(addressJson.state || '') : '',
      zipCode: typeof addressJson === 'object' && 'zipCode' in addressJson ? String(addressJson.zipCode || '') : ''
    };
  }
}
