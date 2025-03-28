
/**
 * Utilitários para manipulação de fotos
 * @file Funções auxiliares para processar URLs de fotos de produtos
 */
import { PhotoUrl } from "@/types/suitcase";

/**
 * Função para obter a URL da foto de um produto a partir de diferentes formatos possíveis
 * @param photoUrl Pode ser uma string, um array de objetos PhotoUrl, ou undefined
 * @returns Uma string com a URL da foto ou string vazia
 */
export const getProductPhotoUrl = (photoUrl: string | PhotoUrl[] | undefined): string => {
  if (!photoUrl) return '';
  
  if (typeof photoUrl === 'string') {
    return photoUrl;
  }
  
  if (Array.isArray(photoUrl) && photoUrl.length > 0) {
    return photoUrl[0]?.photo_url || '';
  }
  
  return '';
};
