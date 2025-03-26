
/**
 * Modelo Base de Inventário
 * @file Este arquivo contém funções básicas para gerenciamento do inventário
 */
import { supabase } from "@/integrations/supabase/client";
import { InventoryItem, InventoryFilters, InventoryPhoto } from "./types";

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

  // Atualizar fotos de um item - usando o bucket 'inventory_photos'
  static async updateItemPhotos(
    itemId: string, 
    photos: Array<File | { 
      file: File; 
      is_primary?: boolean 
    } | { 
      id?: string; 
      photo_url: string; 
      is_primary?: boolean 
    }>
  ): Promise<InventoryPhoto[]> {
    if (!photos || photos.length === 0) return [];

    try {
      // Logs detalhados para entender o início do processamento
      console.log("=== INÍCIO: updateItemPhotos ===");
      console.log(`Iniciando atualização de fotos para item ID: ${itemId}`);
      console.log(`Quantidade de fotos recebidas: ${photos.length}`);

      // Diagnóstico detalhado das fotos recebidas
      photos.forEach((photo, index) => {
        if (photo instanceof File) {
          console.log(`Foto ${index + 1}: Objeto File`, {
            name: photo.name, 
            type: photo.type,
            size: photo.size,
            lastModified: photo.lastModified
          });
        } else if ('file' in photo && photo.file instanceof File) {
          console.log(`Foto ${index + 1}: Objeto com File e is_primary`, {
            name: photo.file.name,
            type: photo.file.type,
            size: photo.file.size,
            lastModified: photo.file.lastModified,
            is_primary: photo.is_primary
          });
        } else if ('photo_url' in photo) {
          console.log(`Foto ${index + 1}: Objeto com photo_url`, {
            url: photo.photo_url,
            is_primary: photo.is_primary
          });
        } else {
          console.error(`Foto ${index + 1}: Formato desconhecido`, photo);
        }
      });

      // Primeiro vamos excluir as fotos existentes
      console.log("Excluindo fotos antigas do item...");
      const { error: deleteError } = await supabase
        .from('inventory_photos')
        .delete()
        .eq('inventory_id', itemId);
      
      if (deleteError) {
        console.error("Erro ao excluir fotos antigas:", deleteError);
        throw deleteError;
      }
      
      // Preparar o array para armazenar os registros processados
      const processedPhotoRecords: { inventory_id: string; photo_url: string; is_primary: boolean }[] = [];
      
      // Processar cada foto com maior clareza e robustez
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        let photoUrl = '';
        let isPrimary = false;
        let fileToUpload: File | null = null;
        
        console.log(`Processando foto ${i + 1}/${photos.length}...`);
        
        // Determinar o tipo de objeto para processamento adequado
        if ('photo_url' in photo && typeof photo.photo_url === 'string') {
          // É um objeto com URL, usar diretamente
          photoUrl = photo.photo_url;
          isPrimary = photo.is_primary || false;
          console.log(`Foto ${i + 1} já possui URL:`, photoUrl);
        } 
        else if ('file' in photo && photo.file instanceof File) {
          // É um objeto com File e possivelmente is_primary
          fileToUpload = photo.file;
          isPrimary = photo.is_primary || false;
          console.log(`Foto ${i + 1} é objeto com file e is_primary:`, {
            filename: photo.file.name,
            isPrimary: isPrimary
          });
        }
        else if (photo instanceof File) {
          // É um arquivo File direto (upload tradicional ou webcam)
          fileToUpload = photo;
          // Verificar se está usando a forma antiga (sem informação de primária)
          isPrimary = i === 0; // Primeira foto como primária por padrão no método antigo
          console.log(`Foto ${i + 1} é File direto:`, {
            filename: photo.name,
            isPrimary: isPrimary
          });
        }
        else {
          // Se chegou aqui, o objeto não é compatível
          console.error(`Foto ${i + 1} tem formato incompatível:`, photo);
          continue;
        }
        
        // Se temos um arquivo para upload, processá-lo
        if (fileToUpload) {
          console.log(`Iniciando upload do arquivo ${i + 1}/${photos.length}: ${fileToUpload.name} (${fileToUpload.type})`);
          
          try {
            // Verificar tipo de arquivo e formato
            if (!fileToUpload.type.startsWith('image/')) {
              console.error(`Arquivo ${fileToUpload.name} não é uma imagem válida (tipo: ${fileToUpload.type})`);
              continue;
            }
            
            // Definir o caminho de armazenamento (formato: inventory/item_id/timestamp_filename.jpg)
            const timestamp = new Date().getTime();
            // Garantir que o nome do arquivo seja seguro para URLs
            const safeFileName = fileToUpload.name
              .replace(/[^a-zA-Z0-9_\-.]/g, '_')
              .toLowerCase();
            const filePath = `inventory/${itemId}/${timestamp}_${safeFileName}`;
            
            console.log(`Enviando arquivo para: ${filePath}`);
            
            // USANDO EXCLUSIVAMENTE BUCKET 'inventory_photos'
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('inventory_photos')
              .upload(filePath, fileToUpload, {
                cacheControl: '3600',
                upsert: true
              });
            
            if (uploadError) {
              console.error(`Erro ao fazer upload da foto ${i + 1}:`, uploadError);
              throw uploadError;
            }
            
            // USANDO EXCLUSIVAMENTE BUCKET 'inventory_photos' na obtenção da URL pública
            const { data: urlData } = supabase.storage
              .from('inventory_photos')
              .getPublicUrl(filePath);
              
            photoUrl = urlData.publicUrl;
            console.log(`Foto ${i + 1} enviada com sucesso. URL:`, photoUrl);
            
            // Adicionar ao array de registros
            processedPhotoRecords.push({
              inventory_id: itemId,
              photo_url: photoUrl,
              is_primary: isPrimary
            });
          } catch (error) {
            console.error(`Erro ao processar arquivo ${i + 1}:`, error);
            // Continuar para o próximo arquivo em caso de erro
          }
        } 
        else if (photoUrl) {
          // URL direta - adicionar ao array de registros
          processedPhotoRecords.push({
            inventory_id: itemId,
            photo_url: photoUrl,
            is_primary: isPrimary
          });
        }
      }
      
      // Se não houver fotos processadas, retornar array vazio
      if (processedPhotoRecords.length === 0) {
        console.log("Nenhuma foto válida para inserir no banco.");
        return [];
      }
      
      // Garantir que apenas uma foto seja marcada como primária
      let hasPrimary = false;
      for (let i = 0; i < processedPhotoRecords.length; i++) {
        if (processedPhotoRecords[i].is_primary) {
          if (hasPrimary) {
            // Se já temos uma foto primária, desmarcar as demais
            processedPhotoRecords[i].is_primary = false;
          } else {
            hasPrimary = true;
          }
        }
      }
      
      // Se nenhuma foto foi marcada como primária, marcar a primeira
      if (!hasPrimary && processedPhotoRecords.length > 0) {
        processedPhotoRecords[0].is_primary = true;
      }
      
      // Inserir os registros no banco de dados
      console.log("Inserindo registros de fotos no banco:", processedPhotoRecords.length, "registros");
      
      // Mostrar detalhes dos registros para depuração
      processedPhotoRecords.forEach((record, idx) => {
        console.log(`Registro ${idx + 1}:`, {
          inventory_id: record.inventory_id,
          photo_url: record.photo_url,
          is_primary: record.is_primary
        });
      });
      
      const { data, error } = await supabase
        .from('inventory_photos')
        .insert(processedPhotoRecords)
        .select();
      
      if (error) {
        console.error("Erro ao inserir fotos no banco:", error);
        throw error;
      }
      
      console.log("Fotos atualizadas com sucesso:", data?.length);
      console.log("=== FIM: updateItemPhotos ===");
      
      return data || [];
    } catch (error) {
      console.error("Erro geral ao atualizar fotos:", error);
      throw error;
    }
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

  // Verificar se um item está em uma maleta
  static async checkItemInSuitcase(inventoryId: string): Promise<any> {
    try {
      // Consulta ajustada para retornar os dados corretamente
      const { data, error } = await supabase
        .from('suitcase_items')
        .select(`
          id,
          suitcase_id,
          suitcases:suitcases(
            code, 
            status,
            resellers:resellers(name)
          )
        `)
        .eq('inventory_id', inventoryId)
        .eq('status', 'in_possession');
      
      if (error) throw error;
      
      if (!data || data.length === 0) return null;
      
      const firstItem = data[0];
      
      // Estrutura de retorno padronizada com tipos definidos
      return {
        suitcase_id: firstItem.suitcase_id,
        suitcase_code: firstItem.suitcases?.code || 'Desconhecido',
        status: firstItem.suitcases?.status || 'unknown',
        seller_name: firstItem.suitcases?.resellers?.name || 'Desconhecido',
        hasError: false
      };
    } catch (error) {
      console.error("Erro ao verificar se item está em maleta:", error);
      // Retornar um objeto com hasError: true para indicar que ocorreu um erro
      return { 
        suitcase_id: null, 
        suitcase_code: null, 
        status: null, 
        seller_name: null,
        hasError: true 
      };
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
