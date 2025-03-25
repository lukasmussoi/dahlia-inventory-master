
/**
 * Modelo de Maletas
 * @file Funções relacionadas às maletas
 */
import { supabase } from "@/integrations/supabase/client";
import { SuitcaseStatus, Suitcase } from "@/types/suitcase";
import { BaseSuitcaseModel } from "./baseModel";

export class SuitcaseModel {
  // Buscar total de maletas ativas
  static async getActiveSuitcases(): Promise<number> {
    const { data, error } = await supabase
      .from('suitcases')
      .select('id')
      .eq('status', 'in_use');
    
    if (error) throw error;
    return data?.length || 0;
  }

  // Buscar todas as maletas
  static async getAllSuitcases(filters?: any): Promise<Suitcase[]> {
    const { data, error } = await supabase
      .from('suitcases')
      .select(`
        *,
        seller:resellers!suitcases_seller_id_fkey (
          id,
          name,
          phone,
          address
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Converter os resultados para se adequar à interface Suitcase
    return (data || []).map(item => {
      // Processar o endereço do vendedor
      const sellerAddress = BaseSuitcaseModel.processSellerAddress(item.seller?.address);
      
      return {
        id: item.id,
        code: item.code || '',
        seller_id: item.seller_id,
        status: item.status as SuitcaseStatus,
        city: item.city,
        neighborhood: item.neighborhood,
        created_at: item.created_at,
        updated_at: item.updated_at,
        next_settlement_date: item.next_settlement_date,
        sent_at: item.sent_at,
        seller: item.seller ? {
          id: item.seller.id,
          name: item.seller.name,
          phone: item.seller.phone,
          address: sellerAddress
        } : undefined
      };
    });
  }

  // Buscar resumo das maletas (contagem por status)
  static async getSuitcaseSummary(): Promise<{
    total: number;
    in_use: number;
    returned: number;
    in_replenishment: number;
  }> {
    const { data, error } = await supabase
      .from('suitcases')
      .select('status');
    
    if (error) throw error;
    
    const summary = {
      total: data?.length || 0,
      in_use: data?.filter(item => item.status === 'in_use')?.length || 0,
      returned: data?.filter(item => item.status === 'returned')?.length || 0,
      in_replenishment: data?.filter(item => item.status === 'in_replenishment')?.length || 0
    };
    
    return summary;
  }

  // Buscar uma maleta pelo ID
  static async getSuitcaseById(id: string): Promise<Suitcase | null> {
    if (!id) throw new Error("ID da maleta é necessário");
    
    const { data, error } = await supabase
      .from('suitcases')
      .select(`
        *,
        seller:resellers!suitcases_seller_id_fkey (
          id,
          name,
          phone,
          address
        )
      `)
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    if (!data) return null;
    
    // Processar o endereço do vendedor
    const sellerAddress = BaseSuitcaseModel.processSellerAddress(data.seller?.address);
    
    return {
      id: data.id,
      code: data.code || '',
      seller_id: data.seller_id,
      status: data.status as SuitcaseStatus,
      city: data.city,
      neighborhood: data.neighborhood,
      created_at: data.created_at,
      updated_at: data.updated_at,
      next_settlement_date: data.next_settlement_date,
      sent_at: data.sent_at,
      seller: data.seller ? {
        id: data.seller.id,
        name: data.seller.name,
        phone: data.seller.phone,
        address: sellerAddress
      } : undefined
    };
  }

  // Criar nova maleta
  static async createSuitcase(suitcaseData: {
    seller_id: string;
    status?: SuitcaseStatus;
    city?: string;
    neighborhood?: string;
    code?: string;
    next_settlement_date?: string;
  }): Promise<Suitcase> {
    if (!suitcaseData.seller_id) throw new Error("ID da revendedora é obrigatório");
    if (!suitcaseData.city || !suitcaseData.neighborhood) throw new Error("Cidade e Bairro são obrigatórios");
    
    // Certificar-se de que status é um valor válido
    const validStatus: SuitcaseStatus = suitcaseData.status || 'in_use';
    
    const { data, error } = await supabase
      .from('suitcases')
      .insert({
        ...suitcaseData,
        status: validStatus
      })
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error("Erro ao criar maleta: nenhum dado retornado");
    
    return {
      id: data.id,
      code: data.code || '',
      seller_id: data.seller_id,
      status: data.status as SuitcaseStatus,
      city: data.city,
      neighborhood: data.neighborhood,
      created_at: data.created_at,
      updated_at: data.updated_at,
      next_settlement_date: data.next_settlement_date,
      sent_at: data.sent_at
    };
  }

  // Atualizar maleta
  static async updateSuitcase(id: string, updates: Partial<Suitcase>): Promise<Suitcase> {
    if (!id) throw new Error("ID da maleta é necessário");
    
    try {
      // Remover campos que não devem ser enviados ao banco
      const cleanUpdates = { ...updates };
      // Remover campos calculados ou relacionamentos que não existem na tabela
      if ('seller' in cleanUpdates) delete cleanUpdates.seller;
      
      const { data, error } = await supabase
        .from('suitcases')
        .update(cleanUpdates)
        .eq('id', id)
        .select()
        .maybeSingle();
      
      if (error) {
        console.error("Erro ao atualizar maleta:", error);
        throw error;
      }
      
      if (!data) throw new Error("Erro ao atualizar maleta: nenhum dado retornado");
      
      return {
        id: data.id,
        code: data.code || '',
        seller_id: data.seller_id,
        status: data.status as SuitcaseStatus,
        city: data.city,
        neighborhood: data.neighborhood,
        created_at: data.created_at,
        updated_at: data.updated_at,
        next_settlement_date: data.next_settlement_date,
        sent_at: data.sent_at
      };
    } catch (error) {
      console.error("Erro detalhado ao atualizar maleta:", error);
      throw error;
    }
  }

  // Excluir maleta
  static async deleteSuitcase(id: string): Promise<void> {
    if (!id) throw new Error("ID da maleta é necessário");
    
    const { error } = await supabase
      .from('suitcases')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Buscar maletas filtradas
  static async searchSuitcases(filters: {
    status?: string;
    search?: string;
    city?: string;
    neighborhood?: string;
  }): Promise<Suitcase[]> {
    let query = supabase
      .from('suitcases')
      .select(`
        *,
        seller:resellers!suitcases_seller_id_fkey (
          id,
          name,
          phone,
          address
        )
      `);
    
    // Aplicar filtros se fornecidos
    if (filters.status && filters.status !== 'todos') {
      // Garantir que o status é um dos valores válidos
      const validStatuses = ['in_use', 'returned', 'lost', 'in_audit', 'in_replenishment'];
      if (validStatuses.includes(filters.status)) {
        // Corrigindo o erro de tipagem - fazendo casting para SuitcaseStatus
        query = query.eq('status', filters.status as SuitcaseStatus);
      }
    }
    
    if (filters.city) {
      query = query.ilike('city', `%${filters.city}%`);
    }
    
    if (filters.neighborhood) {
      query = query.ilike('neighborhood', `%${filters.neighborhood}%`);
    }
    
    if (filters.search) {
      // Buscar por código da maleta, nome da revendedora ou bairro
      query = query.or(`code.ilike.%${filters.search}%,seller.name.ilike.%${filters.search}%,neighborhood.ilike.%${filters.search}%`);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Converter os resultados para se adequar à interface Suitcase
    return (data || []).map(item => {
      // Processar o endereço do vendedor
      const sellerAddress = BaseSuitcaseModel.processSellerAddress(item.seller?.address);
      
      return {
        id: item.id,
        code: item.code || '',
        seller_id: item.seller_id,
        status: item.status as SuitcaseStatus,
        city: item.city,
        neighborhood: item.neighborhood,
        created_at: item.created_at,
        updated_at: item.updated_at,
        next_settlement_date: item.next_settlement_date,
        sent_at: item.sent_at,
        seller: item.seller ? {
          id: item.seller.id,
          name: item.seller.name,
          phone: item.seller.phone,
          address: sellerAddress
        } : undefined
      };
    });
  }
}
