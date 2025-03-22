
/**
 * Funções para geração de etiquetas personalizadas
 * Este arquivo serve como um façade para os módulos mais específicos
 */

import { generatePreview } from './etiqueta/previewGenerator';
import { generatePrintablePDF } from './etiqueta/printGenerator';
import { getElementPreviewText } from './etiqueta/elementUtils';
import type { PreviewPDFOptions } from './etiqueta/types';

// Função de adaptação para manter compatibilidade com versões anteriores que usam múltiplos parâmetros
export const generatePreviewPDF = (
  options: PreviewPDFOptions | string,
  labels?: any[],
  pageFormat?: string,
  pageSize?: { width: number; height: number },
  pageMargins?: { top: number; bottom: number; left: number; right: number },
  labelSpacing?: { horizontal: number; vertical: number },
  autoAdjustDimensions?: boolean,
  pageOrientation?: string
): Promise<string> => {
  // Verificar se está sendo chamado com o novo formato (objeto único)
  if (typeof options === 'object' && !Array.isArray(options)) {
    return generatePreview(options);
  }

  // Chamada no formato antigo com múltiplos parâmetros
  // Adaptador para compatibilidade com versões anteriores
  return generatePreview({
    modelName: options as string,
    labels: labels || [],
    pageFormat: pageFormat || 'A4',
    pageSize: pageSize || { width: 210, height: 297 },
    pageMargins: pageMargins || { top: 10, bottom: 10, left: 10, right: 10 },
    labelSpacing: labelSpacing || { horizontal: 0, vertical: 0 },
    autoAdjustDimensions: autoAdjustDimensions || false,
    pageOrientation: pageOrientation || 'retrato'
  });
};

// Re-exportar outras funções
export { getElementPreviewText, generatePrintablePDF };

// Re-exportar tipos
export type { PreviewPDFOptions };
