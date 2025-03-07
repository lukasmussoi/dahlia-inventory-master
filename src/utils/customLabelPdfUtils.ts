
import { jsPDF } from "jspdf";
import { CustomLabel } from "@/models/labelModel";
import { generateBarcode } from "./barcodeUtils";

/**
 * Gera um PDF a partir de uma etiqueta customizada
 * @param label Etiqueta customizada
 * @returns URL do PDF gerado
 */
export const generatePdfFromCustomLabel = async (label: CustomLabel): Promise<string> => {
  console.log("Gerando PDF a partir de etiqueta customizada:", label);
  
  // Configurar orientação da página
  const orientation = label.orientacao === "landscape" ? "landscape" : "portrait";
  
  // Criar documento PDF
  const doc = new jsPDF({
    orientation,
    unit: "mm",
    format: label.formato_pagina === "custom" ? 
      [label.largura_pagina || 210, label.altura_pagina || 297] : 
      label.formato_pagina
  });
  
  // Obter dimensões da página
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Calcular quantas etiquetas cabem por página
  const etiquetasHorizontal = Math.floor(
    (pageWidth - label.margem_esquerda - label.margem_direita) / 
    (label.largura + label.espacamento_horizontal)
  );
  
  const etiquetasVertical = Math.floor(
    (pageHeight - label.margem_superior - label.margem_inferior) / 
    (label.altura + label.espacamento_vertical)
  );
  
  console.log(`Cabe ${etiquetasHorizontal} etiquetas na horizontal e ${etiquetasVertical} na vertical`);
  
  // Item de exemplo para visualização
  const mockItem = {
    name: "Produto de Exemplo",
    sku: "SKU12345",
    barcode: "7894561230123",
    price: 99.9
  };
  
  // Desenhar grade de etiquetas
  for (let linha = 0; linha < etiquetasVertical; linha++) {
    for (let coluna = 0; coluna < etiquetasHorizontal; coluna++) {
      const x = label.margem_esquerda + coluna * (label.largura + label.espacamento_horizontal);
      const y = label.margem_superior + linha * (label.altura + label.espacamento_vertical);
      
      // Desenhar contorno da etiqueta (opcional, para visualização)
      doc.setDrawColor(200, 200, 200);
      doc.rect(x, y, label.largura, label.altura);
      
      // Adicionar elementos conforme campos da etiqueta
      if (label.campos && Array.isArray(label.campos)) {
        for (const campo of label.campos) {
          if (campo.type === "text") {
            doc.setFont(campo.fontFamily || "helvetica", campo.fontWeight || "normal");
            doc.setFontSize(campo.fontSize || 10);
            doc.setTextColor(campo.fill || "#000000");
            
            // Substituir texto de exemplo com o nome do produto
            const texto = campo.text === "Nome do Produto" ? mockItem.name : campo.text;
            
            const textAlign = campo.textAlign === "center" ? "center" : 
                              campo.textAlign === "right" ? "right" : "left";
                              
            doc.text(
              texto, 
              x + campo.left + (campo.width / 2), 
              y + campo.top + (campo.fontSize / 2), 
              { 
                align: textAlign,
                maxWidth: campo.width 
              }
            );
          } 
          else if (campo.type === "barcode") {
            try {
              // Gerar código de barras
              const barcodeData = await generateBarcode(mockItem.barcode);
              
              // Ajustar as dimensões
              const barcodeWidth = campo.width;
              const barcodeHeight = campo.height;
              
              // Adicionar imagem do código de barras
              doc.addImage(
                barcodeData, 
                "PNG", 
                x + campo.left, 
                y + campo.top, 
                barcodeWidth, 
                barcodeHeight
              );
            } catch (error) {
              console.error("Erro ao gerar código de barras:", error);
            }
          } 
          else if (campo.type === "price") {
            doc.setFont(campo.fontFamily || "helvetica", campo.fontWeight || "bold");
            doc.setFontSize(campo.fontSize || 12);
            doc.setTextColor(campo.fill || "#000000");
            
            // Formatar preço
            const preco = `R$ ${mockItem.price.toFixed(2).replace(".", ",")}`;
            
            const textAlign = campo.textAlign === "center" ? "center" : 
                              campo.textAlign === "right" ? "right" : "left";
                              
            doc.text(
              preco, 
              x + campo.left + (campo.width / 2), 
              y + campo.top + (campo.fontSize / 2), 
              { 
                align: textAlign,
                maxWidth: campo.width 
              }
            );
          } 
          else if (campo.type === "sku") {
            doc.setFont(campo.fontFamily || "helvetica", campo.fontWeight || "normal");
            doc.setFontSize(campo.fontSize || 8);
            doc.setTextColor(campo.fill || "#666666");
            
            const textAlign = campo.textAlign === "center" ? "center" : 
                              campo.textAlign === "right" ? "right" : "left";
                              
            doc.text(
              mockItem.sku, 
              x + campo.left + (campo.width / 2), 
              y + campo.top + (campo.fontSize / 2), 
              { 
                align: textAlign,
                maxWidth: campo.width 
              }
            );
          }
        }
      }
    }
  }
  
  // Gerar URL do arquivo PDF
  const pdfBlob = doc.output("blob");
  return URL.createObjectURL(pdfBlob);
};

/**
 * Gera um arquivo de comandos PPLA para a impressora Argox
 * @param label Etiqueta customizada
 * @param item Item do inventário
 * @returns String com comandos PPLA
 */
export const generatePpla = (label: CustomLabel, item: any): string => {
  console.log("Gerando comandos PPLA para etiqueta:", label);
  
  // Início do comando PPLA
  let command = "Q50,24\n"; // Define tamanho da etiqueta
  command += "q400\n"; // Define velocidade de impressão
  command += "D8\n"; // Define densidade de impressão
  command += "ZT\n"; // Limpa buffer
  
  // Processar campos
  if (label.campos && Array.isArray(label.campos)) {
    for (const campo of label.campos) {
      if (campo.type === "text") {
        // Texto comum
        command += `A${Math.round(campo.left * 8)},${Math.round(campo.top * 8)},0,3,1,1,N,"${
          campo.text === "Nome do Produto" ? item.name : campo.text
        }"\n`;
      }
      else if (campo.type === "barcode") {
        // Código de barras
        command += `B${Math.round(campo.left * 8)},${Math.round(campo.top * 8)},0,1,2,2,80,B,"${
          item.barcode || item.sku
        }"\n`;
      }
      else if (campo.type === "price") {
        // Preço
        command += `A${Math.round(campo.left * 8)},${Math.round(campo.top * 8)},0,3,1,1,N,"R$ ${
          item.price.toFixed(2).replace(".", ",")
        }"\n`;
      }
      else if (campo.type === "sku") {
        // SKU
        command += `A${Math.round(campo.left * 8)},${Math.round(campo.top * 8)},0,3,1,1,N,"${
          item.sku
        }"\n`;
      }
    }
  }
  
  // Finaliza o comando
  command += "E\n"; // Fim do comando
  
  return command;
};
