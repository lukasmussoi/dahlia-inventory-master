
/**
 * Gerador de etiquetas em PDF
 */
import { generatePreviewPDF } from './etiqueta/previewGenerator';
import { generateEtiquetaPDF } from './etiqueta/printGenerator';
import type { PreviewPDFOptions, EtiquetaPrintOptions } from './etiqueta/types';

// Exportar as funções e tipos principais
export { 
  generatePreviewPDF,
  generateEtiquetaPDF,
  type PreviewPDFOptions,
  type EtiquetaPrintOptions
};
