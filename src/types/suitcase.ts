
export type SuitcaseStatus = 'in_use' | 'returned' | 'in_replenishment';
export type SuitcaseItemStatus = 'in_possession' | 'sold' | 'returned' | 'lost';

export interface SuitcaseItemSale {
  id: string;
  suitcase_item_id: string;
  client_name?: string;
  payment_method?: string;
  sale_date: string;
}

export interface SuitcaseItem {
  id: string;
  suitcase_id: string;
  inventory_id: string;
  status: SuitcaseItemStatus;
  added_at: string;
  product?: {
    id: string;
    sku: string;
    name: string;
    price: number;
    photo_url?: string;
  };
  sales?: SuitcaseItemSale[];
}

export interface SuitcaseItemWithSales extends SuitcaseItem {
  name: string;
  sku: string;
  price: number;
  sales: SuitcaseItemSale[];
}

export interface Suitcase {
  id: string;
  code: string;
  seller_id: string;
  status: SuitcaseStatus;
  city?: string;
  neighborhood?: string;
  created_at: string;
  updated_at?: string;
  next_settlement_date?: string;
  seller?: {
    id: string;
    name: string;
    phone?: string;
  };
}

export interface SuitcaseFilters {
  search?: string;
  status?: string;
  city?: string;
  neighborhood?: string;
}

export interface InventoryFilters {
  search?: string;
  status?: string;
  category_id?: string;
  min_price?: number;
  max_price?: number;
}
