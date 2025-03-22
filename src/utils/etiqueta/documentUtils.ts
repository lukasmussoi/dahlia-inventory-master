
/**
 * Funções utilitárias para manipulação de documentos e PDFs
 */
import { jsPDF } from "jspdf";

/**
 * Cria um documento PDF com as configurações especificadas
 */
export const createPdfDocument = (
  pageFormat: string = "A4",
  pageOrientation: string = "retrato",
  customWidth?: number,
  customHeight?: number
): jsPDF => {
  // Converter orientação para o formato esperado pelo jsPDF
  const orientation = pageOrientation === "paisagem" ? "landscape" : "portrait";
  
  // Para formato personalizado, criar com dimensões específicas
  if (pageFormat === "Custom" || pageFormat === "Personalizado") {
    return new jsPDF({
      orientation: orientation,
      unit: "mm",
      format: [customWidth || 210, customHeight || 297]
    });
  }
  
  // Para formatos padrão, usar o nome do formato
  let format = "a4";
  if (pageFormat === "A5") format = "a5";
  else if (pageFormat === "Letter" || pageFormat === "Carta") format = "letter";
  
  return new jsPDF({
    orientation: orientation,
    unit: "mm",
    format: format
  });
};

/**
 * Adiciona uma etiqueta ao documento PDF
 */
export const addLabelToPage = (
  doc: jsPDF,
  label: any,
  pageMargins: { top: number; bottom: number; left: number; right: number },
  labelSpacing: { horizontal: number; vertical: number },
  formatElementText: (element: any, item: any) => string,
  formatCurrency: (value: number) => string
): void => {
  // Verificar se há elementos para renderizar
  if (!label.elements || !Array.isArray(label.elements) || label.elements.length === 0) {
    console.warn("Etiqueta sem elementos para renderizar");
    return;
  }
  
  // Obter posição e dimensões da etiqueta
  const { x = 0, y = 0, width, height } = label;
  
  // Calcular posição base da etiqueta na página
  const baseX = pageMargins.left + x;
  const baseY = pageMargins.top + y;
  
  // Desenhar borda da etiqueta (opcional, pode ser comentado para produção)
  doc.setDrawColor(200, 200, 200);
  doc.rect(baseX, baseY, width, height);
  
  // Renderizar elementos
  label.elements.forEach((element: any) => {
    // Verificar se elemento é válido
    if (!element || !element.type) return;
    
    // Configurar fonte e tamanho
    doc.setFontSize(element.fontSize || 10);
    
    // Determinar alinhamento
    const align = element.align || "left";
    
    // Calcular posição absoluta do elemento
    const elementX = baseX + element.x;
    const elementY = baseY + element.y;
    
    // Obter texto do elemento para preview
    const text = formatElementText(element, {
      name: "Nome do Produto",
      price: 99.99,
      code: "ABC123"
    });
    
    // Renderizar texto do elemento
    doc.text(text, elementX, elementY, { 
      align: align as any
    });
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
  
  // Determinar dimensões base pelo formato
  if (formatoPagina === "A4") {
    pageWidth = 210;
    pageHeight = 297;
  } else if (formatoPagina === "A5") {
    pageWidth = 148;
    pageHeight = 210;
  } else if (formatoPagina === "Letter" || formatoPagina === "Carta") {
    pageWidth = 216;
    pageHeight = 279;
  } else if (formatoPagina === "Custom" || formatoPagina === "Personalizado") {
    pageWidth = larguraPagina || 210;
    pageHeight = alturaPagina || 297;
  } else {
    // Formato padrão como fallback
    pageWidth = 210;
    pageHeight = 297;
  }
  
  // Ajustar para orientação
  if (orientacao === "paisagem") {
    [pageWidth, pageHeight] = [pageHeight, pageWidth];
  }
  
  return { pageWidth, pageHeight };
};

/**
 * Normaliza as margens de página, garantindo valores válidos
 */
export const normalizarMargens = (
  margemSuperior?: number,
  margemInferior?: number,
  margemEsquerda?: number,
  margemDireita?: number
): { superior: number; inferior: number; esquerda: number; direita: number } => {
  // Garantir valores positivos ou usar padrões seguros
  return {
    superior: (margemSuperior !== undefined && margemSuperior >= 0) ? margemSuperior : 10,
    inferior: (margemInferior !== undefined && margemInferior >= 0) ? margemInferior : 10,
    esquerda: (margemEsquerda !== undefined && margemEsquerda >= 0) ? margemEsquerda : 10,
    direita: (margemDireita !== undefined && margemDireita >= 0) ? margemDireita : 10
  };
};

/**
 * Normaliza os espaçamentos entre etiquetas, garantindo valores válidos
 */
export const normalizarEspacamentos = (
  espacamentoHorizontal?: number,
  espacamentoVertical?: number
): { horizontal: number; vertical: number } => {
  // Garantir valores positivos ou usar padrões seguros
  return {
    horizontal: (espacamentoHorizontal !== undefined && espacamentoHorizontal >= 0) ? espacamentoHorizontal : 2,
    vertical: (espacamentoVertical !== undefined && espacamentoVertical >= 0) ? espacamentoVertical : 2
  };
};

/**
 * Calcula quantas etiquetas cabem na página com as configurações fornecidas
 */
export const calcularEtiquetasPorPagina = (
  larguraPagina: number,
  alturaPagina: number,
  larguraEtiqueta: number,
  alturaEtiqueta: number,
  margens: { superior: number; inferior: number; esquerda: number; direita: number },
  espacamento: { horizontal: number; vertical: number }
): { etiquetasPorLinha: number; etiquetasPorColuna: number } => {
  // Calcular área útil da página
  const larguraUtil = larguraPagina - margens.esquerda - margens.direita;
  const alturaUtil = alturaPagina - margens.superior - margens.inferior;
  
  // Calcular quantas etiquetas cabem em cada dimensão, considerando o espaçamento
  const etiquetasPorLinha = Math.floor((larguraUtil + espacamento.horizontal) / (larguraEtiqueta + espacamento.horizontal));
  const etiquetasPorColuna = Math.floor((alturaUtil + espacamento.vertical) / (alturaEtiqueta + espacamento.vertical));
  
  return {
    etiquetasPorLinha: Math.max(1, etiquetasPorLinha),
    etiquetasPorColuna: Math.max(1, etiquetasPorColuna)
  };
};
