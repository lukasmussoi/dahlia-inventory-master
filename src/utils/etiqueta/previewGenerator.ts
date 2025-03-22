
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
    pageOrientation = 'retrato',
    gridSize
  } = options;

  console.log("Gerando PDF de pré-visualização:", {
    modelName,
    pageFormat,
    pageOrientation,
    pageSize: `${pageSize.width}x${pageSize.height}`,
    pageMargins: `top:${pageMargins.top}, bottom:${pageMargins.bottom}, left:${pageMargins.left}, right:${pageMargins.right}`,
    labelSpacing: `h:${labelSpacing.horizontal}, v:${labelSpacing.vertical}`,
    autoAdjustDimensions,
    gridSize,
    labelCount: labels.length
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
    // Ajustar orientação de página para o formato usado pela biblioteca
    const orientation = pageOrientation === 'paisagem' ? 'landscape' : 'portrait';
    console.log(`Criando documento com orientação: ${orientation}`);
    
    // Determinar dimensões da página de acordo com a orientação
    let docWidth = pageSize.width;
    let docHeight = pageSize.height;
    
    // No modo paisagem, invertemos largura e altura para o documento
    if (orientation === 'landscape') {
      console.log("Invertendo dimensões da página para modo paisagem");
      [docWidth, docHeight] = [docHeight, docWidth];
    }
    
    console.log(`Dimensões finais do documento: ${docWidth}mm x ${docHeight}mm`);
    
    // Criar documento PDF com as configurações especificadas
    const doc = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: pageFormat !== "Personalizado" ? pageFormat.toLowerCase() : [docWidth, docHeight]
    });
    
    // Verificar se o documento foi criado com a orientação correta
    console.log(`Orientação do documento criado: ${doc.getPageInfo(1).pageContext.pageOrientation}`);
    console.log(`Dimensões da página criada: ${doc.internal.pageSize.getWidth()}mm x ${doc.internal.pageSize.getHeight()}mm`);
    
    // Para cada etiqueta, renderizar no PDF
    labels.forEach((label, index) => {
      // Calcular posição da etiqueta na página - sem offset para título
      const labelX = pageMargins.left + label.x;
      const labelY = pageMargins.top + label.y;
      
      console.log(`Renderizando etiqueta ${index+1} na posição (${labelX}, ${labelY})`);
      
      // Desenhar borda da etiqueta
      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(0.1);
      doc.rect(labelX, labelY, label.width, label.height);
      
      // Renderizar elementos da etiqueta
      label.elements.forEach(element => {
        // Calcular posição do elemento em relação à etiqueta
        const elementX = labelX + element.x;
        const elementY = labelY + element.y;
        
        console.log(`Renderizando elemento ${element.type} na posição (${elementX}, ${elementY})`);
        
        // Configurar fonte
        doc.setFontSize(element.fontSize);
        
        // Verificar se é um código de barras
        if (isBarcode(element.type)) {
          // Gerar código de barras
          const code = formatBarcodeValue(getElementPreviewText(element.type));
          generateBarcode(doc, code, elementX, elementY, element.width, element.height);
        } else {
          // Obter texto do elemento
          let text = getElementPreviewText(element.type);
          
          // Se for preço, formatar como moeda
          if (element.type === 'preco') {
            text = formatCurrency(99.90);
          }
          
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
      });
    });
    
    // Converter o PDF para URL de dados (data URL)
    const pdfUrl = doc.output('datauristring');
    console.log("PDF gerado com sucesso");
    return pdfUrl;
  } catch (error) {
    console.error("Erro ao gerar pré-visualização:", error);
    throw error;
  }
};
