import { supabase } from "@/integrations/supabase/client";
import { Promoter, PromoterInput } from "@/types/promoter";

export const promoterController = {
  async getAllPromoters(): Promise<Promoter[]> {
    try {
      const { data, error } = await supabase
        .from('promoters')
        .select('*');
      
      if (error) {
        console.error("Erro ao buscar promotoras:", error);
        throw new Error("Erro ao buscar promotoras");
      }
      
      // Mapear colunas do BD para interface do front-end
      return (data || []).map(p => ({
        id: p.id,
        name: p.name,
        cpfCnpj: p.name, // Campo não existe no BD, usando name como fallback
        phone: p.phone,
        email: p.email || "",
        address: p.address ? (typeof p.address === 'string' ? p.address : JSON.stringify(p.address)) : undefined,
        status: p.active ? 'Ativa' : 'Inativa',
        createdAt: p.created_at,
        updatedAt: p.updated_at
      }));
    } catch (error) {
      console.error("Erro ao buscar promotoras:", error);
      throw new Error("Erro ao buscar promotoras");
    }
  },
  
  async getPromoterById(id: string): Promise<Promoter> {
    try {
      const { data, error } = await supabase
        .from('promoters')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error("Erro ao buscar promotora:", error);
        throw new Error("Erro ao buscar promotora");
      }
      
      // Mapear colunas do BD para interface do front-end
      return {
        id: data.id,
        name: data.name,
        cpfCnpj: data.name, // Campo não existe no BD, usando name como fallback
        phone: data.phone,
        email: data.email || "",
        address: data.address ? (typeof data.address === 'string' ? data.address : JSON.stringify(data.address)) : undefined,
        status: data.active ? 'Ativa' : 'Inativa',
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error("Erro ao buscar promotora:", error);
      throw new Error("Erro ao buscar promotora");
    }
  },
  
  async createPromoter(promoterData: PromoterInput) {
    try {
      const { data, error } = await supabase
        .from('promoters')
        .insert([{
          name: promoterData.name,
          phone: promoterData.phone,
          email: promoterData.email,
          address: typeof promoterData.address === 'string' ? promoterData.address : JSON.stringify(promoterData.address),
          active: promoterData.status === 'Ativa'
        }])
        .select()
        .single();
      
      if (error) {
        console.error("Erro ao criar promotora:", error);
        throw new Error("Erro ao criar promotora");
      }
      
      // Mapear colunas do BD para interface do front-end
      return {
        id: data.id,
        name: data.name,
        cpfCnpj: data.name, // Campo não existe no BD, usando name como fallback
        phone: data.phone,
        email: data.email || "",
        address: data.address ? (typeof data.address === 'string' ? data.address : JSON.stringify(data.address)) : undefined,
        status: data.active ? 'Ativa' : 'Inativa',
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error("Erro ao criar promotora:", error);
      throw new Error("Erro ao criar promotora");
    }
  },
  
  async updatePromoter(id: string, promoterData: PromoterInput) {
    try {
      const { data, error } = await supabase
        .from('promoters')
        .update({
          name: promoterData.name,
          phone: promoterData.phone,
          email: promoterData.email,
          address: typeof promoterData.address === 'string' ? promoterData.address : JSON.stringify(promoterData.address),
          active: promoterData.status === 'Ativa'
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error("Erro ao atualizar promotora:", error);
        throw new Error("Erro ao atualizar promotora");
      }
      
      // Mapear colunas do BD para interface do front-end
      return {
        id: data.id,
        name: data.name,
        cpfCnpj: data.name, // Campo não existe no BD, usando name como fallback
        phone: data.phone,
        email: data.email || "",
        address: data.address ? (typeof data.address === 'string' ? data.address : JSON.stringify(data.address)) : undefined,
        status: data.active ? 'Ativa' : 'Inativa',
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error("Erro ao atualizar promotora:", error);
      throw new Error("Erro ao atualizar promotora");
    }
  },
  
  async deletePromoter(id: string) {
    try {
      const { error } = await supabase
        .from('promoters')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error("Erro ao excluir promotora:", error);
        throw new Error("Erro ao excluir promotora");
      }
      
      return true;
    } catch (error) {
      console.error("Erro ao excluir promotora:", error);
      throw new Error("Erro ao excluir promotora");
    }
  },
  
  async getPromoterByResellerId(resellerId: string) {
    try {
      // Como não existe promoter_id na tabela resellers, retornamos null
      console.log("Função getPromoterByResellerId chamada mas não há relação promoter_id na tabela resellers");
      return null;
    } catch (error) {
      console.error("Erro ao buscar promotora da revendedora:", error);
      return null;
    }
  },

  async searchPromoters(query: string, status?: string): Promise<Promoter[]> {
    try {
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
      return (data || []).map(p => ({
        id: p.id,
        name: p.name,
        cpfCnpj: p.name, // Campo não existe no BD, usando name como fallback
        phone: p.phone,
        email: p.email || "",
        address: p.address ? (typeof p.address === 'string' ? p.address : JSON.stringify(p.address)) : undefined,
        status: p.active ? 'Ativa' : 'Inativa',
        createdAt: p.created_at,
        updatedAt: p.updated_at
      }));
    } catch (error) {
      console.error("Erro ao buscar promotoras:", error);
      throw new Error("Erro ao buscar promotoras");
    }
  }
};

// Função auxiliar para mapear o endereço do formato Json para o objeto Address
function mapPromoteAddressFromDb(addressJson: any) {
  if (!addressJson) return undefined;
  
  return {
    street: addressJson.street || '',
    number: addressJson.number || '',
    complement: addressJson.complement || '',
    neighborhood: addressJson.neighborhood || '',
    city: addressJson.city || '',
    state: addressJson.state || '',
    zipCode: addressJson.zipCode || ''
  };
}

// Exportar alias para manter compatibilidade
export const PromoterController = promoterController;
