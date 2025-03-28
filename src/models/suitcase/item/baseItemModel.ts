
/**
 * Modelo Base para Itens de Maleta
 * @file Funções comuns para processamento de dados de itens
 * @relacionamento Utilizado por outros modelos de itens
 */
import { SuitcaseItem, PhotoUrl } from "@/types/suitcase";

export class BaseItemModel {
  /**
   * Processa os dados brutos de um item da maleta
   * @param rawItem Dados do item recebidos da consulta
   * @returns Item com dados processados
   */
  static processItemData(rawItem: any): SuitcaseItem {
    let photoUrl;
    
    // Processar URL da foto do produto
    if (rawItem.product?.photos && Array.isArray(rawItem.product.photos)) {
      photoUrl = rawItem.product.photos;
    } else if (rawItem.product?.photo_url) {
      photoUrl = rawItem.product.photo_url;
    }
    
    // Processar quantidade do item
    const quantity = typeof rawItem.quantity === 'number' ? rawItem.quantity : 1;
    
    // Construir o objeto SuitcaseItem com dados processados
    return {
      id: rawItem.id,
      suitcase_id: rawItem.suitcase_id,
      inventory_id: rawItem.inventory_id,
      status: rawItem.status,
      added_at: rawItem.added_at,
      quantity: quantity,
      created_at: rawItem.created_at,
      updated_at: rawItem.updated_at,
      product: rawItem.product ? {
        id: rawItem.product.id,
        sku: rawItem.product.sku,
        name: rawItem.product.name,
        price: rawItem.product.price,
        unit_cost: rawItem.product.unit_cost,
        photo_url: photoUrl
      } : undefined,
      sales: rawItem.sales || []
    };
  }
}
