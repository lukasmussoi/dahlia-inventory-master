
/**
 * Funções para geração de etiquetas personalizadas
 * Este arquivo serve como um façade para os módulos mais específicos
 */

import { generatePreviewPDF as generatePreview, generatePreview as generatePreviewObj } from './etiqueta/previewGenerator';
import { generateEtiquetaPDF } from './etiqueta/printGenerator';
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
    return generatePreviewObj(options);
  }

  // Chamada no formato antigo com múltiplos parâmetros
  return generatePreview(
    options as string, // modelName
    labels as any[],
    pageFormat as string,
    pageSize as { width: number; height: number },
    pageMargins as { top: number; bottom: number; left: number; right: number },
    labelSpacing as { horizontal: number; vertical: number },
    autoAdjustDimensions as boolean,
    pageOrientation as string
  );
};

// Re-exportar outras funções
export { getElementPreviewText, generateEtiquetaPDF as generatePrintablePDF };
