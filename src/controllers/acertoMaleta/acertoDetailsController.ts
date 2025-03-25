
/**
 * Controlador de Detalhes de Acerto
 * @file Este arquivo contém operações relacionadas à busca de detalhes de um acerto específico.
 * @relacionamento Utiliza o cliente Supabase para acessar os dados.
 */
import { supabase } from "@/integrations/supabase/client";
import { Acerto } from "@/types/suitcase";

export class AcertoDetailsController {
  /**
   * Busca detalhes completos de um acerto pelo ID
   * @param id ID do acerto
   * @returns Detalhes completos do acerto incluindo itens vendidos
   */
  static async getAcertoById(id: string): Promise<Acerto> {
    try {
      const { data, error } = await supabase
        .from('acertos_maleta')
        .select(`
          *,
          suitcase:suitcases(*, seller:resellers(*)),
          seller:resellers(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      const { data: itemsVendidos, error: itemsError } = await supabase
        .from('acerto_itens_vendidos')
        .select(`
          *,
          product:inventory(id, name, sku, price, photo_url:inventory_photos(photo_url))
        `)
        .eq('acerto_id', id);
      
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
        ...data,
        items_vendidos: itemsVendidosProcessados || []
      };
    } catch (error) {
      console.error("Erro ao buscar detalhes do acerto:", error);
      throw new Error("Erro ao buscar detalhes do acerto");
    }
  }
}
