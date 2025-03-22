
/**
 * Utilitários para criação e manipulação de documentos PDF
 */
import { jsPDF } from "jspdf";
import JsBarcode from "jsbarcode";

/**
 * Interface para representar margens de página
 */
interface Margens {
  superior: number;
  inferior: number;
  esquerda: number;
  direita: number;
}

/**
 * Interface para representar espaçamentos entre etiquetas
 */
interface Espacamentos {
  horizontal: number;
  vertical: number;
}

/**
 * Cria um documento PDF com as configurações especificadas
 * 
 * @param pageFormat Formato da página ("A4", "A5", "Carta", "Personalizado")
 * @param pageOrientation Orientação da página ("retrato" ou "paisagem")
 * @param pageWidth Largura da página em mm (usado quando o formato é "Personalizado")
 * @param pageHeight Altura da página em mm (usado quando o formato é "Personalizado")
 * @returns Instância do jsPDF configurada
 */
export const createPdfDocument = (
  pageFormat: string,
  pageOrientation: string,
  pageWidth: number,
  pageHeight: number
): jsPDF => {
  console.log(`Criando documento PDF com formato ${pageFormat}, orientação ${pageOrientation}`);
  console.log(`Dimensões da página: ${pageWidth}mm x ${pageHeight}mm`);
  
  // Converter a orientação para o formato usado pela biblioteca
  const orientation = pageOrientation === "paisagem" ? "landscape" : "portrait";
  
  // Determinar dimensões da página de acordo com a orientação
  let docWidth = pageWidth;
  let docHeight = pageHeight;
  
  // Logging para debug
  console.log(`Orientação solicitada: ${pageOrientation} (${orientation})`);
  
  // No modo paisagem, invertemos largura e altura para o documento
  if (orientation === 'landscape') {
    console.log("Aplicando modo paisagem: invertendo dimensões");
    [docWidth, docHeight] = [docHeight, docWidth];
  }
  
  // Criar o documento usando o formato correto
  let doc: jsPDF;
  
  if (pageFormat === "Personalizado" || pageFormat === "Custom") {
    console.log(`Criando documento com dimensões personalizadas: ${docWidth}mm x ${docHeight}mm`);
    doc = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: [docWidth, docHeight]
    });
  } else {
    // Para formatos padrão como A4, A5, etc.
    console.log(`Criando documento com formato padrão: ${pageFormat.toLowerCase()}`);
    doc = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: pageFormat.toLowerCase()
    });
  }
  
  // Verificar as dimensões finais do documento
  const finalWidth = doc.internal.pageSize.getWidth();
  const finalHeight = doc.internal.pageSize.getHeight();
  console.log(`Documento criado com dimensões: ${finalWidth}mm x ${finalHeight}mm`);
  console.log(`Orientação resultante: ${doc.getPageInfo(1).pageContext.pageOrientation}`);
  
  return doc;
};

/**
 * Gera um código de barras no documento PDF
 * 
 * @param doc Documento PDF
 * @param code Código a ser gerado
 * @param x Posição X no documento
 * @param y Posição Y no documento
 * @param width Largura do código de barras
 * @param height Altura do código de barras
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
    // Criar um canvas temporário para o código de barras
    console.log(`Gerando código de barras: ${code}`);
    const canvas = document.createElement('canvas');
    
    // Configurar o JsBarcode para gerar o código de barras no canvas
    JsBarcode(canvas, code, {
      format: "CODE128",
      width: 1,
      height: height - 10, // Altura ajustada para caber o texto
      displayValue: true,
      fontSize: 8,
      margin: 0
    });
    
    // Converter o canvas para uma imagem base64
    const imgData = canvas.toDataURL('image/png');
    
    // Adicionar a imagem ao PDF
    doc.addImage(imgData, 'PNG', x, y, width, height);
    
    console.log(`Código de barras gerado com sucesso na posição (${x}, ${y})`);
  } catch (error) {
    console.error("Erro ao gerar código de barras:", error);
    // Em caso de erro, adicionamos apenas o texto do código
    doc.text(code, x + width / 2, y + height / 2, { align: 'center' });
  }
};

/**
 * Calcula dimensões da página baseado no formato e orientação
 * 
 * @param formatoPagina Formato da página
 * @param orientacao Orientação da página
 * @param larguraPersonalizada Largura personalizada (se formatoPagina for "Personalizado")
 * @param alturaPersonalizada Altura personalizada (se formatoPagina for "Personalizado")
 * @returns Objeto com largura e altura da página
 */
