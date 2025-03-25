
/**
 * Modelo de Maletas
 * @file Este arquivo contém todas as operações de banco de dados relacionadas às maletas
 * @depends integrations/supabase/client - Cliente Supabase para acesso ao banco
 * @depends types/suitcase - Tipos e interfaces relacionados às maletas
 */
import { supabase } from "@/integrations/supabase/client";
import { Suitcase, SuitcaseStatus } from "@/types/suitcase";

export class SuitcaseModel {
  /**
   * Obtém todas as maletas ativas
   * @returns Lista de maletas ativas
   */
  static async getActiveSuitcases() {
    const { data, error } = await supabase
      .from('suitcases')
      .select(`
        *,
        seller:resellers(id, name, phone, commission_rate, address)
      `)
      .eq('status', 'in_use')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Obtém todas as maletas com filtros opcionais
   * @param filters Filtros a serem aplicados na consulta
   * @returns Lista de maletas filtradas
   */
  static async getAllSuitcases(filters?: any) {
    let query = supabase
      .from('suitcases')
      .select(`
        *,
        seller:resellers(id, name, phone, commission_rate, address)
      `)
      .order('created_at', { ascending: false });
    
    // Aplicar filtros se fornecidos
    if (filters) {
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.search) {
        query = query.or(`code.ilike.%${filters.search}%,resellers.name.ilike.%${filters.search}%`);
      }
      if (filters.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }
      if (filters.neighborhood) {
        query = query.ilike('neighborhood', `%${filters.neighborhood}%`);
      }
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  }

  /**
   * Obtém um resumo das maletas por status
   * @returns Objeto com contagens de maletas por status
   */
  static async getSuitcaseSummary() {
    const { data, error } = await supabase
      .from('suitcases')
      .select('status')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Contar maletas por status
    const summary = {
      total: data.length,
      in_use: 0,
      returned: 0,
      in_replenishment: 0,
      lost: 0,
      in_audit: 0
    };
    
    data.forEach(suitcase => {
      switch (suitcase.status) {
        case 'in_use':
          summary.in_use++;
          break;
        case 'returned':
          summary.returned++;
          break;
        case 'in_replenishment':
          summary.in_replenishment++;
          break;
        case 'lost':
          summary.lost++;
          break;
        case 'in_audit':
          summary.in_audit++;
          break;
      }
    });
    
    return summary;
  }

  /**
   * Obtém uma maleta pelo ID
   * @param id ID da maleta
   * @returns Objeto da maleta ou null se não encontrada
   */
  static async getSuitcaseById(id: string): Promise<Suitcase | null> {
    if (!id) return null;
    
    const { data, error } = await supabase
      .from('suitcases')
      .select(`
        *,
        seller:resellers(id, name, phone, commission_rate, address)
      `)
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  /**
   * Cria uma nova maleta
   * @param suitcaseData Dados da maleta
   * @returns Objeto da maleta criada
   */
  static async createSuitcase(suitcaseData: {
    code?: string;
    seller_id: string;
    city?: string;
    neighborhood?: string;
    status?: SuitcaseStatus;
    sent_at?: string;
  }): Promise<Suitcase> {
    const { data, error } = await supabase
      .from('suitcases')
      .insert({
        ...suitcaseData,
        sent_at: suitcaseData.sent_at || new Date().toISOString()
      })
      .select(`
        *,
        seller:resellers(id, name, phone, commission_rate, address)
      `)
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Atualiza uma maleta existente
   * @param id ID da maleta
   * @param updates Dados a serem atualizados
   * @returns Objeto da maleta atualizada
   */
  static async updateSuitcase(id: string, updates: Partial<Suitcase>): Promise<Suitcase> {
    const { data, error } = await supabase
      .from('suitcases')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        seller:resellers(id, name, phone, commission_rate, address)
      `)
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Exclui uma maleta
   * @param id ID da maleta
   */
  static async deleteSuitcase(id: string): Promise<void> {
    const { error } = await supabase
      .from('suitcases')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  /**
   * Pesquisa maletas com base em filtros
   * @param filters Critérios de pesquisa
   * @returns Lista de maletas que correspondem aos critérios
   */
  static async searchSuitcases(filters: any): Promise<Suitcase[]> {
    let query = supabase
      .from('suitcases')
      .select(`
        *,
        seller:resellers(id, name, phone, commission_rate, address)
      `);
    
    if (filters.searchTerm) {
      query = query.or(`code.ilike.%${filters.searchTerm}%,resellers.name.ilike.%${filters.searchTerm}%`);
    }
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.city) {
      query = query.ilike('city', `%${filters.city}%`);
    }
    
    if (filters.neighborhood) {
      query = query.ilike('neighborhood', `%${filters.neighborhood}%`);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
}

// Exportação por padrão
export default SuitcaseModel;
