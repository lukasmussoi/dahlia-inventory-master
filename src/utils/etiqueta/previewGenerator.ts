
/**
 * Utilitários para renderização de elementos em PDFs
 */
import { jsPDF } from "jspdf";
import 'jspdf-autotable';
import { getElementPreviewText, isBarcode, formatBarcodeValue } from './elementUtils';
import { formatCurrency } from '@/lib/utils';
import { createPdfDocument, generateBarcode } from './documentUtils';
import type { PreviewPDFOptions } from './types';

/**
 * Gera um PDF de pré-visualização para um modelo de etiqueta
 * 
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

  console.log("Gerando PDF de pré-visualização:", {
    modelName,
    pageFormat,
    pageSize,
    pageMargins,
    labelSpacing,
    autoAdjustDimensions,
    pageOrientation
  });
  
  // Verificar se há etiquetas para incluir
  if (!labels || labels.length === 0) {
    throw new Error("Nenhuma etiqueta fornecida para pré-visualização");
  }
  
  // Verificar se há elementos nas etiquetas
  const emptyLabels = labels.filter(label => !label.elements || label.elements.length === 0);
  if (emptyLabels.length > 0) {
    throw new Error(`A etiqueta "${emptyLabels[0].name}" não possui elementos`);
  }
  
  try {
    // Criar documento PDF com as configurações especificadas
    const doc = createPdfDocument(
      pageFormat, 
      pageOrientation, 
      pageSize.width, 
      pageSize.height
    );
    
    // Desenhar borda da página (para depuração) - comentado para não aparecer no PDF final
    // doc.setDrawColor(200, 200, 200);
    // doc.rect(5, 5, pageSize.width - 10, pageSize.height - 10);
    
    // Removido: Não adicionamos mais título e informações ao documento
    // doc.setFontSize(16);
    // doc.text(`Modelo: ${modelName}`, 10, 10);
    // doc.setFontSize(10);
    // doc.text(`Formato: ${pageFormat} - ${pageOrientation}`, 10, 15);
    // doc.text(`Dimensões: ${pageSize.width}mm x ${pageSize.height}mm`, 10, 20);
    
    // Para cada etiqueta, renderizar no PDF
    labels.forEach((label, index) => {
      // Calcular posição da etiqueta na página - sem offset para título
      const labelX = pageMargins.left + label.x;
      const labelY = pageMargins.top + label.y; // Removido offset de 25mm para o título
      
      // Desenhar borda da etiqueta
      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(0.1);
      doc.rect(labelX, labelY, label.width, label.height);
      
      // Renderizar elementos da etiqueta
      label.elements.forEach(element => {
        // Calcular posição do elemento em relação à etiqueta
        const elementX = labelX + element.x;
        const elementY = labelY + element.y;
        
        // Configurar fonte
        doc.setFontSize(element.fontSize);
        
        // Verificar se é um código de barras
        if (isBarcode(element.type)) {
          // Gerar código de barras
          const code = formatBarcodeValue(getElementPreviewText(element.type));
          generateBarcode(doc, code, elementX, elementY, element.width, element.height);
        } else {
          // Obter texto do elemento
          const text = getElementPreviewText(element.type);
          
          // Ajustar alinhamento
          let alignmentX = elementX;
          if (element.align === 'center') {
            alignmentX = elementX + element.width / 2;
          } else if (element.align === 'right') {
            alignmentX = elementX + element.width;
          }
          
          // Renderizar texto com alinhamento
          doc.text(text, alignmentX, elementY + element.fontSize / 2, {
            align: element.align as any,
            baseline: 'middle'
          });
        }
        
        // Desenhar borda do elemento (para depuração) - comentado para não aparecer no PDF final
        // doc.setDrawColor(200, 200, 200);
        // doc.setLineWidth(0.1);
        // doc.rect(elementX, elementY, element.width, element.height);
      });
      
      // Removido: Não adicionamos mais o nome da etiqueta abaixo dela
      // doc.setFontSize(8);
      // doc.text(label.name, labelX, labelY - 2);
    });
    
    // Converter o PDF para URL de dados (data URL)
    return doc.output('datauristring');
  } catch (error) {
    console.error("Erro ao gerar pré-visualização:", error);
    throw error;
  }
};
