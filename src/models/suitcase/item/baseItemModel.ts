
/**
 * Modelo Base de Itens de Maleta
 * @file Funções auxiliares e transformações de dados para itens de maleta
 * @relacionamento Utilizado pelos demais modelos de itens de maleta
 */
import { SuitcaseItem, PhotoUrl } from "@/types/suitcase";

export class BaseItemModel {
  /**
   * Processa os dados de um item de maleta retornado pelo banco
   * @param item Dados do item retornado pelo banco
   * @returns Item processado no formato esperado pela aplicação
   */
  static processItemData(item: any): SuitcaseItem {
    // Extrair URL da foto, garantindo que é uma string válida
    let photoUrl;
    if (item.product?.photos && 
        Array.isArray(item.product.photos) && 
        item.product.photos.length > 0) {
      // Verificar se o item da array é um objeto com photo_url
      if (item.product.photos[0] && typeof item.product.photos[0] === 'object') {
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
      status: item.status,
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
  }
}
