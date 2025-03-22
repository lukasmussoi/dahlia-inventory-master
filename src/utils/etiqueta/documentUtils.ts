
/**
 * Utilitários para criação e manipulação de documentos PDF
 */
import JsPDF from 'jspdf';
import { toast } from 'sonner';
import 'jspdf-autotable';
import { ModeloEtiqueta } from '@/types/etiqueta';

/**
 * Cria um documento PDF com as configurações especificadas
 * @param formato Formato da página (A4, Letter, etc)
 * @param orientacao Orientação da página (retrato, paisagem)
 * @param largura Largura da página em mm (para formato personalizado)
 * @param altura Altura da página em mm (para formato personalizado)
 * @returns Documento PDF configurado
 */
export const createPdfDocument = (
  formato: string,
  orientacao: string,
  largura?: number,
  altura?: number
): JsPDF => {
  console.log("Criando documento PDF:", { formato, orientacao, largura, altura });
  
  // Converter orientação para o formato esperado pelo jsPDF
  const orientation = orientacao === 'paisagem' ? 'landscape' : 'portrait';
  
  // Formatos padrão
  if (formato === 'A4' || formato === 'A5' || formato === 'Letter') {
    return new JsPDF({
      orientation,
      unit: 'mm',
      format: formato
    });
  }
  
  // Formato personalizado
  if (formato === 'Personalizado' || formato === 'Custom') {
    if (!largura || !altura) {
      console.error("Dimensões personalizadas não definidas:", { largura, altura });
      throw new Error("Dimensões de página personalizadas não fornecidas");
    }
    
    // Para orientação paisagem, inverter largura e altura
    const width = orientation === 'landscape' ? Math.max(largura, altura) : Math.min(largura, altura);
    const height = orientation === 'landscape' ? Math.min(largura, altura) : Math.max(largura, altura);
    
    return new JsPDF({
      orientation: 'portrait', // Sempre portrait para formato personalizado, controlamos as dimensões manualmente
      unit: 'mm',
      format: [width, height]
    });
  }
  
  // Fallback para A4
  console.warn(`Formato de página desconhecido "${formato}", usando A4 como padrão`);
  return new JsPDF({
    orientation,
    unit: 'mm',
    format: 'a4'
  });
};

/**
 * Calcula as dimensões da página com base no formato e orientação
 */
export const calcularDimensoesPagina = (
  formatoPagina: string,
  orientacao: string,
  larguraPagina?: number,
  alturaPagina?: number
): { pageWidth: number; pageHeight: number } => {
  let pageWidth: number;
  let pageHeight: number;
  
  // Definir dimensões baseadas no formato padrão
  if (formatoPagina === 'A4') {
    pageWidth = 210;
    pageHeight = 297;
  } else if (formatoPagina === 'A5') {
    pageWidth = 148;
    pageHeight = 210;
  } else if (formatoPagina === 'Letter') {
    pageWidth = 216;
    pageHeight = 279;
  } else if (formatoPagina === 'Personalizado' || formatoPagina === 'Custom') {
    // Para formato personalizado, usar dimensões fornecidas
    if (!larguraPagina || !alturaPagina) {
      console.error("Dimensões personalizadas não definidas:", { larguraPagina, alturaPagina });
      throw new Error("Dimensões de página personalizadas não fornecidas");
    }
    pageWidth = larguraPagina;
    pageHeight = alturaPagina;
  } else {
    // Fallback para A4
    console.warn(`Formato de página desconhecido "${formatoPagina}", usando A4 como padrão`);
    pageWidth = 210;
    pageHeight = 297;
  }
  
  // Ajustar para orientação paisagem se necessário
  if (orientacao === 'paisagem') {
    [pageWidth, pageHeight] = [pageHeight, pageWidth];
  }
  
  return { pageWidth, pageHeight };
};

/**
 * Normaliza as margens da página, garantindo valores válidos
 */
export const normalizarMargens = (
  margemSuperior?: number,
  margemInferior?: number,
  margemEsquerda?: number,
  margemDireita?: number
): { superior: number; inferior: number; esquerda: number; direita: number } => {
  return {
    superior: Math.max(0, margemSuperior || 0),
    inferior: Math.max(0, margemInferior || 0),
    esquerda: Math.max(0, margemEsquerda || 0),
    direita: Math.max(0, margemDireita || 0)
  };
};

