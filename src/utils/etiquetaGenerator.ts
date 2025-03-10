
import { jsPDF } from "jspdf";
import { generateBarcode } from "./barcodeUtils";
import { toast } from "sonner";
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

  try {
    const { startRow = 1, startColumn = 1, copias = 1 } = options;
    
    // Configurações da página
    const orientacao = modelo.orientacao === "retrato" ? "portrait" : "landscape";
    
    // Verificar se as dimensões personalizadas são válidas
    if (modelo.formatoPagina === "Personalizado") {
      if (!modelo.larguraPagina || !modelo.alturaPagina || 
          modelo.larguraPagina <= 0 || modelo.alturaPagina <= 0) {
        console.error("Dimensões de página personalizadas inválidas:", 
          { largura: modelo.larguraPagina, altura: modelo.alturaPagina });
        throw new Error("Dimensões de página personalizadas inválidas. A largura e altura devem ser maiores que zero.");
      }
      
      // Logs de validação em português
      console.log("Usando formato personalizado:", { 
        largura: modelo.larguraPagina, 
        altura: modelo.alturaPagina,
        orientacao: modelo.orientacao
      });
    }
    
    // Configurar formato da página
    let formato: string | [number, number] = modelo.formatoPagina.toLowerCase();
    
    // Se o formato for personalizado, usar as dimensões especificadas em mm
    if (modelo.formatoPagina === "Personalizado" && modelo.larguraPagina && modelo.alturaPagina) {
      formato = [modelo.larguraPagina, modelo.alturaPagina];
      console.log("Formato personalizado definido como:", formato);
    }
    
    // Criar documento PDF com as configurações adequadas
    const doc = new jsPDF({
      orientation: orientacao as "portrait" | "landscape",
      unit: "mm",
      format: formato,
    });
    
    // Dimensões da página (obtidas após a criação do documento para refletir quaisquer ajustes feitos pelo jsPDF)
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    console.log("Dimensões efetivas da página:", {
      pageWidth, 
      pageHeight, 
      formato, 
      orientacao
    });
    
    // Verificar se as dimensões são válidas
    if (pageWidth <= 0 || pageHeight <= 0) {
      throw new Error("Dimensões da página inválidas após inicialização do PDF. Verifique o formato especificado.");
    }
    
    // Configurações da etiqueta
    const labelWidth = modelo.largura;
    const labelHeight = modelo.altura;
    const marginLeft = modelo.margemEsquerda;
    const marginTop = modelo.margemSuperior;
    const marginRight = modelo.margemDireita;
    const marginBottom = modelo.margemInferior;
    const spacingH = modelo.espacamentoHorizontal;
    const spacingV = modelo.espacamentoVertical;
    
    // Área útil da página (descontando margens)
    const usableWidth = pageWidth - marginLeft - marginRight;
    const usableHeight = pageHeight - marginTop - marginBottom;
    
    console.log("Configurações de etiqueta:", {
      labelWidth, 
      labelHeight,
      marginLeft,
      marginTop,
      marginRight,
      marginBottom,
      spacingH,
      spacingV,
      usableWidth,
      usableHeight
    });
    
    // Validação da área útil
    if (usableWidth <= 0 || usableHeight <= 0) {
      throw new Error("Área útil da página inválida. As margens podem estar muito grandes para o tamanho da página.");
    }
    
    // Verificar se a etiqueta cabe na área útil
    if (labelWidth > usableWidth) {
      throw new Error(`A largura da etiqueta (${labelWidth}mm) é maior que a área útil disponível (${usableWidth}mm).`);
    }
    
    if (labelHeight > usableHeight) {
      throw new Error(`A altura da etiqueta (${labelHeight}mm) é maior que a área útil disponível (${usableHeight}mm).`);
    }
    
    // Calcular quantas etiquetas cabem na página
    const labelsPerRow = Math.floor((usableWidth + spacingH) / (labelWidth + spacingH));
    const labelsPerColumn = Math.floor((usableHeight + spacingV) / (labelHeight + spacingV));
    
    console.log("Cálculo de etiquetas por página:", {
      labelsPerRow,
      labelsPerColumn
    });
    
    // Validações
    if (labelsPerRow <= 0) {
      throw new Error("Configuração inválida: nenhuma etiqueta cabe horizontalmente na página. Reduza a largura da etiqueta ou aumente o tamanho da página.");
    }
    
    if (labelsPerColumn <= 0) {
      throw new Error("Configuração inválida: nenhuma etiqueta cabe verticalmente na página. Reduza a altura da etiqueta ou aumente o tamanho da página.");
    }
    
    let currentRow = startRow - 1;
    let currentColumn = startColumn - 1;
    
    // Garantir valores válidos
    if (currentRow < 0) currentRow = 0;
    if (currentColumn < 0) currentColumn = 0;
    
    // Se a posição inicial for maior que o número de etiquetas disponíveis, ajustar
    if (currentRow >= labelsPerColumn) {
      currentRow = labelsPerColumn - 1;
    }
    
    if (currentColumn >= labelsPerRow) {
      currentColumn = labelsPerRow - 1;
    }
    
    console.log("Posição inicial ajustada:", { currentRow, currentColumn });
    
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
            console.log("Nova página adicionada");
          }
        }
        
        // Calcular posição da etiqueta na página
        const x = marginLeft + currentColumn * (labelWidth + spacingH);
        const y = marginTop + currentRow * (labelHeight + spacingV);
        
        console.log(`Adicionando etiqueta em posição (${currentColumn},${currentRow}) - coordenadas (${x},${y})`);
        
        // Validar se a etiqueta ainda está dentro da página
        if (x + labelWidth > pageWidth) {
          console.warn(`Etiqueta ultrapassou a largura da página: x=${x}, labelWidth=${labelWidth}, pageWidth=${pageWidth}`);
        }
        
        if (y + labelHeight > pageHeight) {
          console.warn(`Etiqueta ultrapassou a altura da página: y=${y}, labelHeight=${labelHeight}, pageHeight=${pageHeight}`);
        }
        
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

  } catch (error) {
    console.error("Erro na geração do PDF:", error);
    if (error instanceof Error) {
      toast.error(`Erro ao gerar etiquetas: ${error.message}`);
    } else {
      toast.error("Erro ao gerar etiquetas. Por favor, verifique as configurações e tente novamente.");
    }
    throw error;
  }
}

