
import { jsPDF } from "jspdf";
import { generateBarcode } from "./barcodeUtils";
import type { ModeloEtiqueta, CampoEtiqueta } from "@/types/etiqueta";

// Função para gerar etiquetas em PDF
export async function generateEtiquetaPDF(
  modelo: ModeloEtiqueta,
  dados: any[],
  options: {
    startRow?: number;
    startColumn?: number;
    copias?: number;
  } = {}
): Promise<string> {
  console.log("Gerando etiqueta com modelo:", modelo);
  console.log("Campos do modelo:", modelo.campos);

  const { startRow = 1, startColumn = 1, copias = 1 } = options;
  
  // Configurações da página
  const orientacao = modelo.orientacao === "retrato" ? "portrait" : "landscape";
  let formato: string | [number, number] = modelo.formatoPagina.toLowerCase();
  
  // Se o formato for personalizado, usar as dimensões especificadas
  if (modelo.formatoPagina === "Personalizado" && modelo.larguraPagina && modelo.alturaPagina) {
    formato = [modelo.larguraPagina, modelo.alturaPagina];
  }
  
  // Criar documento PDF
  const doc = new jsPDF({
    orientation: orientacao as "portrait" | "landscape",
    unit: "mm",
    format: formato,
  });
  
  // Dimensões da página
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Configurações da etiqueta
  const labelWidth = modelo.largura;
  const labelHeight = modelo.altura;
  const marginLeft = modelo.margemEsquerda;
  const marginTop = modelo.margemSuperior;
  const spacingH = modelo.espacamentoHorizontal;
  const spacingV = modelo.espacamentoVertical;
  
  // Calcular quantas etiquetas cabem na página
  const labelsPerRow = Math.floor((pageWidth - marginLeft - modelo.margemDireita) / (labelWidth + spacingH));
  const labelsPerColumn = Math.floor((pageHeight - marginTop - modelo.margemInferior) / (labelHeight + spacingV));
  
  console.log("Configurações de página:", {
    pageWidth, 
    pageHeight,
    labelsPerRow,
    labelsPerColumn,
    labelWidth,
    labelHeight,
    marginLeft,
    marginTop
  });
  
  // Validações
  if (labelsPerRow <= 0 || labelsPerColumn <= 0) {
    throw new Error("Configuração inválida: as dimensões da etiqueta não permitem impressão na página.");
  }
  
  let currentRow = startRow - 1;
  let currentColumn = startColumn - 1;
  
  // Garantir valores válidos
  if (currentRow < 0) currentRow = 0;
  if (currentColumn < 0) currentColumn = 0;
  
  // Para cada item de dados
  for (const item of dados) {
    // Repetir conforme número de cópias
    for (let c = 0; c < copias; c++) {
      // Se chegou ao final da página, adicionar nova página
      if (currentRow >= labelsPerColumn) {
        currentRow = 0;
        currentColumn++;
        
        if (currentColumn >= labelsPerRow) {
          currentColumn = 0;
          doc.addPage();
        }
      }
      
      // Calcular posição da etiqueta na página
      const x = marginLeft + currentColumn * (labelWidth + spacingH);
      const y = marginTop + currentRow * (labelHeight + spacingV);
      
      // Adicionar os elementos conforme definido no modelo
      for (const campo of modelo.campos) {
        await adicionarElemento(doc, campo, item, x, y);
      }
      
      currentRow++;
    }
  }
  
  // Retornar URL do PDF gerado
  const pdfBlob = doc.output("blob");
  return URL.createObjectURL(pdfBlob);
}

// Função para adicionar um elemento na etiqueta
async function adicionarElemento(doc: jsPDF, campo: CampoEtiqueta, item: any, xBase: number, yBase: number): Promise<void> {
  const x = xBase + campo.x;
  const y = yBase + campo.y;
  
  // Configurar fonte e tamanho
  doc.setFontSize(campo.tamanhoFonte);
  const fontStyle = campo.valor?.includes("negrito") ? "bold" : "normal";
  doc.setFont("helvetica", fontStyle);
  
  // Adicionar o elemento conforme seu tipo
  switch (campo.tipo) {
    case "nome":
      doc.text(item.name || "Sem nome", x, y);
      break;
      
    case "codigo":
      try {
        const barcodeText = item.barcode || item.sku || "0000000000";
        const barcodeData = await generateBarcode(barcodeText);
        doc.addImage(barcodeData, "PNG", x, y, campo.largura, campo.altura);
      } catch (error) {
        console.error("Erro ao gerar código de barras:", error);
      }
      break;
      
    case "preco":
      const price = typeof item.price === 'number' ? item.price.toFixed(2) : '0.00';
      const priceText = `R$ ${price}`;
      doc.text(priceText, x, y);
      break;
      
    default:
      // Tipos não reconhecidos são ignorados
      console.warn(`Tipo de campo não reconhecido: ${campo.tipo}`);
  }
}