export const calcularDimensoesPagina = (
  formatoPagina: string,
  orientacao: string,
  larguraPersonalizada: number = 0,
  alturaPersonalizada: number = 0
): { pageWidth: number; pageHeight: number } => {
  console.log(`Calculando dimensões da página: formato=${formatoPagina}, orientação=${orientacao}`);
  
  let pageWidth: number;
  let pageHeight: number;
  
  // Definir dimensões baseadas no formato da página
  switch (formatoPagina.toLowerCase()) {
    case 'a4':
      pageWidth = 210;
      pageHeight = 297;
      break;
    case 'a5':
      pageWidth = 148;
      pageHeight = 210;
      break;
    case 'carta':
    case 'letter':
      pageWidth = 216;
      pageHeight = 279;
      break;
    case 'personalizado':
    case 'custom':
      if (larguraPersonalizada <= 0 || alturaPersonalizada <= 0) {
        console.warn("Dimensões personalizadas inválidas, usando padrão A4");
        pageWidth = 210;
        pageHeight = 297;
      } else {
        pageWidth = larguraPersonalizada;
        pageHeight = alturaPersonalizada;
      }
      break;
    default:
      console.warn(`Formato de página desconhecido: ${formatoPagina}, usando padrão A4`);
      pageWidth = 210;
      pageHeight = 297;
  }
  
  // Para paisagem, não invertemos as dimensões aqui - isso é feito na criação do documento
  // Este método apenas calcula as dimensões lógicas da página
  
  console.log(`Dimensões calculadas: ${pageWidth}mm x ${pageHeight}mm`);
  return { pageWidth, pageHeight };
};

/**
 * Normaliza as margens da página, garantindo valores válidos
 * 
 * @param margemSuperior Margem superior
 * @param margemInferior Margem inferior
 * @param margemEsquerda Margem esquerda
 * @param margemDireita Margem direita
 * @returns Objeto com as margens normalizadas
 */
export const normalizarMargens = (
  margemSuperior: number,
  margemInferior: number,
  margemEsquerda: number,
  margemDireita: number
): Margens => {
  // Garantir que margens sejam valores válidos (não negativos)
  return {
    superior: margemSuperior >= 0 ? margemSuperior : 0,
    inferior: margemInferior >= 0 ? margemInferior : 0,
    esquerda: margemEsquerda >= 0 ? margemEsquerda : 0,
    direita: margemDireita >= 0 ? margemDireita : 0
  };
};

/**
 * Normaliza os espaçamentos entre etiquetas, garantindo valores válidos
 * 
 * @param espacamentoHorizontal Espaçamento horizontal entre etiquetas
 * @param espacamentoVertical Espaçamento vertical entre etiquetas
 * @returns Objeto com os espaçamentos normalizados
 */
export const normalizarEspacamentos = (
  espacamentoHorizontal: number,
  espacamentoVertical: number
): Espacamentos => {
  // Garantir que espaçamentos sejam valores válidos (não negativos)
  return {
    horizontal: espacamentoHorizontal >= 0 ? espacamentoHorizontal : 0,
    vertical: espacamentoVertical >= 0 ? espacamentoVertical : 0
  };
};

/**
 * Calcula quantas etiquetas cabem na página baseado nas dimensões e margens
 * 
 * @param pageWidth Largura da página
 * @param pageHeight Altura da página
 * @param etiquetaLargura Largura da etiqueta
 * @param etiquetaAltura Altura da etiqueta
 * @param margens Margens da página
 * @param espacamentos Espaçamentos entre etiquetas
 * @returns Objeto com número de etiquetas por linha e por coluna
 */
export const calcularEtiquetasPorPagina = (
  pageWidth: number,
  pageHeight: number,
  etiquetaLargura: number,
  etiquetaAltura: number,
  margens: Margens,
  espacamentos: Espacamentos
): { etiquetasPorLinha: number; etiquetasPorColuna: number } => {
  console.log("Calculando etiquetas por página com dimensões:", {
    pageWidth, pageHeight, etiquetaLargura, etiquetaAltura
  });
  
  // Calcular área útil da página
  const areaUtilLargura = pageWidth - margens.esquerda - margens.direita;
  const areaUtilAltura = pageHeight - margens.superior - margens.inferior;
  
  console.log(`Área útil da página: ${areaUtilLargura}mm x ${areaUtilAltura}mm`);
  
  // Calcular quantas etiquetas cabem em cada dimensão
  // Ao adicionar uma etiqueta, precisamos considerar seu próprio tamanho mais o espaçamento
  let etiquetasPorLinha = Math.floor((areaUtilLargura + espacamentos.horizontal) / (etiquetaLargura + espacamentos.horizontal));
  let etiquetasPorColuna = Math.floor((areaUtilAltura + espacamentos.vertical) / (etiquetaAltura + espacamentos.vertical));
  
  // Garantir que temos pelo menos uma etiqueta em cada dimensão
  etiquetasPorLinha = Math.max(1, etiquetasPorLinha);
  etiquetasPorColuna = Math.max(1, etiquetasPorColuna);
  
  console.log(`Etiquetas por página: ${etiquetasPorLinha} x ${etiquetasPorColuna} = ${etiquetasPorLinha * etiquetasPorColuna} etiquetas no total`);
  
  return { etiquetasPorLinha, etiquetasPorColuna };
};
