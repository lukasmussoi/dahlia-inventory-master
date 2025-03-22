
/**
 * Utilitários para renderização de elementos em PDFs
 */
import { jsPDF } from "jspdf";
import 'jspdf-autotable';
import { getElementPreviewText } from './elementUtils';
import { formatCurrency } from '@/lib/utils';
import { createPdfDocument, addLabelToPage } from './documentUtils';
import type { PreviewPDFOptions } from './types';

/**
 * Gera um PDF de pré-visualização para um modelo de etiqueta
 * 
 * @param modelName Nome do modelo de etiqueta
 * @param labels Array de etiquetas para incluir no PDF
 * @param pageFormat Formato da página (A4, Letter, etc)
 * @param pageSize Dimensões da página {width, height}
 * @param pageMargins Margens da página {top, bottom, left, right}
 * @param labelSpacing Espaçamento entre etiquetas {horizontal, vertical}
 * @param autoAdjustDimensions Flag para ajuste automático de dimensões
 * @param pageOrientation Orientação da página (retrato, paisagem)
 * @returns Promise com a URL do PDF gerado
 */
export const generatePreviewPDF = async (
  modelName: string,
  labels: any[],
  pageFormat: string,
  pageSize: { width: number; height: number },
  pageMargins: { top: number; bottom: number; left: number; right: number },
  labelSpacing: { horizontal: number; vertical: number },
  autoAdjustDimensions: boolean,
  pageOrientation: string
): Promise<string> => {
  console.log("Gerando PDF com orientação:", pageOrientation);
  const doc = createPdfDocument(pageFormat, pageOrientation, pageSize.width, pageSize.height);

  for (const label of labels) {
    addLabelToPage(doc, label, pageMargins, labelSpacing, getElementPreviewText, formatCurrency);
  }

  // Converter o PDF para URL de dados (data URL)
  const pdfBase64 = doc.output('datauristring');
  return pdfBase64;
};

/**
 * Versão da função com um único parâmetro objeto para maior flexibilidade
 * @param options Opções para geração do PDF
 * @returns Promise com a URL do PDF gerado
 */
export const generatePreview = async (options: PreviewPDFOptions): Promise<string> => {
  const {
    modelName,
    labels,
    pageFormat,
    pageSize,
    pageMargins,
    labelSpacing,
    autoAdjustDimensions = false,
    pageOrientation = 'retrato'
  } = options;

  console.log("generatePreview recebeu orientação:", pageOrientation);
  return generatePreviewPDF(
    modelName,
    labels,
    pageFormat,
    pageSize,
    pageMargins,
    labelSpacing,
    autoAdjustDimensions,
    pageOrientation
  );
};
