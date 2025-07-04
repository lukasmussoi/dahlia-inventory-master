export type SuitcaseStatus = 'in_use' | 'returned' | 'in_replenishment' | 'lost' | 'in_audit';
export type SuitcaseItemStatus = 'in_possession' | 'sold' | 'returned' | 'lost' | 'damaged';
export type AcertoStatus = 'pendente' | 'concluido';

export interface SupplyItem {
  inventory_id: string;
  quantity: number;
  product?: {
    id: string;
    name: string;
    sku: string;
    price: number;
    photo_url?: string | { photo_url: string }[];
  };
}

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
  items_count?: number;
  seller?: {
    id: string;
    name: string;
    phone?: string;
    commission_rate?: number;
    address?: any;
  };
}

export interface SuitcaseFilters {
  search: string;
  status: string;
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
  inventory_id: string;
  quantity: number;
  unit_price: number;
  sale_price: number;
  commission_rate?: number;
  created_at?: string;
  product?: {
    id: string;
    name: string;
    sku: string;
    price: number;
    unit_cost?: number;
    photo_url?: string | PhotoUrl[];
  };
}

export interface Acerto {
  id: string;
  suitcase_id: string;
  promoter_id: string;
  data_acerto?: string;
  total_vendido?: number;
  total_comissao?: number;
  total_lucro?: number;
  observacoes?: string;
  status: AcertoStatus;
  created_at?: string;
  updated_at?: string;
  total_cost?: number;
  net_profit?: number;
  suitcase?: any;
  promoter?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    commission_rate?: number;
  };
  items_vendidos?: AcertoItem[];
}

// Versão temporária compatível com os componentes existentes
export interface AcertoCompatible extends Acerto {
  settlement_date?: string; // mapeado de data_acerto
  total_sales?: number; // mapeado de total_vendido
  commission_amount?: number; // mapeado de total_comissao
  seller?: { // temporário para compatibilidade
    id: string;
    name: string;
    commission_rate?: number;
    address?: any;
  };
  next_settlement_date?: string;
}

export interface AcertoItemCompatible extends AcertoItem {
  price?: number; // mapeado de sale_price
  customer_name?: string; // campo que não existe mais
  payment_method?: string; // campo que não existe mais
  sale_date?: string; // campo que não existe mais  
  unit_cost?: number; // extraído do produto
}

// Mapear o Acerto para versão compatível
export function mapAcertoToCompatible(acerto: Acerto): AcertoCompatible {
  return {
    ...acerto,
    settlement_date: acerto.data_acerto,
    total_sales: acerto.total_vendido,
    commission_amount: acerto.total_comissao,
    seller: acerto.promoter ? {
      id: acerto.promoter.id,
      name: acerto.promoter.name,
      commission_rate: acerto.promoter.commission_rate,
      address: null
    } : undefined,
    next_settlement_date: undefined // Campo que não existe mais
  };
}

// Mapear o AcertoItem para versão compatível
export function mapAcertoItemToCompatible(item: AcertoItem): AcertoItemCompatible {
  return {
    ...item,
    price: item.sale_price,
    unit_cost: item.product?.unit_cost,
    customer_name: undefined, // Campo que não existe mais
    payment_method: undefined, // Campo que não existe mais
    sale_date: undefined // Campo que não existe mais
  };
}

export interface SuitcaseSettlementFormData {
  suitcase_id: string;
  seller_id: string;
  settlement_date: Date | string;
  next_settlement_date?: Date | string | null;
  items_present: string[] | SuitcaseItem[];
  items_sold: string[] | SuitcaseItem[];
}

export interface GroupedSuitcaseItem {
  product_id: string;
  product_sku: string;
  product_name: string;
  product_price: number;
  photo_url?: string;
  total_quantity: number;
  items: SuitcaseItem[];
}
