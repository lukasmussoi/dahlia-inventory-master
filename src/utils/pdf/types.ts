
/**
 * Tipos e interfaces para geração de PDF de etiquetas
 */

export interface GeneratePdfLabelOptions {
  items: any[]; // Modificado: Agora é um array de itens
  copies: number;
  multiplyByStock: boolean;
  selectedModeloId?: string;
}

export interface PdfGenerationResult {
  url: string;
  pageCount: number;
  labelCount: number;
}

export interface ReceiptPdfOptions {
  acertoId: string;
  title: string;
  subtitle?: string;
  includeImages?: boolean;
}

export interface AcertoReceiptData {
  id: string;
  settlement_date: string;
  next_settlement_date?: string;
  maleta?: {
    code: string;
    city?: string;
    neighborhood?: string;
  };
  revendedora?: {
    name: string;
    commission_rate?: number;
  };
  total_sales: number;
  commission_amount: number;
  items_vendidos?: Array<{
    id: string;
    product?: {
      name: string;
      sku: string;
      price: number;
      photo_url?: string;
    };
    customer_name?: string;
    price: number;
  }>;
}
