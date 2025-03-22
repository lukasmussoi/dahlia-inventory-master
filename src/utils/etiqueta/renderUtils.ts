
/**
 * Utilitários para renderização de elementos em PDFs
 */
import JsPDF from 'jspdf';
import type { LabelElement } from '@/components/inventory/labels/editor/types';
import { getElementPreviewText } from './elementUtils';

/**
 * Renderiza os elementos de uma etiqueta no PDF
 * @param pdf Documento PDF
 * @param elements Elementos da etiqueta
 * @param offsetX Deslocamento X
 * @param offsetY Deslocamento Y
 */
export const renderLabelElements = (pdf: JsPDF, elements: LabelElement[], offsetX: number, offsetY: number) => {
  elements.forEach(element => {
    // Definir o tamanho da fonte
    pdf.setFontSize(element.fontSize);

    // Obter dados de exemplo para o elemento
    const text = getElementPreviewText(element.type, {
      name: "Nome do Produto",
      sku: "SKU12345",
      price: 99.90
    });

    // Calcular a posição do texto baseado no alinhamento
    let x = offsetX + element.x;
    let textAlign: 'left' | 'center' | 'right' = 'left';
    
    if (element.align === 'center') {
      x = offsetX + element.x + (element.width / 2);
      textAlign = 'center';
    } else if (element.align === 'right') {
      x = offsetX + element.x + element.width;
      textAlign = 'right';
    }
    
    // Centralizar verticalmente
    const y = offsetY + element.y + (element.height / 2) + (element.fontSize / 4);

    // Desenhar o texto com o alinhamento especificado
    pdf.text(text, x, y, { align: textAlign });
  });
};
