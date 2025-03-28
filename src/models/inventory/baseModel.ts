
/**
 * Modelo Base de Inventário
 * @file Funções básicas de acesso e manipulação do inventário
 * @relacionamento Utilizado pelo modelo principal de inventário
 */
import { supabase } from "@/integrations/supabase/client";
import { InventoryItem, InventoryFilters, MovementType } from "@/types/inventory";

export class BaseInventoryModel {
  /**
   * Obtém todos os itens do inventário, com opções de filtragem
   * @param filters Filtros opcionais para a consulta
   * @returns Lista de itens do inventário
   */
  static async getAllItems(filters: InventoryFilters = {}): Promise<InventoryItem[]> {
    try {
      let query = supabase
        .from('inventory')
        .select(`
          *,
          category:category_id(name),
          supplier:supplier_id(name),
          plating_type:plating_type_id(name),
          inventory_photos(photo_url, is_primary)
        `);

      // Aplicar filtros conforme enviados
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
      }
      
      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
      }
      
      if (filters.min_price !== undefined) {
        query = query.gte('price', filters.min_price);
      }
      
      if (filters.max_price !== undefined) {
        query = query.lte('price', filters.max_price);
      }
      
      if (filters.min_quantity !== undefined) {
        query = query.gte('quantity', filters.min_quantity);
      }
      
      if (filters.max_quantity !== undefined) {
        query = query.lte('quantity', filters.max_quantity);
      }
      
      if (filters.archived !== undefined) {
        query = query.eq('archived', filters.archived);
      } else {
        // Por padrão, não mostrar itens arquivados
        query = query.eq('archived', false);
      }

      // Executar consulta
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      // Processar resultados para formatar os dados
      return data.map(item => ({
        ...item,
        category_name: item.category?.name,
        supplier_name: item.supplier?.name,
        plating_type_name: item.plating_type?.name,
        // Garantir que quantity_reserved existe e calcular quantity_available
        quantity_reserved: item.quantity_reserved || 0,
        photos: item.inventory_photos || []
      }));
    } catch (error) {
      console.error("[BaseInventoryModel] Erro ao buscar itens do inventário:", error);
      throw error;
    }
  }

  /**
   * Obtém um item específico do inventário pelo ID
   * @param id ID do item
   * @returns Item do inventário
   */
  static async getItemById(id: string): Promise<InventoryItem | null> {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          category:category_id(name),
          supplier:supplier_id(name),
          plating_type:plating_type_id(name),
          inventory_photos(photo_url, is_primary)
        `)
        .eq('id', id)
        .maybeSingle();
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        return null;
      }
      
      return {
        ...data,
        category_name: data.category?.name,
        supplier_name: data.supplier?.name,
        plating_type_name: data.plating_type?.name,
        // Garantir que quantity_reserved existe
        quantity_reserved: data.quantity_reserved || 0,
        photos: data.inventory_photos || []
      };
    } catch (error) {
      console.error("[BaseInventoryModel] Erro ao buscar item por ID:", error);
      throw error;
    }
  }

  /**
   * Verifica se um item do inventário está em uma maleta
   * @param inventoryId ID do item no inventário
   * @returns Informações sobre a maleta onde o item está
   */
  static async checkItemInSuitcase(inventoryId: string) {
    try {
      // Buscar o item da maleta que contém o produto
      const { data: suitcaseItem, error } = await supabase
        .from('suitcase_items')
        .select(`
          suitcase_id,
          suitcases (
            code,
            status,
            seller:seller_id (name)
          )
        `)
        .eq('inventory_id', inventoryId)
        .eq('status', 'in_possession')
        .maybeSingle();
      
      if (error) {
        throw error;
      }
      
      if (!suitcaseItem) {
        return null;
      }
      
      return {
        suitcase_id: suitcaseItem.suitcase_id,
        suitcase_code: suitcaseItem.suitcases?.code,
        status: suitcaseItem.suitcases?.status,
        seller_name: suitcaseItem.suitcases?.seller?.name
      };
    } catch (error) {
      console.error("[BaseInventoryModel] Erro ao verificar item em maleta:", error);
      throw error;
    }
  }

  /**
   * Registra um movimento de inventário
   * @param params Dados do movimento
   * @returns Resultado da operação
   */
  static async createMovement({
    inventory_id,
    quantity,
    movement_type,
    reason,
    unit_cost,
    notes
  }: {
    inventory_id: string;
    quantity: number;
    movement_type: MovementType;
    reason: string;
    unit_cost?: number;
    notes?: string;
  }) {
    try {
      // Se não foi passado o custo unitário, buscar do item
      if (unit_cost === undefined) {
        const item = await this.getItemById(inventory_id);
        unit_cost = item?.unit_cost || 0;
      }
      
      const { data, error } = await supabase
        .from('inventory_movements')
        .insert({
          inventory_id,
          quantity,
          movement_type,
          reason,
          unit_cost,
          notes,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      return data[0];
    } catch (error) {
      console.error("[BaseInventoryModel] Erro ao criar movimento:", error);
      throw error;
    }
  }

  /**
   * Reserva uma quantidade de um item para uma maleta
   * @param inventoryId ID do item no inventário
   * @param quantity Quantidade a ser reservada
   * @returns Sucesso da operação
   */
  static async reserveForSuitcase(inventoryId: string, quantity: number): Promise<boolean> {
    try {
      // Usar a função RPC criada no banco de dados
      const { data, error } = await supabase
        .rpc('reserve_inventory_for_suitcase', {
          inventory_id: inventoryId,
          reserve_quantity: quantity
        });
      
      if (error) {
        throw error;
      }
      
      return data === true;
    } catch (error) {
      console.error("[BaseInventoryModel] Erro ao reservar item para maleta:", error);
      throw error;
    }
  }

  /**
   * Libera uma reserva de um item para uma maleta
   * @param inventoryId ID do item no inventário
   * @param quantity Quantidade a ser liberada
   * @returns Sucesso da operação
   */
  static async releaseReservation(inventoryId: string, quantity: number): Promise<boolean> {
    try {
      // Usar a função RPC criada no banco de dados
      const { data, error } = await supabase
        .rpc('release_reserved_inventory', {
          inventory_id: inventoryId,
          release_quantity: quantity
        });
      
      if (error) {
        throw error;
      }
      
      return data === true;
    } catch (error) {
      console.error("[BaseInventoryModel] Erro ao liberar reserva de item:", error);
      throw error;
    }
  }

  /**
   * Finaliza a venda de um item reservado, removendo-o definitivamente do estoque
   * @param inventoryId ID do item no inventário
   * @param quantity Quantidade vendida
   * @returns Sucesso da operação
   */
  static async finalizeSale(inventoryId: string, quantity: number): Promise<boolean> {
    try {
      // Usar a função RPC criada no banco de dados
      const { data, error } = await supabase
        .rpc('finalize_inventory_sale', {
          inventory_id: inventoryId,
          sale_quantity: quantity
        });
      
      if (error) {
        throw error;
      }
      
      return data === true;
    } catch (error) {
      console.error("[BaseInventoryModel] Erro ao finalizar venda de item:", error);
      throw error;
    }
  }
}
