
/**
 * Utilitários para criação de documentos PDF
 */
import { jsPDF } from 'jspdf';
import JsBarcode from 'jsbarcode';
import { type Margins, type Spacing } from './types';

/**
 * Cria um novo documento PDF
 * @param formatoPagina Formato da página
 * @param orientacao Orientação da página
 * @param pageWidth Largura da página
 * @param pageHeight Altura da página
 * @returns Documento PDF
 */
export const createPdfDocument = (
  formatoPagina: string,
  orientacao: string,
  pageWidth: number,
  pageHeight: number
): jsPDF => {
  // Para formatos padrão, usar a designação correta
  if (formatoPagina !== 'Personalizado') {
    return new jsPDF({
      orientation: orientacao === 'paisagem' ? 'landscape' : 'portrait',
      unit: 'mm',
      format: formatoPagina.toLowerCase(),
    });
  }
  
  // Para formato personalizado, usar as dimensões fornecidas
  return new jsPDF({
    orientation: orientacao === 'paisagem' ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [pageWidth, pageHeight],
  });
};

/**
 * Calcula as dimensões da página com base no formato e orientação
 * @param formatoPagina Formato da página
 * @param orientacao Orientação da página
 * @param larguraPagina Largura da página personalizada
 * @param alturaPagina Altura da página personalizada
 * @returns Dimensões da página
 */
export const calcularDimensoesPagina = (
  formatoPagina: string,
  orientacao: string,
  larguraPagina?: number,
  alturaPagina?: number
): { pageWidth: number; pageHeight: number } => {
  // Se for formato personalizado, usar dimensões fornecidas
  if (formatoPagina === 'Personalizado') {
    if (!larguraPagina || !alturaPagina) {
      throw new Error('Dimensões da página devem ser fornecidas para formato personalizado');
    }
    
    // Se orientação for paisagem, inverter largura e altura
    if (orientacao === 'paisagem') {
      return {
        pageWidth: Math.max(larguraPagina, alturaPagina),
        pageHeight: Math.min(larguraPagina, alturaPagina),
      };
    }
    
    return {
      pageWidth: larguraPagina,
      pageHeight: alturaPagina,
    };
  }
  
  // Para formatos padrão, usar dimensões conhecidas
  let width: number;
  let height: number;
  
  switch (formatoPagina) {
    case 'A4':
      width = 210;
      height = 297;
      break;
    case 'A5':
      width = 148;
      height = 210;
      break;
    case 'Letter':
      width = 215.9;
      height = 279.4;
      break;
    case 'Legal':
      width = 215.9;
      height = 355.6;
      break;
    default:
      width = 210;
      height = 297; // A4 como padrão
  }
  
  if (orientacao === 'paisagem') {
    return { pageWidth: height, pageHeight: width };
  }
  
  return { pageWidth: width, pageHeight: height };
};

/**
 * Normaliza as margens para garantir valores válidos
 * @param top Margem superior
 * @param bottom Margem inferior
 * @param left Margem esquerda
 * @param right Margem direita
 * @returns Margens normalizadas
 */
export const normalizarMargens = (
  top?: number,
  bottom?: number,
  left?: number,
  right?: number
): Margins => {
  return {
    superior: top && top >= 0 ? top : 10,
    inferior: bottom && bottom >= 0 ? bottom : 10,
    esquerda: left && left >= 0 ? left : 10,
    direita: right && right >= 0 ? right : 10,
  };
};

/**
 * Normaliza os espaçamentos para garantir valores válidos
 * @param horizontal Espaçamento horizontal
 * @param vertical Espaçamento vertical
 * @returns Espaçamentos normalizados
 */
export const normalizarEspacamentos = (
  horizontal?: number,
  vertical?: number
): Spacing => {
  return {
    horizontal: horizontal && horizontal >= 0 ? horizontal : 2,
    vertical: vertical && vertical >= 0 ? vertical : 2,
  };
};

/**
 * Calcula quantas etiquetas cabem na página com base nas dimensões e margens
 * @param pageWidth Largura da página
 * @param pageHeight Altura da página
 * @param labelWidth Largura da etiqueta
 * @param labelHeight Altura da etiqueta
 * @param margins Margens
 * @param spacing Espaçamentos
 * @returns Quantidade de etiquetas por linha e coluna
 */
export const calcularEtiquetasPorPagina = (
  pageWidth: number,
  pageHeight: number,
  labelWidth: number,
  labelHeight: number,
  margins: Margins,
  spacing: Spacing
): { etiquetasPorLinha: number, etiquetasPorColuna: number } => {
  // Área útil da página (descontando margens)
  const areaUtilLargura = pageWidth - margins.esquerda - margins.direita;
  const areaUtilAltura = pageHeight - margins.superior - margins.inferior;
  
  // Calcular quantas etiquetas cabem na horizontal
  const etiquetasPorLinha = Math.floor(
    (areaUtilLargura + spacing.horizontal) / (labelWidth + spacing.horizontal)
  );
  
  // Calcular quantas etiquetas cabem na vertical
  const etiquetasPorColuna = Math.floor(
    (areaUtilAltura + spacing.vertical) / (labelHeight + spacing.vertical)
  );
  
  return {
    etiquetasPorLinha: Math.max(1, etiquetasPorLinha),
    etiquetasPorColuna: Math.max(1, etiquetasPorColuna),
  };
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
  doc: jsPDF,
  code: string,
  x: number,
  y: number,
  width: number,
  height: number
): void => {
  try {
    // Criar um canvas temporário para gerar o código de barras
    const canvas = document.createElement('canvas');
    
    // Gerar o código de barras no canvas
    JsBarcode(canvas, code, {
      format: "CODE128",
      width: 1,
      height: 20,
      displayValue: false, // Não mostrar o valor numérico abaixo das barras
      fontSize: 0, // Tamanho de fonte zero para garantir que não seja exibido
      textMargin: 0, // Sem margem para texto
      margin: 0, // Sem margem
      background: "#ffffff",
      lineColor: "#000000"
    });
    
    // Obter a imagem do código de barras
    const imageData = canvas.toDataURL('image/png');
    
    // Adicionar a imagem ao PDF
    if (imageData) {
      doc.addImage(
        imageData,
        'PNG',
        x,
        y,
        width,
        height
      );
    }
  } catch (error) {
    console.error("Erro ao gerar código de barras:", error);
  }
};
