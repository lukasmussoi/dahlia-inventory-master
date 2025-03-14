
import { supabase } from "@/integrations/supabase/client";
import { Reseller, ResellerInput, ResellerStatus } from "@/types/reseller";

export class ResellerModel {
  static async getAll() {
    try {
      const { data, error } = await supabase
        .from('resellers')
        .select(`
          *,
          promoters:promoter_id (name)
        `)
        .order('name');

      if (error) throw error;

      return data.map((reseller: any) => ({
        id: reseller.id,
        name: reseller.name,
        cpfCnpj: reseller.cpf_cnpj,
        phone: reseller.phone,
        email: reseller.email,
        status: reseller.status as ResellerStatus,
        promoterId: reseller.promoter_id,
        promoterName: reseller.promoters?.name,
        address: reseller.address ? {
          street: reseller.address.street || '',
          number: reseller.address.number || '',
          complement: reseller.address.complement || '',
          neighborhood: reseller.address.neighborhood || '',
          city: reseller.address.city || '',
          state: reseller.address.state || '',
          zipCode: reseller.address.zipCode || ''
        } : undefined,
        createdAt: reseller.created_at,
        updatedAt: reseller.updated_at
      })) as Reseller[];
    } catch (error) {
      console.error('Erro ao buscar revendedoras:', error);
      throw error;
    }
  }

  static async getById(id: string): Promise<Reseller> {
    try {
      const { data, error } = await supabase
        .from('resellers')
        .select(`
          *,
          promoters:promoter_id (name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        cpfCnpj: data.cpf_cnpj,
        phone: data.phone,
        email: data.email,
        status: data.status as ResellerStatus,
        promoterId: data.promoter_id,
        promoterName: data.promoters?.name,
        address: data.address ? {
          street: data.address.street || '',
          number: data.address.number || '',
          complement: data.address.complement || '',
          neighborhood: data.address.neighborhood || '',
          city: data.address.city || '',
          state: data.address.state || '',
          zipCode: data.address.zipCode || ''
        } : undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      } as Reseller;
    } catch (error) {
      console.error(`Erro ao buscar revendedora ${id}:`, error);
      throw error;
    }
  }

  static async create(resellerData: ResellerInput): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('resellers')
        .insert({
          name: resellerData.name,
          cpf_cnpj: resellerData.cpfCnpj,
          phone: resellerData.phone,
          email: resellerData.email,
          status: resellerData.status,
          promoter_id: resellerData.promoterId,
          address: resellerData.address ? {
            street: resellerData.address.street,
            number: resellerData.address.number,
            complement: resellerData.address.complement,
            neighborhood: resellerData.address.neighborhood,
            city: resellerData.address.city,
            state: resellerData.address.state,
            zipCode: resellerData.address.zipCode
          } : null
        })
        .select('id')
        .single();

      if (error) {
        // Verificar se é erro de CPF/CNPJ duplicado
        if (error.code === '23505' && error.message.includes('cpf_cnpj')) {
          throw new Error('CPF/CNPJ já cadastrado no sistema.');
        }
        throw error;
      }

      return data.id;
    } catch (error) {
      console.error('Erro ao criar revendedora:', error);
      throw error;
    }
  }

  static async update(id: string, resellerData: Partial<ResellerInput>): Promise<boolean> {
    try {
      const updateData: any = {};
      
      if (resellerData.name !== undefined) updateData.name = resellerData.name;
      if (resellerData.cpfCnpj !== undefined) updateData.cpf_cnpj = resellerData.cpfCnpj;
      if (resellerData.phone !== undefined) updateData.phone = resellerData.phone;
      if (resellerData.email !== undefined) updateData.email = resellerData.email;
      if (resellerData.status !== undefined) updateData.status = resellerData.status;
      if (resellerData.promoterId !== undefined) updateData.promoter_id = resellerData.promoterId;
      if (resellerData.address !== undefined) {
        updateData.address = {
          street: resellerData.address.street,
          number: resellerData.address.number,
          complement: resellerData.address.complement,
          neighborhood: resellerData.address.neighborhood,
          city: resellerData.address.city,
          state: resellerData.address.state,
          zipCode: resellerData.address.zipCode
        };
      }

      const { error } = await supabase
        .from('resellers')
        .update(updateData)
        .eq('id', id);

      if (error) {
        if (error.code === '23505' && error.message.includes('cpf_cnpj')) {
          throw new Error('CPF/CNPJ já cadastrado no sistema.');
        }
        throw error;
      }

      return true;
    } catch (error) {
      console.error(`Erro ao atualizar revendedora ${id}:`, error);
      throw error;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('resellers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Erro ao excluir revendedora ${id}:`, error);
      throw error;
    }
  }
}
