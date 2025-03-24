
/**
 * Modelo de Itens de Maleta
 * @file Funções relacionadas aos itens da maleta
 */
import { supabase } from "@/integrations/supabase/client";
import { SuitcaseItemStatus, SuitcaseItem, SuitcaseItemSale, InventoryItemSuitcaseInfo } from "@/types/suitcase";

export class SuitcaseItemModel {
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
    
    // Extrair URL da foto, garantindo que é uma string válida
    let photoUrl;
    if (data.product?.photos && 
        Array.isArray(data.product.photos) && 
        data.product.photos.length > 0) {
      // Verificar se o item da array é um objeto com photo_url
      if (data.product.photos[0] && typeof data.product.photos[0] === 'object') {
        photoUrl = data.product.photos[0].photo_url;
      }
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
      product: data.product ? {
        id: data.product.id,
        name: data.product.name,
        price: data.product.price,
        sku: data.product.sku,
        photo_url: photoUrl
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
        
        // Garantir que added_at existe
        const added_at = item.created_at || new Date().toISOString();
        
        // Retornar o objeto com a estrutura correta
        return {
          id: item.id,
          suitcase_id: item.suitcase_id,
          inventory_id: item.inventory_id,
          status: item.status as SuitcaseItemStatus,
          added_at: added_at,
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
          sales: []
        };
      });
      
