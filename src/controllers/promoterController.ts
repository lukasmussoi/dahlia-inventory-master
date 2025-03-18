import { supabase } from "@/integrations/supabase/client";

export const promoterController = {
  async getAllPromoters() {
    try {
      const { data, error } = await supabase
        .from('promoters')
        .select('*');
      
      if (error) {
        console.error("Erro ao buscar promotoras:", error);
        throw new Error("Erro ao buscar promotoras");
      }
      
      return data || [];
    } catch (error) {
      console.error("Erro ao buscar promotoras:", error);
      throw new Error("Erro ao buscar promotoras");
    }
  },
  
  async getPromoterById(id: string) {
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
      
      return data;
    } catch (error) {
      console.error("Erro ao buscar promotora:", error);
      throw new Error("Erro ao buscar promotora");
    }
  },
  
  async createPromoter(promoterData: any) {
    try {
      const { data, error } = await supabase
        .from('promoters')
        .insert([promoterData])
        .select()
        .single();
      
      if (error) {
        console.error("Erro ao criar promotora:", error);
        throw new Error("Erro ao criar promotora");
      }
      
      return data;
    } catch (error) {
      console.error("Erro ao criar promotora:", error);
      throw new Error("Erro ao criar promotora");
    }
  },
  
  async updatePromoter(id: string, promoterData: any) {
    try {
      const { data, error } = await supabase
        .from('promoters')
        .update(promoterData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error("Erro ao atualizar promotora:", error);
        throw new Error("Erro ao atualizar promotora");
      }
      
      return data;
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
      const { data, error } = await supabase
        .from('resellers')
        .select(`
          promoter_id,
          promoters (
            id,
            name,
            phone
          )
        `)
        .eq('id', resellerId)
        .maybeSingle();
        
      if (error) throw error;
      
      if (!data || !data.promoter_id) {
        return null;
      }
      
      return data.promoters;
    } catch (error) {
      console.error("Erro ao buscar promotora da revendedora:", error);
      return null;
    }
  },
};

// Exportar alias para manter compatibilidade
export const PromoterController = promoterController;
