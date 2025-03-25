
export type SuitcaseStatus = 'in_use' | 'returned' | 'in_replenishment' | 'lost' | 'in_audit';
export type SuitcaseItemStatus = 'in_possession' | 'sold' | 'returned' | 'lost';
export type AcertoStatus = 'pendente' | 'concluido';

export interface SuitcaseItemSale {
  id: string;
  suitcase_item_id: string;
  client_name?: string;
  payment_method?: string;
  sale_date: string;
  customer_name?: string;
  sold_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SuitcaseItem {
  id: string;
  suitcase_id: string;
  inventory_id: string;
  status: SuitcaseItemStatus;
  added_at?: string;
  quantity?: number;
  created_at?: string;
  updated_at?: string;
  product?: {
    id: string;
    sku: string;
    name: string;
    price: number;
    unit_cost?: number;
    photo_url?: string | PhotoUrl[];
  };
  sales?: SuitcaseItemSale[];
}

// Interface para facilitar o tratamento de photo_url
export interface PhotoUrl {
  photo_url: string;
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
  sent_at?: string;
  seller?: {
    id: string;
    name: string;
    phone?: string;
    commission_rate?: number;
    address?: any; // Permitir qualquer tipo para address (string, object, number, null)
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
  minQuantity?: number;
  maxQuantity?: number;
  searchTerm?: string;
  category?: string;
}

export interface InventoryItemSuitcaseInfo {
  suitcase_id: string;
  suitcase_code: string;
  seller_name?: string;
}

export interface AcertoItem {
  id: string;
  acerto_id: string;
  suitcase_item_id: string;
  inventory_id: string;
  price: number;
  sale_date: string;
  customer_name?: string;
  payment_method?: string;
  created_at?: string;
  updated_at?: string;
  unit_cost?: number;
  product?: {
    id: string;
    name: string;
    sku: string;
    price: number;
    unit_cost?: number;
    photo_url?: string | PhotoUrl[]; // Permitir ambos os formatos
  };
}

export interface Acerto {
  id: string;
  suitcase_id: string;
  seller_id: string;
  settlement_date: string;
  next_settlement_date?: string;
  total_sales: number;
  commission_amount: number;
  receipt_url?: string;
  status: AcertoStatus;
  restock_suggestions?: any;
  created_at: string;
  updated_at?: string;
  total_cost?: number;
  net_profit?: number;
  suitcase?: Partial<Suitcase>;
  seller?: {
    id: string;
    name: string;
    commission_rate?: number;
    address?: any; // Permitir qualquer tipo para address
  };
  items_vendidos?: AcertoItem[];
}

export interface SuitcaseSettlementFormData {
  suitcase_id: string;
  seller_id: string;
  settlement_date: Date;
  next_settlement_date?: Date;
  items_present: string[] | SuitcaseItem[]; // Atualizado para aceitar tanto strings quanto objetos completos
  items_sold: string[] | SuitcaseItem[]; // Atualizado para aceitar tanto strings quanto objetos completos
}
