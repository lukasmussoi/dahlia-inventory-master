
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
    ajustarAutomaticamente?: boolean;
  } = {}
): Promise<string> {
  console.log("Gerando etiqueta com modelo:", modelo);
  console.log("Campos do modelo:", modelo.campos);

  try {
    const { startRow = 1, startColumn = 1, copias = 1, ajustarAutomaticamente = false } = options;
    
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
    
    // Verificar se as dimensões da etiqueta são válidas
    if (modelo.largura <= 0 || modelo.altura <= 0) {
      console.error("Dimensões de etiqueta inválidas:", 
        { largura: modelo.largura, altura: modelo.altura });
      throw new Error("Dimensões da etiqueta inválidas. A largura e altura devem ser maiores que zero.");
    }
    
    // Configurar formato da página
    let formato: any = modelo.formatoPagina.toLowerCase();
    let pageWidth, pageHeight;
    
    // Se o formato for personalizado, usar as dimensões especificadas em mm
    if (modelo.formatoPagina === "Personalizado" && modelo.larguraPagina && modelo.alturaPagina) {
      pageWidth = Number(modelo.larguraPagina);
      pageHeight = Number(modelo.alturaPagina);
      
      // Se a orientação for paisagem, inverter largura e altura
      if (modelo.orientacao === "paisagem") {
        formato = [pageHeight, pageWidth];
        console.log("Formato personalizado em paisagem:", formato);
      } else {
        formato = [pageWidth, pageHeight];
        console.log("Formato personalizado em retrato:", formato);
      }
    }
    
    // Criar documento PDF com as configurações adequadas
    const doc = new jsPDF({
      orientation: orientacao as "portrait" | "landscape",
      unit: "mm",
      format: formato,
    });
    
    // Dimensões da página (obtidas após a criação do documento)
    if (!pageWidth || !pageHeight) {
      pageWidth = doc.internal.pageSize.getWidth();
      pageHeight = doc.internal.pageSize.getHeight();
    }
    
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
    let labelWidth = Number(modelo.largura);
    let labelHeight = Number(modelo.altura);
    const marginLeft = Number(modelo.margemEsquerda);
    const marginTop = Number(modelo.margemSuperior);
    const marginRight = Number(modelo.margemDireita);
    const marginBottom = Number(modelo.margemInferior);
    const spacingH = Number(modelo.espacamentoHorizontal);
    const spacingV = Number(modelo.espacamentoVertical);
    
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
      throw new Error(`Área útil da página inválida. As margens (L:${marginLeft}mm, R:${marginRight}mm, T:${marginTop}mm, B:${marginBottom}mm) são muito grandes para o tamanho da página (${pageWidth}mm x ${pageHeight}mm).`);
    }
    
    // Verificar se a etiqueta cabe na área útil e ajustar se necessário
    let dimensoesAjustadas = false;
    
    if (labelWidth > usableWidth) {
      if (ajustarAutomaticamente) {
        const larguraOriginal = labelWidth;
        labelWidth = Math.floor(usableWidth * 0.95); // 95% da largura útil para garantir que caiba
        dimensoesAjustadas = true;
        console.log(`Largura da etiqueta ajustada automaticamente de ${larguraOriginal}mm para ${labelWidth}mm`);
      } else {
        throw new Error(`A largura da etiqueta (${labelWidth}mm) é maior que a área útil disponível (${usableWidth}mm). Reduza a largura da etiqueta ou aumente a largura da página.`);
      }
    }
    
    if (labelHeight > usableHeight) {
      if (ajustarAutomaticamente) {
        const alturaOriginal = labelHeight;
        labelHeight = Math.floor(usableHeight * 0.95); // 95% da altura útil para garantir que caiba
        dimensoesAjustadas = true;
        console.log(`Altura da etiqueta ajustada automaticamente de ${alturaOriginal}mm para ${labelHeight}mm`);
      } else {
        throw new Error(`A altura da etiqueta (${labelHeight}mm) é maior que a área útil disponível (${usableHeight}mm). Reduza a altura da etiqueta ou aumente a altura da página.`);
      }
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
      throw new Error(`Configuração inválida: nenhuma etiqueta cabe horizontalmente na página. Reduza a largura da etiqueta (${labelWidth}mm) ou aumente o tamanho da página (${pageWidth}mm).`);
    }
    
    if (labelsPerColumn <= 0) {
      throw new Error(`Configuração inválida: nenhuma etiqueta cabe verticalmente na página. Reduza a altura da etiqueta (${labelHeight}mm) ou aumente o tamanho da página (${pageHeight}mm).`);
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
        if (modelo.campos && modelo.campos.length > 0) {
          for (const campo of modelo.campos) {
            if (campo) {
              await adicionarElemento(doc, campo, item, x, y);
            }
          }
        } else {
          console.warn("Modelo sem campos definidos");
        }
        
        currentRow++;
      }
    }
    
    // Se houve ajuste de dimensões, avisar ao usuário
    if (dimensoesAjustadas) {
      toast.info(`As dimensões da etiqueta foram ajustadas automaticamente para caber na página.`);
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

// Função auxiliar para criar um modelo de etiqueta a partir dos dados do EtiquetaCreator
export function createModeloFromCreator(
  modelName: string,
  labels: any[],
  pageFormat: string, 
  pageSize: { width: number, height: number },
  margins: { top: number, right: number, bottom: number, left: number } = { top: 10, right: 10, bottom: 10, left: 10 },
  spacing: { horizontal: number, vertical: number } = { horizontal: 2, vertical: 2 }
): ModeloEtiqueta {
  // Usar a primeira etiqueta como referência principal
  const primaryLabel = labels[0];
  
  // Garantir que há elementos na etiqueta
  if (!primaryLabel || !primaryLabel.elements || primaryLabel.elements.length === 0) {
    console.warn("Criando modelo sem elementos");
    return {
      nome: modelName || "Modelo sem nome",
      descricao: modelName || "Modelo sem nome",
      largura: primaryLabel?.width || 80,
      altura: primaryLabel?.height || 30,
      formatoPagina: pageFormat,
      orientacao: "retrato",
      margemSuperior: margins.top,
      margemInferior: margins.bottom,
      margemEsquerda: margins.left,
      margemDireita: margins.right,
      espacamentoHorizontal: spacing.horizontal,
      espacamentoVertical: spacing.vertical,
      larguraPagina: pageSize.width,
      alturaPagina: pageSize.height,
      campos: []
    };
  }
  
  // Garantir que as propriedades das etiquetas são números
  const width = parseFloat(primaryLabel.width) || 80;
  const height = parseFloat(primaryLabel.height) || 30;
  
  return {
    nome: modelName || "Modelo sem nome",
    descricao: modelName || "Modelo sem nome",
    largura: width,
    altura: height,
    formatoPagina: pageFormat,
    orientacao: "retrato", // Pode ser dinâmico no futuro
    margemSuperior: margins.top,
    margemInferior: margins.bottom,
    margemEsquerda: margins.left,
    margemDireita: margins.right,
    espacamentoHorizontal: spacing.horizontal,
    espacamentoVertical: spacing.vertical,
    larguraPagina: pageSize.width,
    alturaPagina: pageSize.height,
    campos: (primaryLabel.elements || []).map((el: any) => ({
      tipo: el.type,
      x: parseFloat(el.x) || 0,
      y: parseFloat(el.y) || 0,
      largura: parseFloat(el.width) || 40,
      altura: parseFloat(el.height) || 10,
      tamanhoFonte: parseFloat(el.fontSize) || 10,
      alinhamento: el.align || 'left'
    }))
  };
}

// Função para gerar um PDF de pré-visualização a partir dos dados do EtiquetaCreator
export async function generatePreviewPDF(
  modelName: string,
  labels: any[],
  pageFormat: string, 
  pageSize: { width: number, height: number },
  margins: { top: number, right: number, bottom: number, left: number } = { top: 10, right: 10, bottom: 10, left: 10 },
  spacing: { horizontal: number, vertical: number } = { horizontal: 2, vertical: 2 },
  ajustarAutomaticamente: boolean = false
): Promise<string> {
  console.log("Iniciando geração de pré-visualização para:", modelName);
  console.log("Labels recebidas:", labels);
  console.log("Formato da página:", pageFormat, pageSize);
  console.log("Ajuste automático:", ajustarAutomaticamente);
  
  if (!labels || labels.length === 0) {
    console.error("Não há etiquetas para gerar a pré-visualização");
    toast.error("Não há etiquetas para gerar a pré-visualização");
    throw new Error("Não há etiquetas para gerar a pré-visualização");
  }

  try {
    // Verificar se a primeira etiqueta tem as propriedades necessárias
    const firstLabel = labels[0];
    if (!firstLabel) {
      console.error("Configuração de etiqueta inválida: etiqueta não definida");
      toast.error("Configuração de etiqueta inválida");
      throw new Error("Configuração de etiqueta inválida. Nenhuma etiqueta definida.");
    }
    
    // Garantir que as dimensões são números válidos
    const labelWidth = parseFloat(firstLabel.width) || 80;
    const labelHeight = parseFloat(firstLabel.height) || 30;
    
    if (isNaN(labelWidth) || isNaN(labelHeight) || labelWidth <= 0 || labelHeight <= 0) {
      console.error("Dimensões da etiqueta inválidas:", { width: firstLabel.width, height: firstLabel.height });
      toast.error("Dimensões da etiqueta inválidas");
      throw new Error("Dimensões da etiqueta inválidas. Verifique os valores de largura e altura.");
    }
    
    // Garantir que as dimensões da página são números válidos
    const pageWidthNum = parseFloat(pageSize.width) || 210;
    const pageHeightNum = parseFloat(pageSize.height) || 297;
    
    if (isNaN(pageWidthNum) || isNaN(pageHeightNum) || pageWidthNum <= 0 || pageHeightNum <= 0) {
      console.error("Dimensões da página inválidas:", pageSize);
      toast.error("Dimensões da página inválidas");
      throw new Error("Dimensões da página inválidas. Verifique os valores de largura e altura.");
    }
    
    // Verificar se a etiqueta cabe na área útil da página
    const usableWidth = pageWidthNum - margins.left - margins.right;
    const usableHeight = pageHeightNum - margins.top - margins.bottom;
    
    console.log("Área útil calculada:", { 
      usableWidth, 
      usableHeight, 
      etiquetaWidth: labelWidth, 
      etiquetaHeight: labelHeight 
    });
    
    // Verificar se há avisos sobre as dimensões, mas não interromper se o ajuste automático estiver ativado
    if (labelWidth > usableWidth) {
      console.warn("Largura da etiqueta maior que a área útil:", {
        larguraEtiqueta: labelWidth,
        areaUtilLargura: usableWidth
      });
      
      if (!ajustarAutomaticamente) {
        throw new Error(`A largura da etiqueta (${labelWidth}mm) é maior que a área útil disponível (${usableWidth}mm). Reduza a largura da etiqueta ou aumente a largura da página.`);
      }
    }
    
    if (labelHeight > usableHeight) {
      console.warn("Altura da etiqueta maior que a área útil:", {
        alturaEtiqueta: labelHeight,
        areaUtilAltura: usableHeight
      });
      
      if (!ajustarAutomaticamente) {
        throw new Error(`A altura da etiqueta (${labelHeight}mm) é maior que a área útil disponível (${usableHeight}mm). Reduza a altura da etiqueta ou aumente a altura da página.`);
      }
    }
    
    // Garantir que há elementos na etiqueta ou criar elementos padrão para a visualização
    if (!firstLabel.elements || firstLabel.elements.length === 0) {
      console.warn("Etiqueta sem elementos. Criando elementos padrão para pré-visualização.");
      // Se não houver elementos, criar elementos padrão para visualização
      firstLabel.elements = [
        { type: 'nome', x: 2, y: 2, width: Math.min(labelWidth * 0.6, 40), height: Math.min(labelHeight * 0.4, 10), fontSize: 7 },
        { type: 'codigo', x: 2, y: Math.min(labelHeight * 0.5, 10), width: Math.min(labelWidth * 0.6, 40), height: Math.min(labelHeight * 0.3, 6), fontSize: 8 },
        { type: 'preco', x: Math.min(labelWidth * 0.7, 50), y: 2, width: Math.min(labelWidth * 0.25, 20), height: Math.min(labelHeight * 0.4, 10), fontSize: 10 }
      ];
    }
    
    // Criar um modelo temporário com os dados atuais
    const modelo = createModeloFromCreator(
      modelName,
      labels,
      pageFormat,
      { 
        width: pageWidthNum, 
        height: pageHeightNum 
      },
      margins,
      spacing
    );
    
    console.log("Modelo criado para pré-visualização:", modelo);
    
    // Dados de exemplo para visualização
    const dadosExemplo = [
      { name: "Pingente Cristal", barcode: "123456789", price: 99.90 }
    ];
    
    // Gerar o PDF com opção de ajuste automático
    return await generateEtiquetaPDF(
      modelo,
      dadosExemplo,
      { 
        copias: 1,
        ajustarAutomaticamente: ajustarAutomaticamente 
      }
    );
  } catch (error) {
    console.error("Erro ao gerar PDF de pré-visualização:", error);
    if (error instanceof Error) {
      toast.error(`Erro na pré-visualização: ${error.message}`);
    } else {
      toast.error("Erro ao gerar pré-visualização");
    }
    throw error;
  }
}

// Função para adicionar um elemento na etiqueta
async function adicionarElemento(doc: jsPDF, campo: CampoEtiqueta, item: any, xBase: number, yBase: number): Promise<void> {
  try {
    if (!campo || !campo.tipo) {
      console.warn("Campo inválido ou tipo de campo não definido:", campo);
      return;
    }
    
    const x = xBase + Number(campo.x || 0);
    const y = yBase + Number(campo.y || 0);
    const largura = Number(campo.largura || 40);
    const altura = Number(campo.altura || 10);
    const tamanhoFonte = Number(campo.tamanhoFonte || 10);
    
    // Configurar fonte e tamanho
    doc.setFontSize(tamanhoFonte);
    
    // Determinar o estilo da fonte
    let fontStyle = "normal";
    
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
          doc.addImage(barcodeData, "PNG", x, y, largura, altura);
          console.log(`Adicionado código de barras: "${barcodeText}" em (${x},${y})`);
        } catch (error) {
          console.error("Erro ao gerar código de barras:", error);
          // Fallback: Adicionar texto do código se a imagem falhar
          doc.text(item.barcode || item.sku || "0000000000", x, y);
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
    console.error(`Erro ao adicionar elemento tipo ${campo?.tipo || 'desconhecido'}:`, error);
  }
}
