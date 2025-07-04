
/**
 * Controlador de Detalhes de Acerto
 * @file Este arquivo contém operações relacionadas à busca de detalhes de um acerto específico.
 * @relacionamento Utiliza o cliente Supabase para acessar os dados.
 */
import { supabase } from "@/integrations/supabase/client";
import { Acerto, AcertoStatus } from "@/types/suitcase";
import { getProductPhotoUrl } from "@/utils/photoUtils";

export class AcertoDetailsController {
  /**
   * Busca detalhes completos de um acerto pelo ID
   * @param id ID do acerto
   * @returns Detalhes completos do acerto incluindo itens vendidos
   */
  static async getAcertoById(id: string): Promise<Acerto> {
    try {
      console.log("Buscando detalhes do acerto:", id);
      
      const { data, error } = await supabase
        .from('acerto_maleta')
        .select(`
          *,
          suitcase:suitcases(*, promoters(name, email, phone)),
          promoter:promoters(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error("Erro ao buscar acerto:", error);
        throw error;
      }
      
      // Buscar os itens vendidos associados a este acerto
      const { data: itemsVendidos, error: itemsError } = await supabase
        .from('acerto_itens_vendidos')
        .select(`
          *,
          product:inventory(id, name, sku, price, unit_cost, photo_url:inventory_photos(photo_url))
        `)
        .eq('acerto_id', id);
      
      if (itemsError) {
        console.error("Erro ao buscar itens vendidos do acerto:", itemsError);
        throw itemsError;
      }
      
      // Processar os itens vendidos para normalizar a estrutura das fotos dos produtos
      const itemsVendidosProcessados = itemsVendidos?.map(item => {
        let product = { ...item.product };
        
        // Garantir que product.photo_url seja sempre um array do tipo PhotoUrl[]
        if (product) {
          // Caso 1: photo_url é uma array de objetos com a estrutura correta
          if (Array.isArray(product.photo_url) && product.photo_url.length > 0) {
            // Extrair a primeira URL de foto do array e garantir formato correto
            const photoUrl = product.photo_url[0]?.photo_url || null;
            product.photo_url = photoUrl ? [{ photo_url: photoUrl }] : [];
          } 
          // Caso 2: photo_url é uma string
          else if (typeof product.photo_url === 'string') {
            product.photo_url = product.photo_url ? [{ photo_url: product.photo_url }] : [];
          }
          // Caso 3: photo_url é null, undefined ou outro formato inesperado
          else {
            product.photo_url = [];
          }
        }
        
        return {
          ...item,
          product
        };
      });
      
      // Calcular totais adicionais
      const totalCost = itemsVendidosProcessados?.reduce((sum, item) => sum + ((item.product?.unit_cost || 0) * item.quantity), 0) || 0;
      const netProfit = (data.total_vendido || 0) - (data.total_comissao || 0) - totalCost;
      
      // Combinar os dados do acerto com os itens vendidos e totais calculados
      return {
        ...data,
        status: data.status as AcertoStatus,
        items_vendidos: itemsVendidosProcessados || [],
        total_cost: totalCost,
        net_profit: netProfit
      };
    } catch (error) {
      console.error("Erro ao buscar detalhes completos do acerto:", error);
      throw new Error("Erro ao buscar detalhes do acerto");
    }
  }
}
