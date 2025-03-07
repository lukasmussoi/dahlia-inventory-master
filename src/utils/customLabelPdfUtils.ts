
import { jsPDF } from "jspdf";
import { CustomLabel } from "@/models/labelModel";
import { generateBarcode } from "./barcodeUtils";
import { Json } from "@/integrations/supabase/types";

// Interface para os campos de etiqueta
interface CampoEtiqueta {
  type: string;
  text?: string;
  left: number;
  top: number;
  width: number;
  height?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fill?: string;
  textAlign?: string;
  barcodeType?: string;
}

/**
 * Converte Json para array de CampoEtiqueta
 * @param json Objeto JSON dos campos
 * @returns Array de CampoEtiqueta
 */
function convertJsonToCamposArray(json: Json): CampoEtiqueta[] {
  if (!json) return [];
  
  if (Array.isArray(json)) {
    return json.map(item => ({
      type: typeof item.type === 'string' ? item.type : 'text',
      text: typeof item.text === 'string' ? item.text : '',
      left: typeof item.left === 'number' ? item.left : 0,
      top: typeof item.top === 'number' ? item.top : 0,
      width: typeof item.width === 'number' ? item.width : 100,
      height: typeof item.height === 'number' ? item.height : 30,
      fontSize: typeof item.fontSize === 'number' ? item.fontSize : 12,
      fontFamily: typeof item.fontFamily === 'string' ? item.fontFamily : 'helvetica',
      fontWeight: typeof item.fontWeight === 'string' ? item.fontWeight : 'normal',
      fill: typeof item.fill === 'string' ? item.fill : '#000000',
      textAlign: typeof item.textAlign === 'string' ? item.textAlign : 'left',
      barcodeType: typeof item.barcodeType === 'string' ? item.barcodeType : 'CODE128'
    } as CampoEtiqueta));
  }
  
  return [];
}

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
  
  // Converter campos JSON para array de CampoEtiqueta
  const campos = convertJsonToCamposArray(label.campos);
  
  // Desenhar grade de etiquetas
  for (let linha = 0; linha < etiquetasVertical; linha++) {
    for (let coluna = 0; coluna < etiquetasHorizontal; coluna++) {
      const x = label.margem_esquerda + coluna * (label.largura + label.espacamento_horizontal);
      const y = label.margem_superior + linha * (label.altura + label.espacamento_vertical);
      
      // Desenhar contorno da etiqueta (opcional, para visualização)
      doc.setDrawColor(200, 200, 200);
      doc.rect(x, y, label.largura, label.altura);
      
      // Adicionar elementos conforme campos da etiqueta
      if (campos.length > 0) {
        for (const campo of campos) {
          if (campo.type === "text") {
            doc.setFont(campo.fontFamily || "helvetica", campo.fontWeight || "normal");
            doc.setFontSize(campo.fontSize || 10);
            doc.setTextColor(campo.fill || "#000000");
            
            // Substituir texto de exemplo com o nome do produto
            const texto = campo.text === "Nome do Produto" ? mockItem.name : campo.text;
            
            const textAlign = campo.textAlign === "center" ? "center" : 
                              campo.textAlign === "right" ? "right" : "left";
                              
            doc.text(
              texto || "", 
              x + campo.left + (campo.width / 2), 
              y + campo.top + ((campo.fontSize || 10) / 2), 
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
              const barcodeHeight = campo.height || 20;
              
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
              y + campo.top + ((campo.fontSize || 12) / 2), 
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
              y + campo.top + ((campo.fontSize || 8) / 2), 
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
  
  // Converter campos JSON para array de CampoEtiqueta
  const campos = convertJsonToCamposArray(label.campos);
  
  // Processar campos
  if (campos.length > 0) {
    for (const campo of campos) {
      if (campo.type === "text") {
        // Texto comum
        command += `A${Math.round(campo.left * 8)},${Math.round(campo.top * 8)},0,3,1,1,N,"${
          campo.text === "Nome do Produto" ? item.name : (campo.text || "")
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
