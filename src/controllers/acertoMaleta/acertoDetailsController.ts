
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
      console.log("Buscando detalhes do acerto:", id);
      
      const { data, error } = await supabase
        .from('acertos_maleta')
        .select(`
          *,
          suitcase:suitcases(*, seller:resellers(*)),
          seller:resellers(*)
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
      
      // Agrupar itens vendidos pelo inventory_id para cálculos corretos
      const itemsAgrupados = {};
      (itemsVendidos || []).forEach(item => {
        if (!itemsAgrupados[item.inventory_id]) {
          itemsAgrupados[item.inventory_id] = {
            ...item,
            quantidade_vendida: 1,
            preco_total: item.price || 0,
            custo_total: item.unit_cost || 0
          };
        } else {
          itemsAgrupados[item.inventory_id].quantidade_vendida += 1;
          itemsAgrupados[item.inventory_id].preco_total += (item.price || 0);
          itemsAgrupados[item.inventory_id].custo_total += (item.unit_cost || 0);
        }
      });
      
      // Processar os itens vendidos para normalizar a estrutura das fotos dos produtos
      const itemsVendidosProcessados = (itemsVendidos || []).map(item => {
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
      const itensTotais = Object.values(itemsAgrupados);
      const totalCost = itensTotais.reduce((sum, item: any) => sum + item.custo_total, 0);
      const netProfit = (data.total_sales || 0) - (data.commission_amount || 0) - totalCost;
      
      console.log("Calculando valores:", {
        totalCost,
        netProfit,
        total_sales: data.total_sales,
        commission_amount: data.commission_amount,
        itensAgrupados: itensTotais
      });
      
      // Combinar os dados do acerto com os itens vendidos e totais calculados
      return {
        ...data,
        items_vendidos: itemsVendidosProcessados || [],
        total_cost: totalCost,
        net_profit: netProfit
      };
    } catch (error) {
      console.error("Erro ao buscar detalhes completos do acerto:", error);
      throw new Error("Erro ao buscar detalhes do acerto");
    }
  }
  
  /**
   * Busca os 5 itens mais vendidos em uma maleta no histórico de todos os acertos
   * @param suitcaseId ID da maleta
   * @returns Top 5 itens vendidos
   */
  static async getTop5ItemsVendidos(suitcaseId: string) {
    try {
      console.log("Buscando top 5 itens vendidos para a maleta:", suitcaseId);
      
      // Primeiro precisamos buscar todos os acertos desta maleta
      const { data: acertos, error: acertosError } = await supabase
        .from('acertos_maleta')
        .select('id')
        .eq('suitcase_id', suitcaseId);
        
      if (acertosError) {
        console.error("Erro ao buscar acertos da maleta:", acertosError);
        return [];
      }
      
      if (!acertos || acertos.length === 0) {
        console.log("Nenhum acerto encontrado para a maleta");
        return [];
      }
      
      const acertoIds = acertos.map(a => a.id);
      
      // Buscar todos os itens vendidos em todos os acertos desta maleta
      const { data: itensVendidos, error: itensError } = await supabase
        .from('acerto_itens_vendidos')
        .select(`
          *,
          product:inventory(id, name, sku, price, photo_url:inventory_photos(photo_url))
        `)
        .in('acerto_id', acertoIds);
        
      if (itensError) {
        console.error("Erro ao buscar itens vendidos:", itensError);
        return [];
      }
      
      if (!itensVendidos || itensVendidos.length === 0) {
        console.log("Nenhum item vendido encontrado");
        return [];
      }
      
      // Agrupar por inventory_id para contar quantas vezes cada produto foi vendido
      const itemsAgrupados = {};
      itensVendidos.forEach(item => {
        if (!itemsAgrupados[item.inventory_id]) {
          itemsAgrupados[item.inventory_id] = {
            id: item.inventory_id,
            name: item.product?.name || 'Produto sem nome',
            sku: item.product?.sku || '',
            price: item.product?.price || 0,
            photo_url: this.getPhotoUrl(item.product),
            count: 1,
            total_value: item.price || 0
          };
        } else {
          itemsAgrupados[item.inventory_id].count += 1;
          itemsAgrupados[item.inventory_id].total_value += (item.price || 0);
        }
      });
      
      // Converter para array, ordenar por contagem e pegar os top 5
      const topItems = Object.values(itemsAgrupados)
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 5);
        
      console.log("Top 5 itens vendidos:", topItems);
      
      return topItems;
    } catch (error) {
      console.error("Erro ao buscar top 5 itens vendidos:", error);
      return [];
    }
  }
  
  /**
   * Extrai a URL da foto de um produto
   * @param product Produto com informações de foto
   * @returns URL da foto ou null
   */
  private static getPhotoUrl(product: any): string | null {
    if (!product) return null;
    
    if (Array.isArray(product.photo_url) && product.photo_url.length > 0) {
      return product.photo_url[0]?.photo_url || null;
    }
    
    if (typeof product.photo_url === 'string') {
      return product.photo_url;
    }
    
    return null;
  }
}
