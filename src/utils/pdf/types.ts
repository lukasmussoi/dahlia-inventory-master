
/**
 * Tipos e interfaces para geração de PDF de etiquetas
 */

export interface GeneratePdfLabelOptions {
  item: any;
  copies: number;
  startRow: number;
  startColumn: number;
  multiplyByStock: boolean;
  selectedModeloId?: string;
}

export interface PdfGenerationResult {
  url: string;
  pageCount: number;
  labelCount: number;
}
