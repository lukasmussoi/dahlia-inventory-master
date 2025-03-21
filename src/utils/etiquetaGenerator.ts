
import { jsPDF } from "jspdf";
import { ensureString } from "@/lib/utils";
import { generateBarcode } from "./barcodeUtils";
import type { ModeloEtiqueta } from "@/types/etiqueta";

export async function generatePreviewPDF(
  modelName: string,
  labels: any[],
  pageFormat: string,
  pageSize: { width: number; height: number },
  margins: { top: number; right: number; bottom: number; left: number },
  spacing: { horizontal: number; vertical: number },
  autoAdjust: boolean = false,
  orientation: string = "retrato"
) {
  try {
    // Converter de milímetros para pontos (1mm = 2.83465pt)
    const mmToPt = 2.83465;
    
    // Configurar orientação do documento
    const isLandscape = orientation === "paisagem";
    
    // Converter dimensões para pontos
    const pageWidthPt = pageSize.width * mmToPt;
    const pageHeightPt = pageSize.height * mmToPt;
    
    // Criar uma nova instância do jsPDF com a orientação correta
    const doc = new jsPDF({
      orientation: isLandscape ? "landscape" : "portrait",
      unit: "pt",
      format: [pageWidthPt, pageHeightPt]
    });
    
    // Configurar fonte
    doc.setFont("helvetica");
    
    // Para cada etiqueta no modelo
    for (const label of labels) {
      // Converter dimensões da etiqueta para pontos
      const labelX = label.x * mmToPt;
      const labelY = label.y * mmToPt;
      const labelWidth = label.width * mmToPt;
      const labelHeight = label.height * mmToPt;
      
      // Desenhar borda da etiqueta (linha tracejada)
      doc.setDrawColor(200, 200, 200);
      doc.setLineDashPattern([3], 0);
      doc.rect(labelX, labelY, labelWidth, labelHeight);
      
      // Desenhar os elementos da etiqueta
      for (const element of label.elements) {
        // Converter dimensões do elemento para pontos
        const elementX = (label.x + element.x) * mmToPt;
        const elementY = (label.y + element.y) * mmToPt;
        const elementWidth = element.width * mmToPt;
        const elementHeight = element.height * mmToPt;
        
        // Configurar tamanho da fonte
        doc.setFontSize(element.fontSize * 2.5); // Ajuste para tamanho adequado
        
        // Configurar alinhamento de texto
        let textAlign: "left" | "center" | "right" = "left";
        if (element.align === "center") textAlign = "center";
        if (element.align === "right") textAlign = "right";
        
        // Obter o texto de demonstração para o elemento
        let text = "";
        switch (element.type) {
          case "nome":
            text = "Pingente Cristal";
            break;
          case "codigo":
            text = "123456789";
            break;
          case "preco":
            text = "R$ 99,90";
            break;
          default:
            text = "Elemento";
        }
        
        // Garantir que o valor seja uma string válida
        text = ensureString(text);
        
        // Calcular as posições de texto com base no alinhamento
        const textX = element.align === "center" ? 
          elementX + (elementWidth / 2) : 
          element.align === "right" ? 
            elementX + elementWidth : 
            elementX;
        
        // Calcular a posição Y para centralizar verticalmente o texto
        const textY = elementY + (elementHeight / 2) + (element.fontSize * 0.5);
        
        // Definir estilo de texto e desenhar o texto
        doc.setTextColor(0, 0, 0);
        doc.text(text, textX, textY, { 
          align: textAlign,
          maxWidth: elementWidth
        });
      }
    }
    
    // Adicionar informações no rodapé
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Modelo: ${modelName} - Prévia (${pageSize.width}×${pageSize.height}mm ${orientation})`, 
      pageWidthPt / 2, 
      pageHeightPt - 10, 
      { align: "center" }
    );
    
    // Converter o PDF para uma URL de dados para visualização
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    return pdfUrl;
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    throw error;
  }
}

// Adicionar a função generateEtiquetaPDF
export async function generateEtiquetaPDF(
  modelo: ModeloEtiqueta,
  items: any[],
  options: {
    startRow?: number;
    startColumn?: number;
    copias?: number;
  } = {}
): Promise<string> {
  try {
    const { 
      largura, 
      altura, 
      formatoPagina, 
      orientacao, 
      margemSuperior, 
      margemInferior,
      margemEsquerda, 
      margemDireita, 
      espacamentoHorizontal, 
      espacamentoVertical,
      larguraPagina, 
      alturaPagina,
      campos 
    } = modelo;

    // Configurar orientação do documento
    const isLandscape = orientacao === "paisagem";
    
    // Determinar dimensões da página
    let pageWidth = 210; // A4 padrão
    let pageHeight = 297;
    
    if (formatoPagina === "Personalizado" && larguraPagina && alturaPagina) {
      pageWidth = larguraPagina;
      pageHeight = alturaPagina;
    } else {
      // Definir dimensões com base no formato de página
      switch (formatoPagina) {
        case "A4":
          pageWidth = 210;
          pageHeight = 297;
          break;
        case "A5":
          pageWidth = 148;
          pageHeight = 210;
          break;
        case "Letter":
          pageWidth = 216;
          pageHeight = 279;
          break;
        case "Legal":
          pageWidth = 216;
          pageHeight = 356;
          break;
      }
    }
    
    // Se a orientação for paisagem, inverter largura e altura
    if (isLandscape) {
      [pageWidth, pageHeight] = [pageHeight, pageWidth];
    }
    
    // Criar novo documento PDF
    const doc = new jsPDF({
      orientation: isLandscape ? "landscape" : "portrait",
      unit: "mm",
      format: [pageWidth, pageHeight]
    });
    
    // Calcular quantas etiquetas cabem por página
    const etiquetasPerRow = Math.floor((pageWidth - margemEsquerda - margemDireita) / (largura + espacamentoHorizontal));
    const etiquetasPerColumn = Math.floor((pageHeight - margemSuperior - margemInferior) / (altura + espacamentoVertical));
    
    if (etiquetasPerRow <= 0 || etiquetasPerColumn <= 0) {
      throw new Error("Configurações inválidas: as dimensões da etiqueta e margens não permitem caber pelo menos uma etiqueta na página.");
    }
    
    console.log("Etiquetas por página:", etiquetasPerRow, "x", etiquetasPerColumn);
    
    // Posição inicial
    let currentRow = options.startRow ? options.startRow - 1 : 0;
    let currentColumn = options.startColumn ? options.startColumn - 1 : 0;
    let currentPage = 0;
    
    // Número de cópias
    const copias = options.copias || 1;
    const totalLabels = items.length * copias;
    
    // Gerar códigos de barras para todos os itens uma vez só
    const barcodesPromises = items.map(async (item) => {
      const barcodeText = ensureString(item.barcode || item.sku || item.codigo || "0000000000");
      return { 
        item, 
        barcodeData: await generateBarcode(barcodeText) 
      };
    });
    
    const itemsWithBarcodes = await Promise.all(barcodesPromises);
    
    // Contador para etiquetas processadas
    let processedLabels = 0;
    
    // Para cada item...
    for (let itemIndex = 0; itemIndex < itemsWithBarcodes.length; itemIndex++) {
      const { item, barcodeData } = itemsWithBarcodes[itemIndex];
      
      // Para cada cópia...
      for (let copy = 0; copy < copias; copy++) {
        // Verificar se precisa de nova página
        if (currentRow >= etiquetasPerColumn) {
          currentRow = 0;
          currentColumn++;
        }
        
        if (currentColumn >= etiquetasPerRow) {
          currentColumn = 0;
          doc.addPage();
          currentPage++;
        }
        
        // Calcular posição da etiqueta
        const x = margemEsquerda + currentColumn * (largura + espacamentoHorizontal);
        const y = margemSuperior + currentRow * (altura + espacamentoVertical);
        
        // Desenhar cada elemento na etiqueta
        for (const campo of campos) {
          // Posição do elemento dentro da etiqueta
          const elementX = x + campo.x;
          const elementY = y + campo.y;
          
          // Desenhar o elemento adequado
          switch (campo.tipo) {
            case "nome":
              doc.setFontSize(campo.tamanhoFonte);
              doc.setFont("helvetica", "normal");
              doc.text(
                ensureString(item.name || item.nome || "Sem nome"), 
                elementX, 
                elementY + campo.tamanhoFonte * 0.3
              );
              break;
              
            case "codigo":
              // Desenhar código de barras se disponível
              if (barcodeData) {
                doc.addImage(
                  barcodeData, 
                  "PNG", 
                  elementX, 
                  elementY, 
                  campo.largura, 
                  campo.altura
                );
              } else {
                doc.setFontSize(campo.tamanhoFonte);
                doc.text(
                  ensureString(item.sku || item.codigo || "0000000000"), 
                  elementX, 
                  elementY + campo.tamanhoFonte * 0.3
                );
              }
              break;
              
            case "preco":
              doc.setFontSize(campo.tamanhoFonte);
              doc.setFont("helvetica", "bold");
              const preco = typeof item.price === 'number' ? 
                          item.price.toFixed(2).replace('.', ',') : 
                          (item.preco || '0,00');
              doc.text(
                `R$ ${ensureString(preco)}`, 
                elementX, 
                elementY + campo.tamanhoFonte * 0.3
              );
              break;
          }
        }
        
        currentRow++;
        processedLabels++;
      }
    }
    
    // Gerar URL do arquivo temporário
    const pdfBlob = doc.output("blob");
    return URL.createObjectURL(pdfBlob);
  } catch (error) {
    console.error("Erro ao gerar PDF de etiquetas:", error);
    throw error;
  }
}
