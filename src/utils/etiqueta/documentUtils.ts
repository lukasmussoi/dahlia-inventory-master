
/**
 * Utilitários para criação e manipulação de documentos PDF
 */
import { jsPDF } from "jspdf";
import JsBarcode from "jsbarcode";

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
