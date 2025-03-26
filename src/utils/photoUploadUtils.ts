
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
}

// Tipo para o callback de progresso
export type ProgressCallback = (progress: number) => void;

/**
 * Faz upload de uma foto para o bucket do Supabase Storage
 * @param file Arquivo a ser enviado
 * @param bucket Nome do bucket ('inventory_images' ou 'inventory_photos')
 * @param onProgress Callback opcional para reportar progresso
 * @returns Promise com resultado do upload
 */
export const uploadPhoto = async (
  file: File,
  bucket: 'inventory_images' | 'inventory_photos' = 'inventory_photos',
  onProgress?: ProgressCallback
): Promise<UploadResult> => {
  try {
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

    // Gerar nome único para o arquivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Fazer upload para o Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
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
      url: urlData.publicUrl 
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
 * @param files Array de arquivos a serem enviados
 * @param bucket Nome do bucket ('inventory_images' ou 'inventory_photos')
 * @param onProgress Callback opcional para reportar progresso
 * @returns Promise com resultados dos uploads
 */
export const uploadMultiplePhotos = async (
  files: File[],
  bucket: 'inventory_images' | 'inventory_photos' = 'inventory_photos',
  onProgress?: ProgressCallback
): Promise<UploadResult[]> => {
  if (!files.length) {
    return [{ success: false, error: 'Nenhum arquivo fornecido' }];
  }

  const results: UploadResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const result = await uploadPhoto(files[i], bucket);
    results.push(result);
    
    // Calcular e reportar progresso
    if (onProgress) {
      const progress = Math.round(((i + 1) / files.length) * 100);
      onProgress(progress);
    }
  }
  
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
  bucket: 'inventory_images' | 'inventory_photos' = 'inventory_photos'
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Extrair o nome do arquivo da URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const fileName = pathParts[pathParts.length - 1];

    // Verificar se o nome do arquivo é válido
    if (!fileName) {
      return { success: false, error: 'Nome de arquivo inválido' };
    }

    // Excluir arquivo do Supabase Storage
    const { error } = await supabase.storage
      .from(bucket)
      .remove([fileName]);

    if (error) {
      console.error(`Erro ao excluir foto de ${bucket}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`Foto excluída com sucesso de ${bucket}:`, fileName);
    return { success: true };
  } catch (error) {
    console.error('Erro durante exclusão de foto:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido durante exclusão' 
    };
  }
};
