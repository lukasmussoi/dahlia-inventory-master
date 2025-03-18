
import { supabase } from "@/integrations/supabase/client";
import { Acerto, AcertoItem, SuitcaseItem } from "@/types/suitcase";

export class AcertoMaletaModel {
  // Buscar todos os acertos
  static async getAllAcertos(): Promise<Acerto[]> {
    const { data, error } = await supabase
      .from('acertos_maleta')
      .select(`
        *,
        suitcase:suitcases!acertos_maleta_suitcase_id_fkey (
          id, 
          code,
          status
        ),
        seller:resellers!acertos_maleta_seller_id_fkey (
          id, 
          name,
          commission_rate
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data || [];
  }

  // Buscar acerto pelo ID
  static async getAcertoById(id: string): Promise<Acerto | null> {
    const { data, error } = await supabase
      .from('acertos_maleta')
      .select(`
        *,
        suitcase:suitcases!acertos_maleta_suitcase_id_fkey (
          id, 
          code,
          status,
          seller:seller_id (
            id,
            name,
            phone
          )
        ),
        seller:resellers!acertos_maleta_seller_id_fkey (
          id, 
          name,
          commission_rate
        )
      `)
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  // Buscar itens vendidos de um acerto
  static async getAcertoItems(acertoId: string): Promise<AcertoItem[]> {
    const { data, error } = await supabase
      .from('acerto_itens_vendidos')
      .select(`
        *,
        product:inventory_id (
          id,
          name,
          sku,
          price,
          photos:inventory_photos(photo_url)
        )
      `)
      .eq('acerto_id', acertoId);
    
    if (error) throw error;
    
    // Processar os dados para obter a primeira foto de cada produto
    return (data || []).map(item => {
      let photoUrl = undefined;
      
      if (item.product && 
          item.product.photos && 
          Array.isArray(item.product.photos) && 
          item.product.photos.length > 0 &&
          item.product.photos[0] && 
          typeof item.product.photos[0] === 'object' && 
          'photo_url' in item.product.photos[0]) {
        photoUrl = item.product.photos[0].photo_url;
      }
      
      return {
        ...item,
        product: item.product ? {
          ...item.product,
          photo_url: photoUrl
        } : undefined
      };
    });
  }

  // Criar um novo acerto
  static async createAcerto(acertoData: Partial<Acerto>): Promise<Acerto> {
    const { data, error } = await supabase
      .from('acertos_maleta')
      .insert(acertoData)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error("Erro ao criar acerto: nenhum dado retornado");
    
    return data;
  }

  // Adicionar itens vendidos ao acerto
  static async addAcertoItems(items: Partial<AcertoItem>[]): Promise<AcertoItem[]> {
    if (!items.length) return [];
    
    const { data, error } = await supabase
      .from('acerto_itens_vendidos')
      .insert(items)
      .select();
    
    if (error) throw error;
    return data || [];
  }

  // Atualizar um acerto
  static async updateAcerto(id: string, acertoData: Partial<Acerto>): Promise<Acerto> {
    const { data, error } = await supabase
      .from('acertos_maleta')
      .update(acertoData)
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error("Erro ao atualizar acerto: nenhum dado retornado");
    
    return data;
  }

  // Calcular a comissão com base na taxa da revendedora
  static async calcularComissao(sellerId: string, totalVendas: number): Promise<number> {
    // Buscar a taxa de comissão da revendedora na view
    const { data, error } = await supabase
      .from('seller_commission_rates')
      .select('commission_rate')
      .eq('seller_id', sellerId)
      .maybeSingle();
    
    if (error) throw error;
    
    // Taxa padrão caso não encontre
    const taxaComissao = data?.commission_rate || 0.3;
    
    // Calcular comissão
    return totalVendas * taxaComissao;
  }

  // Atualizar status dos itens na maleta para vendidos
  static async updateSuitcaseItemsToSold(suitcaseItemIds: string[]): Promise<void> {
    if (!suitcaseItemIds.length) return;
    
    const { error } = await supabase
      .from('suitcase_items')
      .update({ status: 'sold' })
      .in('id', suitcaseItemIds);
    
    if (error) throw error;
  }

  // Armazenar URL do recibo gerado para o acerto
  static async storeReceiptUrl(acertoId: string, receiptUrl: string): Promise<void> {
    const { error } = await supabase
      .from('acertos_maleta')
      .update({ receipt_url: receiptUrl })
      .eq('id', acertoId);
    
    if (error) throw error;
  }

  // Buscar histórico de vendas da revendedora (últimos 90 dias)
  static async getSellerSalesHistory(sellerId: string): Promise<any[]> {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    // Buscar acertos dos últimos 90 dias
    const { data: acertos, error: acertosError } = await supabase
      .from('acertos_maleta')
      .select('id')
      .eq('seller_id', sellerId)
      .gte('settlement_date', ninetyDaysAgo.toISOString());
    
    if (acertosError) throw acertosError;
    if (!acertos || !acertos.length) return [];
    
    const acertoIds = acertos.map(a => a.id);
    
    // Buscar itens vendidos desses acertos
    const { data: items, error: itemsError } = await supabase
      .from('acerto_itens_vendidos')
      .select(`
        *,
        product:inventory_id (
          id,
          name,
          sku,
          price,
          category_id,
          inventory_categories(name)
        )
      `)
      .in('acerto_id', acertoIds);
    
    if (itemsError) throw itemsError;
    
    return items || [];
  }
  
  // Gerar sugestões de reabastecimento baseadas no histórico
  static async generateRestockSuggestions(sellerId: string): Promise<any> {
    const salesHistory = await this.getSellerSalesHistory(sellerId);
    
    if (!salesHistory.length) return [];
    
    // Agrupar por item e contar quantas vezes foi vendido
    const itemCounts: Record<string, any> = {};
    
    salesHistory.forEach(sale => {
      const itemId = sale.inventory_id;
      if (!itemCounts[itemId]) {
        itemCounts[itemId] = {
          id: itemId,
          name: sale.product?.name || 'Produto Desconhecido',
          sku: sale.product?.sku || '',
          count: 0,
          totalRevenue: 0,
          category: sale.product?.inventory_categories?.name || 'Sem categoria',
          lastSold: sale.sale_date
        };
      }
      
      itemCounts[itemId].count += 1;
      itemCounts[itemId].totalRevenue += parseFloat(sale.price);
      
      // Atualizar última data de venda se for mais recente
      if (new Date(sale.sale_date) > new Date(itemCounts[itemId].lastSold)) {
        itemCounts[itemId].lastSold = sale.sale_date;
      }
    });
    
    // Transformar objeto em array e ordenar por contagem (mais vendidos primeiro)
    const sortedItems = Object.values(itemCounts).sort((a: any, b: any) => {
      return b.count - a.count;
    });
    
    // Categorizar as sugestões
    return {
      highDemand: sortedItems.filter((item: any) => item.count >= 3),
      mediumDemand: sortedItems.filter((item: any) => item.count === 2),
      lowDemand: sortedItems.filter((item: any) => item.count === 1)
    };
  }
}
