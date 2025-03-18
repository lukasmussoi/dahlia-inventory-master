import { supabase } from "@/integrations/supabase/client";
import { Acerto, AcertoItem, AcertoStatus, SuitcaseItem } from "@/types/suitcase";

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
    
    return (data || []).map(item => ({
      id: item.id,
      suitcase_id: item.suitcase_id,
      seller_id: item.seller_id,
      settlement_date: item.settlement_date,
      next_settlement_date: item.next_settlement_date,
      total_sales: item.total_sales,
      commission_amount: item.commission_amount,
      receipt_url: item.receipt_url,
      status: item.status as AcertoStatus,
      restock_suggestions: item.restock_suggestions,
      created_at: item.created_at,
      updated_at: item.updated_at,
      suitcase: item.suitcase ? {
        id: item.suitcase.id,
        code: item.suitcase.code,
        status: item.suitcase.status,
        seller_id: '', // Preenchido para satisfazer o tipo
        created_at: '' // Preenchido para satisfazer o tipo
      } : undefined,
      seller: item.seller ? {
        id: item.seller.id,
        name: item.seller.name,
        commission_rate: item.seller.commission_rate
      } : undefined
    }));
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
    if (!data) return null;
    
    return {
      id: data.id,
      suitcase_id: data.suitcase_id,
      seller_id: data.seller_id,
      settlement_date: data.settlement_date,
      next_settlement_date: data.next_settlement_date,
      total_sales: data.total_sales,
      commission_amount: data.commission_amount,
      receipt_url: data.receipt_url,
      status: data.status as AcertoStatus,
      restock_suggestions: data.restock_suggestions,
      created_at: data.created_at,
      updated_at: data.updated_at,
      suitcase: data.suitcase ? {
        id: data.suitcase.id,
        code: data.suitcase.code,
        status: data.suitcase.status,
        seller_id: '', // Preenchido para satisfazer o tipo
        created_at: '', // Preenchido para satisfazer o tipo
        seller: data.suitcase.seller
      } : undefined,
      seller: data.seller ? {
        id: data.seller.id,
        name: data.seller.name,
        commission_rate: data.seller.commission_rate
      } : undefined
    };
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
      } as AcertoItem;
    });
  }

  // Criar um novo acerto
  static async createAcerto(acertoData: {
    suitcase_id: string;
    seller_id: string;
    settlement_date: string;
    next_settlement_date?: string;
    total_sales: number;
    commission_amount: number;
    status: AcertoStatus;
    restock_suggestions?: any;
  }): Promise<Acerto> {
    const { data, error } = await supabase
      .from('acertos_maleta')
      .insert(acertoData)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error("Erro ao criar acerto: nenhum dado retornado");
    
    return {
      id: data.id,
      suitcase_id: data.suitcase_id,
      seller_id: data.seller_id,
      settlement_date: data.settlement_date,
      next_settlement_date: data.next_settlement_date,
      total_sales: data.total_sales,
      commission_amount: data.commission_amount,
      receipt_url: data.receipt_url,
      status: data.status as AcertoStatus,
      restock_suggestions: data.restock_suggestions,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  // Adicionar itens vendidos ao acerto
  static async addAcertoItems(items: {
    acerto_id: string;
    suitcase_item_id: string;
    inventory_id: string;
    price: number;
    sale_date: string;
    customer_name?: string;
    payment_method?: string;
  }[]): Promise<AcertoItem[]> {
    if (!items.length) return [];
    
    const { data, error } = await supabase
      .from('acerto_itens_vendidos')
      .insert(items)
      .select();
    
    if (error) throw error;
    return data as AcertoItem[] || [];
  }

  // Atualizar um acerto
  static async updateAcerto(id: string, acertoData: {
    settlement_date?: string;
    next_settlement_date?: string;
    total_sales?: number;
    commission_amount?: number;
    receipt_url?: string;
    status?: AcertoStatus;
    restock_suggestions?: any;
  }): Promise<Acerto> {
    const { data, error } = await supabase
      .from('acertos_maleta')
      .update(acertoData)
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error("Erro ao atualizar acerto: nenhum dado retornado");
    
    return {
      id: data.id,
      suitcase_id: data.suitcase_id,
      seller_id: data.seller_id,
      settlement_date: data.settlement_date,
      next_settlement_date: data.next_settlement_date,
      total_sales: data.total_sales,
      commission_amount: data.commission_amount,
      receipt_url: data.receipt_url,
      status: data.status as AcertoStatus,
      restock_suggestions: data.restock_suggestions,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  // Calcular a comissão com base na taxa da revendedora
  static async calcularComissao(sellerId: string, totalVendas: number): Promise<number> {
    // Buscar a taxa de comissão da revendedora
    const { data, error } = await supabase
      .from('resellers')
      .select('commission_rate')
      .eq('id', sellerId)
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
