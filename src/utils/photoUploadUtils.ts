
/**
 * Utilitários para upload de fotos no Supabase Storage
 * @file Este arquivo contém funções para fazer upload de fotos para o Supabase Storage
 * @relacionamento Utilizado pelos componentes de formulário de inventário
 */
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';

// Tipo para o resultado do upload
export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  isExistingUrl?: boolean;
}

// Tipo para o callback de progresso
export type ProgressCallback = (progress: number) => void;

/**
 * Faz upload de uma foto para o bucket do Supabase Storage
 * @param file Arquivo a ser enviado ou URL existente
 * @param bucket Nome do bucket ('inventory_images' ou 'inventory_photos')
 * @param onProgress Callback opcional para reportar progresso
 * @param itemId ID opcional do item ao qual a foto pertence
 * @returns Promise com resultado do upload
 */
export const uploadPhoto = async (
  file: File | string,
  bucket: 'inventory_images' | 'inventory_photos' = 'inventory_images',
  onProgress?: ProgressCallback,
  itemId?: string
): Promise<UploadResult> => {
  try {
    // Verificar se já é uma URL existente
    if (typeof file === 'string') {
      console.log('URL de foto existente detectada, não fazendo re-upload:', file);
      return { success: true, url: file, isExistingUrl: true };
    }

    if (!file) {
      return { success: false, error: 'Nenhum arquivo fornecido' };
    }

    // Verificar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'O arquivo deve ser uma imagem' };
    }

    // Verificar tamanho do arquivo (5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return { success: false, error: 'A imagem deve ter no máximo 5MB' };
    }

    // Determinar a extensão correta com base no tipo MIME
    let fileExtension = '.jpg'; // Padrão
    if (file.type === 'image/png') fileExtension = '.png';
    if (file.type === 'image/jpeg') fileExtension = '.jpg';
    if (file.type === 'image/gif') fileExtension = '.gif';
    if (file.type === 'image/webp') fileExtension = '.webp';
    
    // Gerar nome único para o arquivo
    const timestamp = new Date().getTime();
    const safeFileName = file.name
      .replace(/[^a-zA-Z0-9_\-.]/g, '_')
      .toLowerCase()
      .replace(/\.[^/.]+$/, ""); // Remover extensão existente
    
    const finalFileName = `${safeFileName}${fileExtension}`;
    
    // Usar ID do item se fornecido, ou gerar ID temporário
    const dirId = itemId || uuidv4();
    
    // Caminho no formato: inventory/item_id/timestamp_filename.ext
    const filePath = `inventory/${dirId}/${timestamp}_${finalFileName}`;

    console.log(`Iniciando upload para ${bucket}, caminho: ${filePath}`);

    // Fazer upload para o Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true, // Importante: permite sobrescrever arquivo existente
      });

    if (error) {
      console.error(`Erro ao fazer upload para ${bucket}:`, error);
      return { success: false, error: error.message };
    }

    // Obter URL pública do arquivo
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    console.log(`Upload concluído com sucesso para ${bucket}. URL:`, urlData.publicUrl);
    
    return { 
      success: true, 
      url: urlData.publicUrl,
      isExistingUrl: false
    };
  } catch (error) {
    console.error('Erro durante upload de foto:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido durante upload' 
    };
  }
};

/**
 * Faz upload de múltiplas fotos para o bucket do Supabase Storage
 * @param files Array de arquivos ou URLs existentes a serem enviados
 * @param bucket Nome do bucket ('inventory_images' ou 'inventory_photos')
 * @param onProgress Callback opcional para reportar progresso
 * @param itemId ID opcional do item ao qual as fotos pertencem
 * @returns Promise com resultados dos uploads
 */
export const uploadMultiplePhotos = async (
  files: (File | string)[],
  bucket: 'inventory_images' | 'inventory_photos' = 'inventory_images',
  onProgress?: ProgressCallback,
  itemId?: string
): Promise<UploadResult[]> => {
  if (!files.length) {
    return [{ success: false, error: 'Nenhum arquivo fornecido' }];
  }

  console.log(`Iniciando upload de ${files.length} fotos para o item ${itemId}`);
  console.log('Tipos de arquivos recebidos:', files.map(f => typeof f === 'string' ? 'URL existente' : 'Novo arquivo'));

  const results: UploadResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const result = await uploadPhoto(files[i], bucket, undefined, itemId);
    results.push(result);
    
    // Calcular e reportar progresso
    if (onProgress) {
      const progress = Math.round(((i + 1) / files.length) * 100);
      onProgress(progress);
    }
  }

  console.log('Resultados dos uploads:', results);
  
  return results;
};

/**
 * Exclui uma foto do bucket do Supabase Storage
 * @param url URL pública da foto a ser excluída
 * @param bucket Nome do bucket ('inventory_images' ou 'inventory_photos')
 * @returns Promise com resultado da exclusão
 */
export const deletePhoto = async (
  url: string,
  bucket: 'inventory_images' | 'inventory_photos' = 'inventory_images'
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log(`Iniciando exclusão da foto: ${url}`);
    
    // Extrair o caminho completo da URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    // Encontrar o índice do nome do bucket na URL
    const bucketIndex = pathParts.findIndex(part => 
      part === 'inventory_images' || part === 'inventory_photos'
    );
    
    // Se encontrou o bucket, extrair o caminho relativo
    let filePath;
    if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
      filePath = pathParts.slice(bucketIndex + 1).join('/');
      // Determinar o bucket correto com base na URL
      const actualBucket = pathParts[bucketIndex];
      bucket = actualBucket as 'inventory_images' | 'inventory_photos';
      console.log(`Bucket detectado na URL: ${bucket}, caminho do arquivo: ${filePath}`);
    } else {
      // Fallback para o método antigo
      filePath = pathParts[pathParts.length - 1];
      console.log(`Não foi possível detectar bucket na URL, usando método fallback. Caminho: ${filePath}`);
    }

    // Verificar se o caminho é válido
    if (!filePath) {
      console.error('Caminho de arquivo inválido na URL:', url);
      return { success: false, error: 'Caminho de arquivo inválido' };
    }

    console.log(`Tentando excluir arquivo: ${filePath} do bucket: ${bucket}`);

    // Excluir arquivo do Supabase Storage
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error(`Erro ao excluir foto de ${bucket}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`Foto excluída com sucesso de ${bucket}: ${filePath}`);
    return { success: true };
  } catch (error) {
    console.error('Erro durante exclusão de foto:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido durante exclusão' 
    };
  }
};
