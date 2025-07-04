
/**
 * Controlador de Listagem de Acertos
 * @file Este arquivo contém operações relacionadas à listagem e filtragem de acertos de maleta.
 * @relacionamento Utiliza o cliente Supabase para acessar os dados.
 */
import { supabase } from "@/integrations/supabase/client";
import { Acerto } from "@/types/suitcase";
import { getProductPhotoUrl } from "@/utils/photoUtils";

export class AcertoListController {
  /**
   * Busca todos os acertos com aplicação de filtros opcionais
   * @param filters Filtros para aplicar na busca
   * @returns Lista de acertos
   */
  static async getAllAcertos(filters?: any): Promise<Acerto[]> {
    try {
      let query = supabase
        .from('acerto_maleta')
        .select(`
          *,
          suitcase:suitcases(*),
          promoter:promoters(*)
        `)
        .order('data_acerto', { ascending: false });

      if (filters) {
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        if (filters.seller_id) {
          query = query.eq('seller_id', filters.seller_id);
        }
        if (filters.dateFrom) {
          query = query.gte('settlement_date', filters.dateFrom);
        }
        if (filters.dateTo) {
          query = query.lte('settlement_date', filters.dateTo);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Erro ao buscar acertos:", error);
      throw new Error("Erro ao buscar acertos");
    }
  }

  /**
   * Busca todos os acertos relacionados a uma maleta específica
   * @param suitcaseId ID da maleta
   * @returns Lista de acertos da maleta com detalhes de itens vendidos
   */
  static async getAcertosBySuitcase(suitcaseId: string): Promise<Acerto[]> {
    try {
      const { data: acertos, error } = await supabase
        .from('acerto_maleta')
        .select(`
          *,
          suitcase:suitcases(*, promoters(name, email, phone)),
          promoter:promoters(*)
        `)
        .eq('suitcase_id', suitcaseId)
        .order('data_acerto', { ascending: false });

      if (error) throw error;
      
      const acertosCompletos = await Promise.all(
        (acertos || []).map(async (acerto) => {
          const { data: itemsVendidos, error: itemsError } = await supabase
            .from('acerto_itens_vendidos')
            .select(`
              *,
              product:inventory(id, name, sku, price, photo_url:inventory_photos(photo_url))
            `)
            .eq('acerto_id', acerto.id);
          
          if (itemsError) throw itemsError;
          
          const itemsVendidosProcessados = itemsVendidos?.map(item => {
            let product = item.product;
            if (product && Array.isArray(product.photo_url) && product.photo_url.length > 0) {
              product = {
                ...product,
                photo_url: product.photo_url
              };
            }
            return {
              ...item,
              product
            };
          });
          
          return {
            ...acerto,
            items_vendidos: itemsVendidosProcessados || []
          };
        })
      );
      
      return acertosCompletos;
    } catch (error) {
      console.error("Erro ao buscar acertos da maleta:", error);
      throw new Error("Erro ao buscar acertos da maleta");
    }
  }
}
