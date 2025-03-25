
/**
 * Tipos e interfaces para o módulo de inventário
 * Este arquivo contém todas as definições de tipos usadas pelos modelos de inventário
 */

export interface InventoryPhoto {
  id: string;
  inventory_id: string;
  photo_url: string;
  is_primary: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryCategory {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface PlatingType {
  id: string;
  name: string;
  gram_value: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_info?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  category_id: string;
  quantity: number;
  price: number;
  unit_cost: number;
  suggested_price: number;
  weight?: number;
  width?: number;
  height?: number;
  depth?: number;
  min_stock: number;
  supplier_id?: string;
  popularity: number;
  plating_type_id?: string;
  material_weight?: number;
  packaging_cost?: number;
  gram_value?: number;
  profit_margin?: number;
  reseller_commission?: number;
  markup_percentage?: number;
  created_at?: string;
  updated_at?: string;
  category_name?: string;
  supplier_name?: string;
  plating_type_name?: string;
  photos?: InventoryPhoto[];
  inventory_photos?: InventoryPhoto[];
  archived?: boolean;
}

export interface InventoryFilters {
  search?: string;
  category_id?: string;
  min_price?: number;
  max_price?: number;
  status?: 'in_stock' | 'out_of_stock' | 'low_stock' | 'archived' | string;
  minQuantity?: number;
  maxQuantity?: number;
  searchTerm?: string;
  category?: string;
  showArchived?: boolean;
}
