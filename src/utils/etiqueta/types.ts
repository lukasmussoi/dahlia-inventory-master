
/**
 * Tipos utilizados pelo módulo de geração de etiquetas
 */

/**
 * Interface para as opções de geração de PDF de pré-visualização
 */
export interface PreviewPDFOptions {
  modelName: string;
  labels: any[];
  pageFormat: string;
  pageSize: { width: number; height: number };
  pageMargins: { top: number; bottom: number; left: number; right: number };
  labelSpacing: { horizontal: number; vertical: number };
  autoAdjustDimensions: boolean;
  pageOrientation: string;
}

/**
 * Interface para as opções de impressão de etiquetas
 */
export interface EtiquetaPrintOptions {
  copias: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
