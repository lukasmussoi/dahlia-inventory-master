
/**
 * Modelo Base para Inventário
 * @file Este arquivo contém operações comuns e utilitárias para o inventário
 */
import { supabase } from "@/integrations/supabase/client";
import { InventoryFilters, InventoryItem, InventoryPhoto } from "./types";

export class BaseInventoryModel {
  // Buscar todos os itens do inventário
  static async getAllItems(filters?: InventoryFilters): Promise<InventoryItem[]> {
    console.log("getAllItems chamado com filtros:", filters);
    
    let query = supabase
      .from('inventory')
      .select(`
        *,
        category_name:inventory_categories(name),
        supplier_name:suppliers(name),
        plating_type_name:plating_types(name),
        inventory_photos:inventory_photos(id, photo_url, is_primary)
      `);
    
    // Aplicar filtro de arquivados
    if (filters?.status === 'archived' || filters?.showArchived === true) {
      console.log("Filtrando apenas itens arquivados");
      query = query.eq('archived', true);
    } else {
      // Por padrão, não mostrar itens arquivados
      console.log("Filtrando para excluir itens arquivados");
      query = query.eq('archived', false);
    }
    
    // Aplicar filtros se fornecidos
    if (filters) {
      if (filters.search) {
        console.log("Aplicando filtro de busca:", filters.search);
        query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,barcode.ilike.%${filters.search}%`);
      }
      
      if (filters.category_id && filters.category_id !== 'all') {
        console.log("Aplicando filtro de categoria:", filters.category_id);
        query = query.eq('category_id', filters.category_id);
      }
      
      if (filters.min_price) {
        console.log("Aplicando filtro de preço mínimo:", filters.min_price);
        query = query.gte('price', filters.min_price);
      }
      
      if (filters.max_price) {
        console.log("Aplicando filtro de preço máximo:", filters.max_price);
        query = query.lte('price', filters.max_price);
      }
      
      if (filters.status === 'in_stock') {
        console.log("Aplicando filtro de itens em estoque");
        query = query.gt('quantity', 0);
      } else if (filters.status === 'out_of_stock') {
        console.log("Aplicando filtro de itens sem estoque");
        query = query.eq('quantity', 0);
      } else if (filters.status === 'low_stock') {
        console.log("Aplicando filtro de itens com estoque baixo");
        query = query.lt('quantity', 5).gt('quantity', 0);
      }

      if (filters.minQuantity !== undefined) {
        console.log("Aplicando filtro de quantidade mínima:", filters.minQuantity);
        query = query.gte('quantity', filters.minQuantity);
      }
      
      if (filters.maxQuantity !== undefined) {
        console.log("Aplicando filtro de quantidade máxima:", filters.maxQuantity);
        query = query.lte('quantity', filters.maxQuantity);
      }
    }

    console.log("Executando consulta ao banco de dados");
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error("Erro ao buscar itens:", error);
      throw error;
    }
    
    console.log(`Retornados ${data?.length || 0} itens do inventário`);
    
    const items = data?.map(item => {
      const photosData = item.inventory_photos || [];
      const processedPhotos: InventoryPhoto[] = photosData.map((photo: any) => ({
        id: photo.id,
        inventory_id: item.id,
        photo_url: photo.photo_url,
        is_primary: photo.is_primary || false
      }));
      
      const processedItem: InventoryItem = {
        ...item,
        photos: processedPhotos,
        inventory_photos: processedPhotos,
        category_name: item.category_name?.name || '',
        supplier_name: item.supplier_name?.name || '',
        plating_type_name: item.plating_type_name?.name || ''
      };
      
      return processedItem;
    }) || [];
    
    return items;
  }

  // Buscar um item pelo ID
  static async getItemById(id: string): Promise<InventoryItem | null> {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        *,
        category_name:inventory_categories(name),
        supplier_name:suppliers(name),
        inventory_photos:inventory_photos(id, photo_url, is_primary)
      `)
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    
    if (!data) return null;
    
    const photosData = data.inventory_photos || [];
    const processedPhotos: InventoryPhoto[] = photosData.map((photo: any) => ({
      id: photo.id,
      inventory_id: data.id,
      photo_url: photo.photo_url,
      is_primary: photo.is_primary || false
    }));
    
    const processedItem: InventoryItem = {
      ...data,
      photos: processedPhotos,
      inventory_photos: processedPhotos,
      category_name: data.category_name?.name || '',
      supplier_name: data.supplier_name?.name || ''
    };
    
    return processedItem;
  }

  // Atualizar fotos de um item - modificado para aceitar Files
  static async updateItemPhotos(itemId: string, photos: File[] | { id?: string; photo_url: string; is_primary?: boolean }[]): Promise<InventoryPhoto[]> {
    if (!photos || photos.length === 0) return [];

    const processedPhotos: { inventory_id: string; photo_url: string; is_primary: boolean }[] = [];

    for (const photo of photos) {
      if ('photo_url' in photo) {
        processedPhotos.push({
          inventory_id: itemId,
          photo_url: photo.photo_url,
          is_primary: photo.is_primary || false
        });
      } else if (photo instanceof File) {
        processedPhotos.push({
          inventory_id: itemId,
          photo_url: URL.createObjectURL(photo),
          is_primary: false
        });
      }
    }
    
    const { error: deleteError } = await supabase
      .from('inventory_photos')
      .delete()
      .eq('inventory_id', itemId);
    
    if (deleteError) throw deleteError;
    
    if (processedPhotos.length === 0) return [];
    
    const { data, error } = await supabase
      .from('inventory_photos')
      .insert(processedPhotos)
      .select();
    
    if (error) throw error;
    
    return data || [];
  }

  // Buscar fotos de um item
  static async getItemPhotos(itemId: string): Promise<InventoryPhoto[]> {
    const { data, error } = await supabase
      .from('inventory_photos')
      .select('*')
      .eq('inventory_id', itemId);
    
    if (error) throw error;
    
    return data || [];
  }

  // Verificar se um item está em uso em alguma maleta
  static async checkItemInSuitcase(itemId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('suitcase_items')
        .select(`
          id,
          suitcase_id,
          suitcases:suitcase_id (
            id,
            code,
            status,
            seller_id,
            resellers:seller_id (
              name
            )
          )
        `)
        .eq('inventory_id', itemId)
        .eq('status', 'in_possession')
        .maybeSingle();
      
      if (error) throw error;
      
      if (!data) return null;
      
      return {
        id: data.id,
        suitcase_id: data.suitcase_id,
        status: data.suitcases?.status,
        suitcase_code: data.suitcases?.code,
        seller_id: data.suitcases?.seller_id,
        seller_name: data.suitcases?.resellers?.name
      };
    } catch (error) {
      console.error("Erro ao verificar se item está em maleta:", error);
      throw error;
    }
  }

  // Verificar se um item possui movimentações registradas
  static async checkItemHasMovements(id: string): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from('inventory_movements')
        .select('*', { count: 'exact', head: true })
        .eq('inventory_id', id);
      
      if (error) throw error;
      
      return (count || 0) > 0;
    } catch (error) {
      console.error("Erro ao verificar movimentações do item:", error);
      throw error;
    }
  }
}
