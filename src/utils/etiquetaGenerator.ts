
import { jsPDF } from "jspdf";
import { ensureString } from "@/lib/utils";

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
