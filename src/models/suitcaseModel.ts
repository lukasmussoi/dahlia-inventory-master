
import { supabase } from "@/integrations/supabase/client";
import { SuitcaseItemStatus } from "@/types/suitcase";

// Interface para maleta com status atualizado
export interface Suitcase {
  id: string;
  seller_id: string;
  status: 'in_use' | 'returned' | 'lost' | 'in_audit' | 'in_replenishment';
  created_at?: string;
  updated_at?: string;
  sent_at?: string;
  city?: string;
  neighborhood?: string;
  code: string;
  next_settlement_date?: string; // Campo para data do próximo acerto
  seller?: {
    id: string;
    name: string;
    phone?: string;
    address?: {
      city?: string;
      neighborhood?: string;
      street?: string;
      number?: string;
      state?: string;
      zipCode?: string;
    };
  };
}

// Interface para resumo de contagem de maletas por status
export interface SuitcaseSummary {
  total: number;
  in_use: number;
  returned: number;
  in_replenishment: number;
}

// Interface para peças da maleta
export interface SuitcaseItem {
  id: string;
  suitcase_id: string;
  inventory_id: string;
  quantity: number;
  status: 'in_possession' | 'sold' | 'returned' | 'lost';
  created_at?: string;
  updated_at?: string;
  added_at: string;
  product?: {
    id: string;
    name: string;
    price: number;
    sku: string;
    photos?: { photo_url: string }[] | any; // Ajustado para aceitar qualquer tipo
    photo_url?: string;
  };
  sales?: SuitcaseItemSale[];
}

// Interface para vendas de peças da maleta
export interface SuitcaseItemSale {
  id: string;
  suitcase_item_id: string;
  customer_name?: string;
  payment_method?: string;
  sold_at?: string;
  created_at?: string;
  updated_at?: string;
}

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
    return data || [];
  }

  // Buscar resumo das maletas (contagem por status)
  static async getSuitcaseSummary(): Promise<SuitcaseSummary> {
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
    return data;
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
    return data as SuitcaseItem;
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
        
        // Retornar o objeto com a estrutura correta e tratando photos de forma segura
        return {
          ...item,
          added_at: item.created_at || new Date().toISOString(),
          product: item.product ? {
            ...item.product,
            photo_url: photoUrl,
            // Garantir uma estrutura de photos segura
            photos: Array.isArray(item.product.photos) ? item.product.photos : []
          } : undefined
        } as SuitcaseItem;
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
    status?: 'in_use' | 'returned' | 'lost' | 'in_audit' | 'in_replenishment';
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
        status: validStatus
      })
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error("Erro ao criar maleta: nenhum dado retornado");
    
    return data;
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
    
    return data;
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
    status?: 'in_possession' | 'sold' | 'returned' | 'lost';
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
    
    return data as SuitcaseItem;
  }

  // Atualizar status de uma peça da maleta
  static async updateSuitcaseItemStatus(
    itemId: string, 
    status: 'in_possession' | 'sold' | 'returned' | 'lost',
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
    
    return data as SuitcaseItem;
  }

  // Buscar vendas de uma peça da maleta
  static async getSuitcaseItemSales(itemId: string): Promise<SuitcaseItemSale[]> {
    if (!itemId) throw new Error("ID da peça é necessário");
    
    const { data, error } = await supabase
      .from('suitcase_item_sales')
      .select('*')
      .eq('suitcase_item_id', itemId);
    
    if (error) throw error;
    return data || [];
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
        query = query.eq('status', filters.status as 'in_use' | 'returned' | 'lost' | 'in_audit' | 'in_replenishment');
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
    return data || [];
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