/**
 * Normaliza os espaçamentos entre etiquetas, garantindo valores válidos
 */
export const normalizarEspacamentos = (
  espacamentoHorizontal?: number,
  espacamentoVertical?: number
): { horizontal: number; vertical: number } => {
  return {
    horizontal: Math.max(0, espacamentoHorizontal || 0),
    vertical: Math.max(0, espacamentoVertical || 0)
  };
};

/**
 * Calcula quantas etiquetas cabem na página
 */
export const calcularEtiquetasPorPagina = (
  larguraPagina: number,
  alturaPagina: number,
  larguraEtiqueta: number,
  alturaEtiqueta: number,
  margens: { superior: number; inferior: number; esquerda: number; direita: number },
  espacamentos: { horizontal: number; vertical: number }
): { etiquetasPorLinha: number; etiquetasPorColuna: number } => {
  // Calcular a área útil da página
  const larguraUtil = larguraPagina - margens.esquerda - margens.direita;
  const alturaUtil = alturaPagina - margens.superior - margens.inferior;
  
  // Calcular quantas etiquetas cabem na largura e altura
  const etiquetasPorLinha = Math.floor(larguraUtil / (larguraEtiqueta + espacamentos.horizontal));
  const etiquetasPorColuna = Math.floor(alturaUtil / (alturaEtiqueta + espacamentos.vertical));
  
  return {
    etiquetasPorLinha: Math.max(1, etiquetasPorLinha),
    etiquetasPorColuna: Math.max(1, etiquetasPorColuna)
  };
};

/**
 * Adiciona uma etiqueta ao documento PDF
 */
export const addLabelToPage = (
  doc: JsPDF,
  label: any,
  pageMargins: { top: number; bottom: number; left: number; right: number },
  labelSpacing: { horizontal: number; vertical: number },
  getElementText: (type: string, item: any) => string,
  formatPrice: (price: number) => string,
  row = 0,
  column = 0
): void => {
  // Calcular a posição da etiqueta na página
  const x = pageMargins.left + column * (label.width + labelSpacing.horizontal);
  const y = pageMargins.top + row * (label.height + labelSpacing.vertical);
  
  // Desenhar borda da etiqueta (opcional, para depuração)
  // doc.setDrawColor(200, 200, 200);
  // doc.rect(x, y, label.width, label.height);
  
  // Renderizar elementos
  label.elements.forEach((element: any) => {
    // Posicionar elemento em relação à etiqueta
    const elementX = x + element.x;
    const elementY = y + element.y;
    
    // Configurar fonte
    doc.setFontSize(element.fontSize);
    
    // Obter texto do elemento
    let text = getElementText(element.type, {});
    
    // Ajustar alinhamento
    let alignmentX = elementX;
    if (element.align === 'center') {
      alignmentX = elementX + element.width / 2;
    } else if (element.align === 'right') {
      alignmentX = elementX + element.width;
    }
    
    // Render text with alignment
    doc.text(text, alignmentX, elementY + element.fontSize / 2, {
      align: element.align as any,
      baseline: 'middle'
    });
  });
};

/**
 * Gera um código de barras no documento PDF
 * @param doc Documento PDF
 * @param code Código a ser gerado
 * @param x Posição X
 * @param y Posição Y
 * @param width Largura
 * @param height Altura
 */
export const generateBarcode = (
  doc: JsPDF,
  code: string,
  x: number,
  y: number,
  width: number,
  height: number
): void => {
  try {
    // Usar o módulo autotable do jsPDF para gerar o código de barras
    // @ts-ignore - o módulo está configurado mas o TS não reconhece a propriedade
    if (doc.barcode) {
      // @ts-ignore
      doc.barcode(code, x, y, {
        width,
        height,
        fontSize: 10,
        textAlign: "center",
        fontName: "courier",
        showText: true,
        codeType: "CODE128"
      });
    } else {
      // Fallback caso o módulo barcode não esteja disponível
      doc.setFontSize(10);
      doc.text(`Código: ${code}`, x, y + height / 2, { baseline: 'middle' });
    }
  } catch (error) {
    console.error("Erro ao gerar código de barras:", error);
    // Exibir texto alternativo se falhar
    doc.setFontSize(10);
    doc.text(`Código: ${code}`, x, y + height / 2, { baseline: 'middle' });
  }
};
