
/**
 * Utilitários para geração de PDFs
 * @file Este arquivo reexporta as funções de geração de PDFs de outros módulos
 */

import { generatePdfLabel } from "./pdf/labelGenerator";
import type { 
  GeneratePdfLabelOptions, 
  PdfGenerationResult, 
  downloadPdfFromDataUrl,
  openPdfInNewTab
} from "./pdf/types";

export { 
  generatePdfLabel, 
  downloadPdfFromDataUrl,
  openPdfInNewTab,
  type GeneratePdfLabelOptions, 
  type PdfGenerationResult 
};
