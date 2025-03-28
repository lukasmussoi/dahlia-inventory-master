
/**
 * Utilitário para manipulação de fotos de produtos
 * @file Funções para processar URLs e formatos de fotos de produtos
 */

import { PhotoUrl } from "@/types/suitcase";

/**
 * Extrai a URL de foto a partir de diferentes formatos possíveis
 * @param photoUrl Pode ser uma string, array de objetos ou undefined
 * @returns URL da foto ou null
 */
export function getProductPhotoUrl(photoUrl: string | PhotoUrl[] | undefined): string | null {
  if (!photoUrl) return null;
  
  // Caso 1: É uma string
  if (typeof photoUrl === 'string') {
    return photoUrl;
  }
  
  // Caso 2: É um array de objetos PhotoUrl
  if (Array.isArray(photoUrl) && photoUrl.length > 0) {
    return photoUrl[0]?.photo_url || null;
  }
  
  return null;
}
