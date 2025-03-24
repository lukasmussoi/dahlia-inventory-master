
/**
 * Utilitários para geração de PDFs
 * @file Este arquivo reexporta as funções de geração de PDFs de outros módulos
 */

import { generatePdfLabel } from "./pdf/labelGenerator";
import type { GeneratePdfLabelOptions, PdfGenerationResult } from "./pdf/types";

export { generatePdfLabel, type GeneratePdfLabelOptions, type PdfGenerationResult };
