
/**
 * Utilitários para configuração de documentos PDF de etiquetas
 */
import JsPDF from 'jspdf';
import type { ModeloEtiqueta } from '@/types/etiqueta';

/**
 * Calcula as dimensões da página com base no formato e orientação
 * @param formatoPagina Formato da página (A4, A5, Letter, Personalizado)
 * @param orientacao Orientação da página (retrato ou paisagem)
 * @param larguraPagina Largura personalizada (opcional)
 * @param alturaPagina Altura personalizada (opcional)
 * @returns Dimensões da página (largura e altura)
 */
export const calcularDimensoesPagina = (
  formatoPagina: string,
  orientacao: string,
  larguraPagina?: number,
  alturaPagina?: number
): { pageWidth: number, pageHeight: number } => {
  let pageWidth, pageHeight;
  
  if (formatoPagina === "Personalizado" && larguraPagina && alturaPagina) {
    pageWidth = larguraPagina;
    pageHeight = alturaPagina;
  } else {
    // Tamanhos padrão (em mm)
    if (formatoPagina === "A4") {
      pageWidth = 210;
      pageHeight = 297;
    } else if (formatoPagina === "A5") {
      pageWidth = 148;
      pageHeight = 210;
    } else if (formatoPagina === "Letter") {
      pageWidth = 216;
      pageHeight = 279;
    } else {
      // Formato padrão (A4 retrato)
      pageWidth = 210;
      pageHeight = 297;
    }
    
    // Inverter dimensões se orientação for paisagem
    if (orientacao === "paisagem") {
      [pageWidth, pageHeight] = [pageHeight, pageWidth];
    }
  }
  
  // Verificar e corrigir dimensões inválidas
  if (!pageWidth || pageWidth <= 0) pageWidth = 210;
  if (!pageHeight || pageHeight <= 0) pageHeight = 297;
  
  return { pageWidth, pageHeight };
};

/**
 * Calcula quantas etiquetas cabem em uma página
 * @param pageWidth Largura da página
 * @param pageHeight Altura da página
 * @param etiquetaLargura Largura da etiqueta
 * @param etiquetaAltura Altura da etiqueta
 * @param margens Margens da página
 * @param espacamentos Espaçamentos entre etiquetas
 * @returns Número de etiquetas por linha e coluna
 */
export const calcularEtiquetasPorPagina = (
  pageWidth: number,
  pageHeight: number,
  etiquetaLargura: number,
  etiquetaAltura: number,
  margens: { superior: number, inferior: number, esquerda: number, direita: number },
  espacamentos: { horizontal: number, vertical: number }
): { etiquetasPorLinha: number, etiquetasPorColuna: number } => {
  const labelsPerRow = Math.floor(
    (pageWidth - margens.esquerda - margens.direita + espacamentos.horizontal) / 
    (etiquetaLargura + espacamentos.horizontal)
  );
  
  const labelsPerColumn = Math.floor(
    (pageHeight - margens.superior - margens.inferior + espacamentos.vertical) / 
    (etiquetaAltura + espacamentos.vertical)
  );
  
  // Verificar se os cálculos resultaram em valores válidos
  const etiquetasPorLinha = labelsPerRow > 0 ? labelsPerRow : 1;
  const etiquetasPorColuna = labelsPerColumn > 0 ? labelsPerColumn : 1;
  
  return { etiquetasPorLinha, etiquetasPorColuna };
};

/**
 * Cria um novo documento PDF com as configurações corretas
 * @param orientacao Orientação do documento (retrato ou paisagem)
 * @param formatoPagina Formato da página
 * @param dimensoes Dimensões da página se formato for personalizado
 * @returns Documento PDF configurado
 */
export const criarDocumentoPDF = (
  orientacao: string,
  formatoPagina: string,
  dimensoes?: { width: number, height: number }
): JsPDF => {
  return new JsPDF({
    orientation: orientacao === "paisagem" ? "landscape" : "portrait",
    unit: "mm",
    format: formatoPagina === "Personalizado" && dimensoes ? 
      [dimensoes.width, dimensoes.height] : formatoPagina
  });
};

/**
 * Valida e normaliza as margens
 * @param margemSuperior Margem superior
 * @param margemInferior Margem inferior
 * @param margemEsquerda Margem esquerda
 * @param margemDireita Margem direita
 * @returns Margens normalizadas
 */
export const normalizarMargens = (
  margemSuperior?: number,
  margemInferior?: number,
  margemEsquerda?: number,
  margemDireita?: number
): { superior: number, inferior: number, esquerda: number, direita: number } => {
  return {
    superior: margemSuperior >= 0 ? margemSuperior : 10,
    inferior: margemInferior >= 0 ? margemInferior : 10,
    esquerda: margemEsquerda >= 0 ? margemEsquerda : 10,
    direita: margemDireita >= 0 ? margemDireita : 10
  };
};

/**
 * Valida e normaliza os espaçamentos
 * @param espacamentoHorizontal Espaçamento horizontal
 * @param espacamentoVertical Espaçamento vertical
 * @returns Espaçamentos normalizados
 */
export const normalizarEspacamentos = (
  espacamentoHorizontal?: number,
  espacamentoVertical?: number
): { horizontal: number, vertical: number } => {
  return {
    horizontal: espacamentoHorizontal >= 0 ? espacamentoHorizontal : 0,
    vertical: espacamentoVertical >= 0 ? espacamentoVertical : 0
  };
};

