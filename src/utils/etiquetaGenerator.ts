
/**
 * Gera um PDF de etiquetas personalizado com base em um modelo
 */
import { CampoEtiqueta, ModeloEtiqueta } from "@/types/etiqueta";

/**
 * Gera um PDF de etiquetas personalizado com base em um modelo
 * @param modelo Modelo de etiqueta personalizado
 * @param itens Lista de itens para gerar etiquetas
 * @param options Opções de geração como posição inicial e número de cópias
 * @returns URL do blob do PDF gerado
 */
export async function generateEtiquetaPDF(
  modelo: ModeloEtiqueta,
  itens: any[],
  options: {
    startRow: number,
    startColumn: number,
    copias: number
  }
): Promise<string> {
  // Importar jsPDF e função de geração de código de barras
  const { jsPDF } = await import("jspdf");
  const { generateBarcode } = await import("./barcodeUtils");

  // Definir orientação e dimensões da página
  const orientation = modelo.orientacao === 'paisagem' ? 'landscape' : 'portrait';
  
  let format: string | [number, number] = 'a4';
  if (modelo.formatoPagina === 'A4') {
    format = 'a4';
  } else if (modelo.formatoPagina === 'Letter') {
    format = 'letter';
  } else if (modelo.formatoPagina === 'Legal') {
    format = 'legal';
  } else if (modelo.formatoPagina === 'Personalizado' && modelo.larguraPagina && modelo.alturaPagina) {
    // Para formatos personalizados, definir diretamente as dimensões em mm
    format = modelo.orientacao === 'paisagem' 
      ? [modelo.alturaPagina, modelo.larguraPagina] 
      : [modelo.larguraPagina, modelo.alturaPagina];
  }

  console.log("Configuração de página:", {
    formato: modelo.formatoPagina,
    orientacao: orientation,
    dimensoes: format,
    margens: {
      superior: modelo.margemSuperior,
      inferior: modelo.margemInferior,
      esquerda: modelo.margemEsquerda,
      direita: modelo.margemDireita
    }
  });

  // Criar novo documento PDF
  const doc = new jsPDF({
    orientation: orientation as "portrait" | "landscape",
    unit: "mm",
    format: format,
  });

  // Calcular quantas etiquetas cabem por página
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  console.log("Dimensões da página (PDF):", {
    largura: pageWidth,
    altura: pageHeight,
    unidade: "mm"
  });

  // Verificar se as dimensões são válidas
  if (pageWidth <= 0 || pageHeight <= 0) {
    throw new Error("Dimensões da página inválidas. Verifique as configurações do formato.");
  }

  // Obter margens da página
  const marginLeft = modelo.margemEsquerda || 10;
  const marginTop = modelo.margemSuperior || 10;
  const marginRight = modelo.margemDireita || 10;
  const marginBottom = modelo.margemInferior || 10;

  // Calcular área útil
  const usableWidth = pageWidth - marginLeft - marginRight;
  const usableHeight = pageHeight - marginTop - marginBottom;

  // Verificar se a etiqueta cabe na página
  if (modelo.largura > usableWidth) {
    throw new Error(`A largura da etiqueta (${modelo.largura}mm) excede a área útil da página (${usableWidth}mm).`);
  }
  
  if (modelo.altura > usableHeight) {
    throw new Error(`A altura da etiqueta (${modelo.altura}mm) excede a área útil da página (${usableHeight}mm).`);
  }

  // Definir espaçamento entre etiquetas
  const spacingH = modelo.espacamentoHorizontal || 0;
  const spacingV = modelo.espacamentoVertical || 0;

  // Calcular quantas etiquetas cabem por linha e coluna
  const labelsPerRow = Math.floor((usableWidth + spacingH) / (modelo.largura + spacingH));
  const labelsPerColumn = Math.floor((usableHeight + spacingV) / (modelo.altura + spacingV));

  console.log("Layout de etiquetas:", {
    etiquetasPorLinha: labelsPerRow,
    etiquetasPorColuna: labelsPerColumn,
    total: labelsPerRow * labelsPerColumn,
    larguraEtiqueta: modelo.largura,
    alturaEtiqueta: modelo.altura
  });

  // Validar se o layout permite pelo menos uma etiqueta
  if (labelsPerRow <= 0 || labelsPerColumn <= 0) {
    throw new Error(
      "Configuração inválida: não é possível imprimir nenhuma etiqueta com estas dimensões. " +
      "Reduza o tamanho da etiqueta ou aumente o tamanho da página."
    );
  }

  // Calcular posição inicial baseada nas opções
  let currentRow = Math.max(0, options.startRow - 1);
  let currentColumn = Math.max(0, options.startColumn - 1);
  
  // Ajustar posição inicial se for maior que o layout disponível
  if (currentRow >= labelsPerColumn) currentRow = 0;
  if (currentColumn >= labelsPerRow) currentColumn = 0;

  // Contador para novas páginas
  let currentPage = 0;

  // Processar cada item
  for (const item of itens) {
    // Gerar código de barras uma vez por item para reutilizar
    const barcodeText = item.barcode || item.sku || item.codigo || "0000000000";
    const barcodeData = await generateBarcode(barcodeText);
    
    // Número de cópias para este item
    const itemCopies = options.copias || 1;
    
    for (let i = 0; i < itemCopies; i++) {
      // Verificar se precisa de nova página
      if (currentRow >= labelsPerColumn) {
        currentRow = 0;
        currentColumn++;
        
        if (currentColumn >= labelsPerRow) {
          currentColumn = 0;
          doc.addPage();
          currentPage++;
        }
      }

      // Calcular posição da etiqueta atual
      const x = marginLeft + currentColumn * (modelo.largura + spacingH);
      const y = marginTop + currentRow * (modelo.altura + spacingV);

      // Desenhar cada campo da etiqueta
      for (const campo of modelo.campos) {
        try {
          // Posição absoluta do campo
          const campoX = x + campo.x;
          const campoY = y + campo.y;

          // Processar com base no tipo de campo
          switch (campo.tipo) {
            case 'nome':
              doc.setFontSize(campo.tamanhoFonte);
              doc.setFont("helvetica", "normal");
              doc.text(item.nome || item.name || "Sem nome", campoX, campoY);
              break;
            
            case 'codigo':
              // Adicionar código de barras
              doc.addImage(
                barcodeData, 
                "PNG", 
                campoX, 
                campoY, 
                campo.largura, 
                campo.altura
              );
              break;
            
            case 'preco':
              doc.setFontSize(campo.tamanhoFonte);
              doc.setFont("helvetica", "bold");
              const price = typeof item.preco === 'number' 
                ? item.preco.toFixed(2) 
                : (typeof item.price === 'number' ? item.price.toFixed(2) : '0.00');
              const priceText = `R$ ${price.replace('.', ',')}`;
              doc.text(priceText, campoX, campoY);
              break;
            
            default:
              console.warn(`Tipo de campo desconhecido: ${campo.tipo}`);
          }
        } catch (error) {
          console.error(`Erro ao processar campo ${campo.tipo}:`, error);
        }
      }

      // Avançar para a próxima posição
      currentRow++;
    }
  }

  // Gerar URL do arquivo temporário
  const pdfBlob = doc.output("blob");
  return URL.createObjectURL(pdfBlob);
}

/**
 * Gera um PDF de previsualização do modelo de etiquetas
 * @param modelo Modelo de etiqueta a ser previsualizado
 * @returns URL do blob do PDF gerado
 */
export async function generatePreviewPDF(modelo: ModeloEtiqueta): Promise<string> {
  // Item de exemplo para a prévia
  const itemExemplo = {
    nome: "Pingente Coroa Cristal",
    codigo: "123456789",
    preco: 59.90
  };

  // Usar a mesma função de geração com configurações simples
  return generateEtiquetaPDF(
    modelo,
    [itemExemplo],
    {
      startRow: 1,
      startColumn: 1,
      copias: 1
    }
  );
}