      return processedData;
    } catch (error) {
      console.error("Erro ao buscar peças da maleta:", error);
      throw error;
    }
  }

  // Verificar se um item está disponível para adição à maleta
  static async checkItemAvailability(inventory_id: string): Promise<{
    available: boolean;
    quantity: number;
    item_info?: {
      name: string;
      sku: string;
    };
    in_suitcase?: InventoryItemSuitcaseInfo;
  }> {
    // Buscar a quantidade disponível em estoque
    const { data: inventoryData, error: inventoryError } = await supabase
      .from('inventory')
      .select('quantity, name, sku')
      .eq('id', inventory_id)
      .maybeSingle();
    
    if (inventoryError) throw inventoryError;
    if (!inventoryData) return { available: false, quantity: 0 };
    
    // Se não há estoque disponível, retornar indisponível
    if (inventoryData.quantity <= 0) {
      return { 
        available: false, 
        quantity: 0,
        item_info: { 
          name: inventoryData.name,
          sku: inventoryData.sku
        }
      };
    }
    
    // Para peças com apenas uma unidade em estoque, verificar se já está em alguma maleta
    if (inventoryData.quantity === 1) {
      const { data: suitcaseItems, error: suitcaseError } = await supabase
        .from('suitcase_items')
        .select(`
          id,
          suitcase_id,
          suitcases:suitcase_id (
            id,
            code,
            resellers:seller_id (
              name
            )
          )
        `)
        .eq('inventory_id', inventory_id)
        .eq('status', 'in_possession');
      
      if (suitcaseError) throw suitcaseError;
      
      // Se já está em uma maleta, retornar indisponível junto com a informação da maleta
      if (suitcaseItems && suitcaseItems.length > 0) {
        const suitcaseItem = suitcaseItems[0];
        
        return {
          available: false,
          quantity: 1,
          item_info: {
            name: inventoryData.name,
            sku: inventoryData.sku
          },
          in_suitcase: {
            suitcase_id: suitcaseItem.suitcase_id,
            suitcase_code: suitcaseItem.suitcases?.code || '',
            seller_name: suitcaseItem.suitcases?.resellers?.name || ''
          }
        };
      }
    }
    
    // Se não está em nenhuma maleta ou tem mais de uma unidade, está disponível
    return {
      available: true,
      quantity: inventoryData.quantity,
      item_info: { 
        name: inventoryData.name,
        sku: inventoryData.sku
      }
    };
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
    
    // Garantir que quantidade seja v��lida
    const quantity = itemData.quantity && itemData.quantity > 0 ? itemData.quantity : 1;
    
    // Verificar disponibilidade do item
    const availability = await this.checkItemAvailability(itemData.inventory_id);
    
    if (!availability.available) {
      if (availability.in_suitcase) {
        throw new Error(`Item "${availability.item_info?.name}" já está na maleta ${availability.in_suitcase.suitcase_code} (${availability.in_suitcase.seller_name})`);
      } else {
        throw new Error(`Item "${availability.item_info?.name}" não está disponível no estoque`);
      }
    }
    
    // Verificar se a quantidade solicitada está disponível
    if (availability.quantity < quantity) {
      throw new Error(`Quantidade solicitada (${quantity}) excede o estoque disponível (${availability.quantity})`);
    }
    
    // Iniciar transação para garantir consistência
    try {
      // 1. Adicionar item à maleta
      const { data, error } = await supabase
        .from('suitcase_items')
        .insert({
          ...itemData,
          quantity: quantity
        })
        .select()
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error("Erro ao adicionar peça à maleta: nenhum dado retornado");
      
      // 2. Reduzir o estoque
      const { error: inventoryError } = await supabase
        .from('inventory')
        .update({ 
          quantity: availability.quantity - quantity 
        })
        .eq('id', itemData.inventory_id);
      
      if (inventoryError) {
        // Tentar reverter a inserção do item na maleta
        await supabase
          .from('suitcase_items')
          .delete()
          .eq('id', data.id);
          
        throw inventoryError;
      }
      
      const added_at = data.created_at || new Date().toISOString();
      
      return {
        id: data.id,
        suitcase_id: data.suitcase_id,
        inventory_id: data.inventory_id,
        status: data.status as SuitcaseItemStatus,
        added_at: added_at,
        created_at: data.created_at,
        updated_at: data.updated_at,
        quantity: data.quantity,
        sales: []
      };
    } catch (error) {
      console.error("Erro na transação de adicionar item à maleta:", error);
      throw error;
    }
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
    
    const added_at = data.created_at || new Date().toISOString();
    
    return {
      id: data.id,
      suitcase_id: data.suitcase_id,
      inventory_id: data.inventory_id,
      status: data.status as SuitcaseItemStatus,
      added_at: added_at,
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
    
    return (data || []).map(sale => {
      // Garantir que sale_date existe
      const sale_date = sale.sold_at || sale.created_at || new Date().toISOString();
      
      return {
        id: sale.id,
        suitcase_item_id: sale.suitcase_item_id,
        client_name: sale.customer_name,
        payment_method: sale.payment_method,
        sale_date: sale_date, 
        customer_name: sale.customer_name,
        sold_at: sale.sold_at,
        created_at: sale.created_at,
        updated_at: sale.updated_at
      };
    });
  }

  // Remover peça da maleta
  static async removeSuitcaseItem(itemId: string): Promise<void> {
    if (!itemId) throw new Error("ID do item é necessário");
    
    const { error } = await supabase
      .from('suitcase_items')
      .delete()
      .eq('id', itemId);
    
    if (error) throw error;
  }

  // Atualizar quantidade de um item da maleta
  static async updateSuitcaseItemQuantity(itemId: string, quantity: number): Promise<SuitcaseItem> {
    if (!itemId) throw new Error("ID da peça é necessário");
    if (quantity < 1) throw new Error("A quantidade deve ser maior que zero");
    
    // Primeiro, verificar se o item existe e seu status atual
    const item = await this.getSuitcaseItemById(itemId);
    if (!item) throw new Error("Item não encontrado");
    
    // Verificar se o item está em posse (só podemos alterar qtd se estiver em posse)
    if (item.status !== 'in_possession') {
      throw new Error(`Não é possível alterar a quantidade de um item ${item.status === 'sold' ? 'vendido' : item.status === 'returned' ? 'devolvido' : 'perdido'}`);
    }
    
    // Atualizar a quantidade
    const { data, error } = await supabase
      .from('suitcase_items')
      .update({ quantity })
      .eq('id', itemId)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error("Erro ao atualizar quantidade do item: nenhum dado retornado");
    
    const added_at = data.created_at || new Date().toISOString();
    
    return {
      id: data.id,
      suitcase_id: data.suitcase_id,
      inventory_id: data.inventory_id,
      status: data.status as SuitcaseItemStatus,
      added_at: added_at,
      created_at: data.created_at,
      updated_at: data.updated_at,
      quantity: data.quantity,
      sales: []
    };
  }

  // Retornar um item para o estoque
  static async returnItemToInventory(itemId: string): Promise<void> {
    if (!itemId) throw new Error("ID do item é necessário");
    
    try {
      // Buscar informações do item
      const item = await this.getSuitcaseItemById(itemId);
      if (!item) throw new Error("Item não encontrado");
      
      // Só processar se o item estiver em posse
      if (item.status !== 'in_possession') {
        console.log(`Item ${itemId} não está em posse (status: ${item.status}), pulando retorno ao estoque`);
        return;
      }
      
      // Atualizar o status para devolvido
      const { error: updateError } = await supabase
        .from('suitcase_items')
        .update({ status: 'returned' })
        .eq('id', itemId);
      
      if (updateError) throw updateError;
      
      // Incrementar a quantidade no estoque - sem usar a função RPC
      const quantidade = item.quantity || 1;
      
      // Buscar quantidade atual no estoque
      const { data: inventoryData, error: getError } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('id', item.inventory_id)
        .maybeSingle();
      
      if (getError) throw getError;
      
      if (inventoryData) {
        const newQuantity = (inventoryData.quantity || 0) + quantidade;
        
        // Atualizar quantidade
        const { error: updateInventoryError } = await supabase
          .from('inventory')
          .update({ quantity: newQuantity })
          .eq('id', item.inventory_id);
        
        if (updateInventoryError) throw updateInventoryError;
      }
      
      console.log(`Item ${itemId} devolvido ao estoque com sucesso`);
    } catch (error) {
      console.error("Erro ao retornar item ao estoque:", error);
      throw error;
    }
  }

  // Obter informações de em qual maleta o item está
  static async getItemSuitcaseInfo(inventoryId: string): Promise<InventoryItemSuitcaseInfo | null> {
    if (!inventoryId) throw new Error("ID do item é necessário");
    
    const { data, error } = await supabase
      .from('suitcase_items')
      .select(`
        suitcase_id,
        suitcases:suitcase_id (
          id,
          code,
          resellers:seller_id (
            name
          )
        )
      `)
      .eq('inventory_id', inventoryId)
      .eq('status', 'in_possession')
      .maybeSingle();
    
    if (error) throw error;
    
    if (!data) return null;
    
    return {
      suitcase_id: data.suitcase_id,
      suitcase_code: data.suitcases?.code || '',
      seller_name: data.suitcases?.resellers?.name || ''
    };
  }
}
