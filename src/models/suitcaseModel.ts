
import { supabase } from "@/integrations/supabase/client";
import { SuitcaseStatus, SuitcaseItemStatus, Suitcase, SuitcaseItem, SuitcaseItemSale } from "@/types/suitcase";

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
      // Processar o endereço do vendedor que vem como JSON para um objeto estruturado
      let sellerAddress = item.seller?.address ? item.seller.address : {};
      if (typeof sellerAddress === 'string') {
        try {
          sellerAddress = JSON.parse(sellerAddress);
        } catch (e) {
          sellerAddress = {};
        }
      }
      
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
          address: {
            city: sellerAddress.city,
            neighborhood: sellerAddress.neighborhood,
            street: sellerAddress.street,
            number: sellerAddress.number,
            state: sellerAddress.state,
            zipCode: sellerAddress.zipCode
          }
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
    
    // Processar o endereço do vendedor que vem como JSON para um objeto estruturado
    let sellerAddress = data.seller?.address ? data.seller.address : {};
    if (typeof sellerAddress === 'string') {
      try {
        sellerAddress = JSON.parse(sellerAddress);
      } catch (e) {
        sellerAddress = {};
      }
    }
    
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
        address: {
          city: sellerAddress.city,
          neighborhood: sellerAddress.neighborhood,
          street: sellerAddress.street,
          number: sellerAddress.number,
          state: sellerAddress.state,
          zipCode: sellerAddress.zipCode
        }
      } : undefined
    };
  }

  // Buscar uma peça da maleta pelo ID
  static async getSuitcaseItemById(itemId: string): Promise<SuitcaseItem | null> {
    if (!itemId) throw new Error("ID da peça é necessário");
    
    const { data, error } = await supabase
      .from('suitcase_items')
      .select(`
        *,
        product:inventory_id (
          id,
          name,
          price,
          sku,
          photos:inventory_photos(photo_url)
        )
      `)
      .eq('id', itemId)
      .maybeSingle();
    
    if (error) throw error;
    if (!data) return null;
    
    return {
      id: data.id,
      suitcase_id: data.suitcase_id,
      inventory_id: data.inventory_id,
      status: data.status as SuitcaseItemStatus,
      added_at: data.created_at || new Date().toISOString(),
      created_at: data.created_at,
      updated_at: data.updated_at,
      quantity: data.quantity,
      product: data.product ? {
        id: data.product.id,
        name: data.product.name,
        price: data.product.price,
        sku: data.product.sku,
        photo_url: data.product.photos && data.product.photos.length > 0 ? 
          data.product.photos[0].photo_url : undefined
      } : undefined,
      sales: []
    };
  }

  // Buscar peças de uma maleta
  static async getSuitcaseItems(suitcaseId: string): Promise<SuitcaseItem[]> {
    try {
      if (!suitcaseId) throw new Error("ID da maleta é necessário");
      
      const { data, error } = await supabase
        .from('suitcase_items')
        .select(`
          *,
          product:inventory_id (
            id,
            name,
            price,
            sku,
            photos:inventory_photos(photo_url)
          )
        `)
        .eq('suitcase_id', suitcaseId);
      
      if (error) throw error;
      
      // Processar os dados para obter a primeira foto de cada produto
      const processedData: SuitcaseItem[] = (data || []).map(item => {
        let photoUrl = undefined;
        
        // Verificar se photos existe e tem pelo menos um elemento
        if (item.product && 
            item.product.photos && 
            Array.isArray(item.product.photos) && 
            item.product.photos.length > 0) {
          // Se a propriedade photo_url existir diretamente
          if (item.product.photos[0] && typeof item.product.photos[0] === 'object' && 'photo_url' in item.product.photos[0]) {
            photoUrl = item.product.photos[0].photo_url;
          }
        }
        
        // Buscar vendas relacionadas a este item
        const sales: SuitcaseItemSale[] = []; // Isso seria preenchido com uma consulta adicional
        
        // Retornar o objeto com a estrutura correta
        return {
          id: item.id,
          suitcase_id: item.suitcase_id,
          inventory_id: item.inventory_id,
          status: item.status as SuitcaseItemStatus,
          added_at: item.created_at || new Date().toISOString(),
          created_at: item.created_at,
          updated_at: item.updated_at,
          quantity: item.quantity,
          product: item.product ? {
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            sku: item.product.sku,
            photo_url: photoUrl
          } : undefined,
          sales: sales
        };
      });
      
      return processedData;
    } catch (error) {
      console.error("Erro ao buscar peças da maleta:", error);
      throw error;
    }
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
    const validStatus = suitcaseData.status || 'in_use';
    
    const { data, error } = await supabase
      .from('suitcases')
      .insert({
        ...suitcaseData,
        status: validStatus as SuitcaseStatus
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
    
    const { data, error } = await supabase
      .from('suitcases')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) throw error;
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

  // Adicionar peça à maleta
  static async addItemToSuitcase(itemData: {
    suitcase_id: string;
    inventory_id: string;
    quantity?: number;
    status?: SuitcaseItemStatus;
  }): Promise<SuitcaseItem> {
    if (!itemData.suitcase_id) throw new Error("ID da maleta é necessário");
    if (!itemData.inventory_id) throw new Error("ID do inventário é necessário");
    
    const { data, error } = await supabase
      .from('suitcase_items')
      .insert(itemData)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error("Erro ao adicionar peça à maleta: nenhum dado retornado");
    
    return {
      id: data.id,
      suitcase_id: data.suitcase_id,
      inventory_id: data.inventory_id,
      status: data.status as SuitcaseItemStatus,
      added_at: data.created_at || new Date().toISOString(),
      created_at: data.created_at,
      updated_at: data.updated_at,
      quantity: data.quantity,
      sales: []
    };
  }

  // Atualizar status de uma peça da maleta
  static async updateSuitcaseItemStatus(
    itemId: string, 
    status: SuitcaseItemStatus,
    saleInfo?: Partial<SuitcaseItemSale>
  ): Promise<SuitcaseItem> {
    if (!itemId) throw new Error("ID da peça é necessário");
    
    // Primeiro atualizar o status da peça
    const { data, error } = await supabase
      .from('suitcase_items')
      .update({ status })
      .eq('id', itemId)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error("Erro ao atualizar status da peça: nenhum dado retornado");
    
    // Se for venda e tiver informações adicionais, registrar a venda
    if (status === 'sold' && saleInfo) {
      const { error: saleError } = await supabase
        .from('suitcase_item_sales')
        .insert({
          ...saleInfo,
          suitcase_item_id: itemId
        });
      
      if (saleError) throw saleError;
    }
    
    return {
      id: data.id,
      suitcase_id: data.suitcase_id,
      inventory_id: data.inventory_id,
      status: data.status as SuitcaseItemStatus,
      added_at: data.created_at || new Date().toISOString(),
      created_at: data.created_at,
      updated_at: data.updated_at,
      quantity: data.quantity,
      sales: []
    };
  }

  // Buscar vendas de uma peça da maleta
  static async getSuitcaseItemSales(itemId: string): Promise<SuitcaseItemSale[]> {
    if (!itemId) throw new Error("ID da peça é necessário");
    
    const { data, error } = await supabase
      .from('suitcase_item_sales')
      .select('*')
      .eq('suitcase_item_id', itemId);
    
    if (error) throw error;
    
    return (data || []).map(sale => ({
      id: sale.id,
      suitcase_item_id: sale.suitcase_item_id,
      client_name: sale.customer_name,
      payment_method: sale.payment_method,
      sale_date: sale.sold_at || sale.created_at, // Use sold_at ou created_at como sale_date
      customer_name: sale.customer_name,
      sold_at: sale.sold_at,
      created_at: sale.created_at,
      updated_at: sale.updated_at
    }));
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
      if (['in_use', 'returned', 'lost', 'in_audit', 'in_replenishment'].includes(filters.status)) {
        query = query.eq('status', filters.status);
      }
    }
    
    if (filters.city) {
      query = query.ilike('city', `%${filters.city}%`);
    }
    
    if (filters.neighborhood) {
      query = query.ilike('neighborhood', `%${filters.neighborhood}%`);
    }
    
    if (filters.search) {
      // Buscar por código da maleta ou nome da revendedora
      query = query.or(`code.ilike.%${filters.search}%`);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Converter os resultados para se adequar à interface Suitcase
    return (data || []).map(item => {
      // Processar o endereço do vendedor que vem como JSON para um objeto estruturado
      let sellerAddress = item.seller?.address ? item.seller.address : {};
      if (typeof sellerAddress === 'string') {
        try {
          sellerAddress = JSON.parse(sellerAddress);
        } catch (e) {
          sellerAddress = {};
        }
      }
      
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
          address: {
            city: sellerAddress.city,
            neighborhood: sellerAddress.neighborhood,
            street: sellerAddress.street,
            number: sellerAddress.number,
            state: sellerAddress.state,
            zipCode: sellerAddress.zipCode
          }
        } : undefined
      };
    });
  }

  // Gerar código único para maleta
  static async generateSuitcaseCode(): Promise<string> {
    const { count, error } = await supabase
      .from('suitcases')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    
    // Formato: ML001, ML002, etc.
    const nextNumber = (count || 0) + 1;
    return `ML${nextNumber.toString().padStart(3, '0')}`;
  }

  // Adicionar métodos que estavam faltando
  static async removeSuitcaseItem(itemId: string): Promise<void> {
    if (!itemId) throw new Error("ID do item é necessário");
    
    const { error } = await supabase
      .from('suitcase_items')
      .delete()
      .eq('id', itemId);
    
    if (error) throw error;
  }

  static async getAllSellers(): Promise<any[]> {
    const { data, error } = await supabase
      .from('resellers')
      .select('*');
    
    if (error) throw error;
    return data || [];
  }

  static async getSellerById(sellerId: string): Promise<any> {
    if (!sellerId) throw new Error("ID do vendedor é necessário");
    
    const { data, error } = await supabase
      .from('resellers')
      .select('*')
      .eq('id', sellerId)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  static async searchInventoryItems(query: string): Promise<any[]> {
    let searchQuery = supabase
      .from('inventory')
      .select(`
        *,
        photos:inventory_photos(*)
      `);
    
    // Verificar se é um UUID ou um termo de busca
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (uuidRegex.test(query)) {
      searchQuery = searchQuery.eq('id', query);
    } else {
      searchQuery = searchQuery.or(`name.ilike.%${query}%,sku.ilike.%${query}%,barcode.ilike.%${query}%`);
    }
    
    const { data, error } = await searchQuery.limit(10);
    
    if (error) throw error;
    
    // Processar para obter a primeira foto de cada item
    return (data || []).map(item => {
      const photos = item.photos || [];
      const primaryPhoto = photos.find((p: any) => p.is_primary) || photos[0];
      
      return {
        ...item,
        photo_url: primaryPhoto ? primaryPhoto.photo_url : null
      };
    });
  }
}
