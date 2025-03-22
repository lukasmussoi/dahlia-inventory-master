
/**
 * Funções para geração de etiquetas personalizadas
 * Este arquivo serve como um façade para os módulos mais específicos
 */

import { generatePreviewPDF as generatePreview } from './etiqueta/previewGenerator';
import { generatePrintablePDF } from './etiqueta/printGenerator';
import { getElementPreviewText } from './etiqueta/elementUtils';

// Interface para o parâmetro único de generatePreviewPDF
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

// Função de adaptação para manter compatibilidade
export const generatePreviewPDF = (options: PreviewPDFOptions): Promise<string> => {
  return generatePreview(
    options.modelName,
    options.labels,
    options.pageFormat,
    options.pageSize,
    options.pageMargins,
    options.labelSpacing,
    options.autoAdjustDimensions,
    options.pageOrientation
  );
};

// Re-exportar outras funções
export { generatePrintablePDF, getElementPreviewText };
