
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
      
      // Converter para o formato de InventoryItem, garantindo que raw_cost esteja presente
      const processedItem: InventoryItem = {
        ...item,
        raw_cost: item.raw_cost ?? 0, // Usar operador de coalescência nula
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
    
    // Converter para o formato de InventoryItem, garantindo que raw_cost esteja presente
    const processedItem: InventoryItem = {
      ...data,
      raw_cost: data.raw_cost ?? 0, // Usar operador de coalescência nula
      photos: processedPhotos,
      inventory_photos: processedPhotos,
      category_name: data.category_name?.name || '',
      supplier_name: data.supplier_name?.name || ''
    };
    
    return processedItem;
  }

  // Atualizar fotos de um item - usando o novo bucket 'inventory_images'
  static async updateItemPhotos(
    itemId: string, 
    photos: Array<File | string | { 
      file: File; 
      is_primary?: boolean;
      type?: 'new' | 'existing';
    } | { 
      id?: string; 
      photo_url: string; 
      is_primary?: boolean;
      type?: 'new' | 'existing';
    }>
  ): Promise<InventoryPhoto[]> {
    if (!photos || photos.length === 0) return [];

    try {
      // Logs detalhados para entender o início do processamento
      console.log("=== INÍCIO: updateItemPhotos com NOVO BUCKET ===");
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
        } else if (typeof photo === 'string') {
          console.log(`Foto ${index + 1}: URL existente`, photo);
        } else if (photo && typeof photo === 'object' && 'file' in photo && photo.file instanceof File) {
          console.log(`Foto ${index + 1}: Objeto com File e is_primary`, {
            name: photo.file.name,
            type: photo.file.type,
            size: photo.file.size,
            lastModified: photo.file.lastModified,
            is_primary: photo.is_primary,
            tipo: photo.type || 'new' // Corrigido: 'tipo' em vez de 'type' duplicado
          });
        } else if (photo && typeof photo === 'object' && 'photo_url' in photo) {
          console.log(`Foto ${index + 1}: Objeto com photo_url`, {
            url: photo.photo_url,
            is_primary: photo.is_primary,
            tipo: photo.type || 'existing' // Corrigido: 'tipo' em vez de 'type' duplicado
          });
        } else {
          console.error(`Foto ${index + 1}: Formato desconhecido`, photo);
        }
      });

      // Separar fotos por tipo
      const existingPhotos: { photo_url: string; is_primary?: boolean }[] = [];
      const photosToUpload: { file: File; is_primary?: boolean }[] = [];
      const urlsToKeep = new Set<string>();

      // Classificar as fotos recebidas
      photos.forEach(photo => {
        if (typeof photo === 'string') {
          // É uma URL que deve ser mantida
          existingPhotos.push({ photo_url: photo, is_primary: false });
          urlsToKeep.add(photo);
        } 
        else if (photo instanceof File) {
          // É um novo arquivo para upload
          photosToUpload.push({ file: photo, is_primary: false });
        }
        else if (typeof photo === 'object') {
          if ('photo_url' in photo) {
            // É uma foto existente
            const isExisting = photo.type === 'existing' || photo.type === undefined;
            if (isExisting) {
              existingPhotos.push({
                photo_url: photo.photo_url,
                is_primary: photo.is_primary
              });
              urlsToKeep.add(photo.photo_url);
            }
          } 
          else if ('file' in photo && photo.file instanceof File) {
            // É uma nova foto
            photosToUpload.push({
              file: photo.file,
              is_primary: photo.is_primary
            });
          }
        }
      });

      console.log(`Classificação das fotos: ${existingPhotos.length} existentes, ${photosToUpload.length} novas`);

      // Primeiro, buscar fotos existentes para identificar quais precisam ser excluídas
      const { data: currentPhotos, error: fetchError } = await supabase
        .from('inventory_photos')
        .select('*')
        .eq('inventory_id', itemId);
        
      if (fetchError) {
        console.error("Erro ao buscar fotos existentes:", fetchError);
        throw fetchError;
      }

      // Identificar fotos para excluir (as que não estão em urlsToKeep)
      const photosToDelete = currentPhotos?.filter(photo => !urlsToKeep.has(photo.photo_url)) || [];
      
      console.log(`${photosToDelete.length} fotos identificadas para exclusão`);

      // Excluir fotos que não serão mantidas
      for (const photo of photosToDelete) {
        try {
          console.log(`Excluindo foto: ${photo.photo_url}`);
          
          // Extrair o caminho do arquivo da URL
          const urlObj = new URL(photo.photo_url);
          const pathParts = urlObj.pathname.split('/');
          
          // Encontrar o índice do nome do bucket na URL
          const bucketIndex = pathParts.findIndex(part => 
            part === 'inventory_images' || part === 'inventory_photos'
          );
          
          if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
            const bucketName = pathParts[bucketIndex];
            const storagePath = pathParts.slice(bucketIndex + 1).join('/');
            
            console.log(`Removendo arquivo ${storagePath} do bucket ${bucketName}`);
            
            const { error: deleteError } = await supabase.storage
              .from(bucketName)
              .remove([storagePath]);
              
            if (deleteError) {
              console.error(`Erro ao excluir arquivo do storage: ${storagePath}`, deleteError);
            }
          }
        } catch (error) {
          console.error(`Erro ao processar exclusão do arquivo: ${photo.photo_url}`, error);
        }
      }

      // Excluir todos os registros existentes do banco
      const { error: deleteDbError } = await supabase
        .from('inventory_photos')
        .delete()
        .eq('inventory_id', itemId);
      
      if (deleteDbError) {
        console.error("Erro ao excluir registros antigos de fotos:", deleteDbError);
        throw deleteDbError;
      }

      // Array para armazenar os novos registros
      const newPhotoRecords: { inventory_id: string; photo_url: string; is_primary: boolean }[] = [];
      
      // Adicionar URLs existentes que devem ser mantidas
      existingPhotos.forEach(photo => {
        newPhotoRecords.push({
          inventory_id: itemId,
          photo_url: photo.photo_url,
          is_primary: photo.is_primary || false
        });
      });
      
      // Processar uploads de novas fotos
      for (let i = 0; i < photosToUpload.length; i++) {
        const { file, is_primary } = photosToUpload[i];
        
        try {
          console.log(`Fazendo upload da foto ${i+1}/${photosToUpload.length}: ${file.name}`);
          
          // Verificar tipo de arquivo
          if (!file.type.startsWith('image/')) {
            console.error(`Arquivo ${file.name} não é uma imagem válida`);
            continue;
          }
          
          // Determinar a extensão correta
          let fileExtension = '.jpg';
          if (file.type === 'image/png') fileExtension = '.png';
          if (file.type === 'image/jpeg') fileExtension = '.jpg';
          if (file.type === 'image/gif') fileExtension = '.gif';
          if (file.type === 'image/webp') fileExtension = '.webp';
          
          // Preparar nome de arquivo seguro
          const timestamp = new Date().getTime();
          const safeFileName = file.name
            .replace(/[^a-zA-Z0-9_\-.]/g, '_')
            .toLowerCase()
            .replace(/\.[^/.]+$/, "");
          
          const finalFileName = `${safeFileName}${fileExtension}`;
          const filePath = `inventory/${itemId}/${timestamp}_${finalFileName}`;
          
          console.log(`Enviando para inventory_images em: ${filePath}`);
          
          // Fazer upload do arquivo
          const { data, error } = await supabase.storage
            .from('inventory_images')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: true
            });
          
          if (error) {
            console.error(`Erro ao fazer upload: ${error.message}`);
            continue;
          }
          
          // Obter URL pública
          const { data: urlData } = supabase.storage
            .from('inventory_images')
            .getPublicUrl(filePath);
          
          console.log(`Upload bem-sucedido. URL: ${urlData.publicUrl}`);
          
          // Adicionar ao array de registros
          newPhotoRecords.push({
            inventory_id: itemId,
            photo_url: urlData.publicUrl,
            is_primary: !!is_primary
          });
        } catch (error) {
          console.error(`Erro ao processar upload da foto ${i+1}:`, error);
        }
      }
      
      // Garantir que apenas uma foto seja marcada como primária
      let primaryFound = false;
      for (let i = 0; i < newPhotoRecords.length; i++) {
        if (newPhotoRecords[i].is_primary) {
          if (primaryFound) {
            newPhotoRecords[i].is_primary = false;
          } else {
            primaryFound = true;
          }
        }
      }
      
      // Se nenhuma foto foi marcada como primária, marcar a primeira
      if (!primaryFound && newPhotoRecords.length > 0) {
        newPhotoRecords[0].is_primary = true;
      }
      
      // Se não há registros, retornar array vazio
      if (newPhotoRecords.length === 0) {
        console.log("Nenhuma foto válida para inserir no banco.");
        return [];
      }
      
      // Inserir novos registros
      console.log(`Inserindo ${newPhotoRecords.length} registros de fotos no banco de dados`);
      
      const { data: insertedPhotos, error: insertError } = await supabase
        .from('inventory_photos')
        .insert(newPhotoRecords)
        .select();
      
      if (insertError) {
        console.error("Erro ao inserir fotos no banco:", insertError);
        throw insertError;
      }
      
      console.log(`${insertedPhotos?.length || 0} fotos atualizadas com sucesso`);
      console.log("=== FIM: updateItemPhotos ===");
      
      return insertedPhotos || [];
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
