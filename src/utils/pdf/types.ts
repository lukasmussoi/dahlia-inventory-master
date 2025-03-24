
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