// Função para adicionar um elemento na etiqueta
async function adicionarElemento(doc: jsPDF, campo: CampoEtiqueta, item: any, xBase: number, yBase: number): Promise<void> {
  try {
    const x = xBase + campo.x;
    const y = yBase + campo.y;
    
    // Configurar fonte e tamanho
    doc.setFontSize(campo.tamanhoFonte);
    
    // Determinar o estilo da fonte
    let fontStyle = "normal";
    if (campo.valor?.includes("negrito")) {
      fontStyle = "bold";
    } else if (campo.valor?.includes("italico")) {
      fontStyle = "italic";
    }
    
    doc.setFont("helvetica", fontStyle);
    
    // Adicionar o elemento conforme seu tipo
    switch (campo.tipo) {
      case "nome":
        const nome = item.name || "Sem nome";
        doc.text(nome, x, y);
        console.log(`Adicionado nome: "${nome}" em (${x},${y})`);
        break;
        
      case "codigo":
        try {
          const barcodeText = item.barcode || item.sku || "0000000000";
          const barcodeData = await generateBarcode(barcodeText);
          doc.addImage(barcodeData, "PNG", x, y, campo.largura, campo.altura);
          console.log(`Adicionado código de barras: "${barcodeText}" em (${x},${y})`);
        } catch (error) {
          console.error("Erro ao gerar código de barras:", error);
        }
        break;
        
      case "preco":
        const price = typeof item.price === 'number' ? item.price.toFixed(2) : '0.00';
        const priceText = `R$ ${price}`;
        doc.text(priceText, x, y);
        console.log(`Adicionado preço: "${priceText}" em (${x},${y})`);
        break;
        
      default:
        // Tipos não reconhecidos são ignorados
        console.warn(`Tipo de campo não reconhecido: ${campo.tipo}`);
    }
  } catch (error) {
    console.error(`Erro ao adicionar elemento tipo ${campo.tipo}:`, error);
  }
}
