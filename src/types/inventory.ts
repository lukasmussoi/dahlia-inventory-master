
/**
 * Tipos para o módulo de Inventário
 * @file Define tipos relacionados ao inventário e gestão de estoque
 */

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  quantity: number;
  quantity_reserved?: number; // Nova propriedade: quantidade reservada em maletas
  price: number;
  unit_cost: number;
  raw_cost: number; // Alterado de opcional para obrigatório para corresponder ao modelo
  category_id: string;
  category_name?: string;
  supplier_id?: string;
  supplier_name?: string;
  plating_type_id?: string;
  plating_type_name?: string;
  suggested_price?: number;
  weight?: number;
  width?: number;
  height?: number;
  depth?: number;
  min_stock?: number;
  popularity?: number;
  material_weight?: number;
  packaging_cost?: number;
  gram_value?: number;
  profit_margin?: number;
  reseller_commission?: number;
  markup_percentage?: number;
  archived?: boolean;
  created_at?: string;
  updated_at?: string;
  photos?: any[];
  inventory_photos?: any[];
}

export type MovementType = 
  | 'entrada' 
  | 'saida' 
  | 'ajuste' 
  | 'devolucao' 
  | 'reserva_maleta'
  | 'retorno_maleta'
  | 'venda_maleta'
  | 'danificado'; // Adicionado tipo para itens danificados

export interface InventoryMovement {
  id: string;
  inventory_id: string;
  user_id: string;
  quantity: number;
  movement_type: MovementType;
  reason: string;
  unit_cost: number;
  notes?: string;
  created_at: string;
}

export interface InventoryFilters {
  search?: string;
  category_id?: string;
  min_price?: number;
  max_price?: number;
  min_quantity?: number;
  max_quantity?: number;
  archived?: boolean;
}

export interface InventoryUpdatePayload {
  name?: string;
  quantity?: number;
  price?: number;
  unit_cost?: number;
  raw_cost?: number;
  category_id?: string;
  [key: string]: any;
}
