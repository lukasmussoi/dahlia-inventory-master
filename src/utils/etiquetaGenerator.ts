
import JsPDF from 'jspdf';
import { toast } from 'sonner';
import type { LabelType, LabelElement } from '@/components/inventory/labels/editor/EtiquetaCreator';
import type { ModeloEtiqueta } from '@/types/etiqueta';

// Função para gerar um PDF de pré-visualização
export const generatePreviewPDF = async (
  modelName: string,
  labels: LabelType[],
  pageFormat: string,
  pageSize: { width: number, height: number },
  margins: { top: number, right: number, bottom: number, left: number },
  spacing: { horizontal: number, vertical: number },
  autoAdjustDimensions: boolean = false
): Promise<string> => {
  try {
    // Verificar se as dimensões são válidas
    if (labels[0].width > pageSize.width - margins.left - margins.right) {
      if (autoAdjustDimensions) {
        // Ajustar automaticamente a largura da etiqueta
        const areaUtil = pageSize.width - margins.left - margins.right;
        labels[0].width = areaUtil;
        console.log(`Largura da etiqueta ajustada automaticamente para ${areaUtil}mm`);
      } else {
        throw new Error(`A largura da etiqueta (${labels[0].width}mm) excede a área útil (${pageSize.width - margins.left - margins.right}mm).`);
      }
    }

    if (labels[0].height > pageSize.height - margins.top - margins.bottom) {
      if (autoAdjustDimensions) {
        // Ajustar automaticamente a altura da etiqueta
        const areaUtil = pageSize.height - margins.top - margins.bottom;
        labels[0].height = areaUtil;
        console.log(`Altura da etiqueta ajustada automaticamente para ${areaUtil}mm`);
      } else {
        throw new Error(`A altura da etiqueta (${labels[0].height}mm) excede a área útil (${pageSize.height - margins.top - margins.bottom}mm).`);
      }
    }

    // Criar o documento PDF
    const pdf = new JsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: pageFormat === 'A4' || pageFormat === 'A5' || pageFormat === 'Letter' ? pageFormat : [pageSize.width, pageSize.height]
    });

    // Adicionar título
    pdf.setFontSize(16);
    pdf.text(`Modelo: ${modelName}`, 10, 10);

    // Adicionar data
    pdf.setFontSize(10);
    const today = new Date();
    pdf.text(`Gerado em: ${today.toLocaleDateString('pt-BR')} ${today.toLocaleTimeString('pt-BR')}`, 10, 20);

    // Configurações de página
    pdf.setFontSize(10);
    pdf.text(`Formato: ${pageFormat}`, 10, 30);
    pdf.text(`Dimensões: ${pageSize.width} × ${pageSize.height} mm`, 10, 35);
    pdf.text(`Dimensões da etiqueta: ${labels[0].width} × ${labels[0].height} mm`, 10, 40);

    // Desenhar borda da página
    pdf.setDrawColor(200, 200, 200);
    pdf.rect(margins.left, margins.top, pageSize.width - margins.left - margins.right, pageSize.height - margins.top - margins.bottom);

    // Calcular quantas etiquetas cabem na página
    const columnsPerPage = Math.floor((pageSize.width - margins.left - margins.right) / (labels[0].width + spacing.horizontal));
    const rowsPerPage = Math.floor((pageSize.height - margins.top - margins.bottom) / (labels[0].height + spacing.vertical));

    pdf.setFontSize(10);
    pdf.text(`Disposição: ${columnsPerPage} × ${rowsPerPage} (colunas × linhas)`, 10, 45);
    pdf.text(`Total de etiquetas por página: ${columnsPerPage * rowsPerPage}`, 10, 50);

    // Adicionar uma nova página para a visualização da etiqueta
    pdf.addPage();

    // Desenhar as etiquetas
    pdf.setDrawColor(150, 150, 150);

    for (let row = 0; row < rowsPerPage; row++) {
      for (let col = 0; col < columnsPerPage; col++) {
        const x = margins.left + col * (labels[0].width + spacing.horizontal);
        const y = margins.top + row * (labels[0].height + spacing.vertical);

        // Desenhar borda da etiqueta
        pdf.rect(x, y, labels[0].width, labels[0].height);

        // Desenhar elementos da etiqueta
        renderLabelElements(pdf, labels[0].elements, x, y);
      }
    }

    // Retornar o PDF como URL de dados
    return pdf.output('datauristring');
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw error;
  }
};

// Função auxiliar para renderizar os elementos de uma etiqueta
const renderLabelElements = (pdf: JsPDF, elements: LabelElement[], offsetX: number, offsetY: number) => {
  elements.forEach(element => {
    // Definir o tamanho da fonte
    pdf.setFontSize(element.fontSize);

    // Obter dados de exemplo para o elemento
    const text = getElementPreviewText(element.type);

    // Calcular a posição do texto baseado no alinhamento
    let x = offsetX + element.x;
    let textAlign: 'left' | 'center' | 'right' = 'left';
    
    if (element.align === 'center') {
      x = offsetX + element.x + (element.width / 2);
      textAlign = 'center';
    } else if (element.align === 'right') {
      x = offsetX + element.x + element.width;
      textAlign = 'right';
    }
    
    // Centralizar verticalmente
    const y = offsetY + element.y + (element.height / 2) + (element.fontSize / 4);

    // Desenhar o texto com o alinhamento especificado
    pdf.text(text, x, y, { align: textAlign });
  });
};

// Função para obter texto de exemplo para cada tipo de elemento
const getElementPreviewText = (type: string): string => {
  switch (type) {
    case 'nome':
      return 'Pingente Cristal';
    case 'codigo':
      return '123456789';
    case 'preco':
      return 'R$ 99,90';
    default:
      return 'Exemplo';
  }
};

// Função para gerar PDF de etiquetas para impressão
export const generateEtiquetaPDF = async (
  modelo: ModeloEtiqueta,
  items: any[],
  options: {
    startRow: number;
    startColumn: number;
    copias: number;
  }
): Promise<string> => {
  try {
    console.log("Gerando PDF para etiquetas com modelo:", modelo.nome);
    
    // Verificar se há itens para gerar etiquetas
    if (!items || items.length === 0) {
      throw new Error("Nenhum item fornecido para gerar etiquetas");
    }
    
    // Obter configurações do modelo
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
    
    // Configurar tamanho da página
    let pageWidth, pageHeight;
    if (formatoPagina === "Personalizado" && larguraPagina && alturaPagina) {
      pageWidth = larguraPagina;
      pageHeight = alturaPagina;
    } else {
      // Tamanhos padrão (em mm)
      if (formatoPagina === "A4") {
        pageWidth = orientacao === "retrato" ? 210 : 297;
        pageHeight = orientacao === "retrato" ? 297 : 210;
      } else if (formatoPagina === "A5") {
        pageWidth = orientacao === "retrato" ? 148 : 210;
        pageHeight = orientacao === "retrato" ? 210 : 148;
      } else if (formatoPagina === "Letter") {
        pageWidth = orientacao === "retrato" ? 216 : 279;
        pageHeight = orientacao === "retrato" ? 279 : 216;
      } else {
        // Formato padrão (A4 retrato)
        pageWidth = 210;
        pageHeight = 297;
      }
    }
    
    // Verificar e corrigir dimensões inválidas
    if (!pageWidth || pageWidth <= 0) pageWidth = 210;
    if (!pageHeight || pageHeight <= 0) pageHeight = 297;
    
    console.log("Dimensões da página:", pageWidth, "x", pageHeight);
    
    // Criar documento PDF
    const pdf = new JsPDF({
      orientation: orientacao === "retrato" ? "portrait" : "landscape",
      unit: "mm",
      format: formatoPagina === "Personalizado" ? [pageWidth, pageHeight] : formatoPagina
    });
    
    // Calcular quantas etiquetas cabem na página
    const margensValidas = {
      superior: margemSuperior > 0 ? margemSuperior : 10,
      inferior: margemInferior > 0 ? margemInferior : 10,
      esquerda: margemEsquerda > 0 ? margemEsquerda : 10,
      direita: margemDireita > 0 ? margemDireita : 10
    };
    
    const espacamentosValidos = {
      horizontal: espacamentoHorizontal >= 0 ? espacamentoHorizontal : 0,
      vertical: espacamentoVertical >= 0 ? espacamentoVertical : 0
    };
    
    // Garantir que as dimensões da etiqueta são válidas
    const etiquetaLargura = largura > 0 ? largura : 50;
    const etiquetaAltura = altura > 0 ? altura : 30;
    
    const labelsPerRow = Math.floor((pageWidth - margensValidas.esquerda - margensValidas.direita) / (etiquetaLargura + espacamentosValidos.horizontal));
    const labelsPerColumn = Math.floor((pageHeight - margensValidas.superior - margensValidas.inferior) / (etiquetaAltura + espacamentosValidos.vertical));
    
    // Verificar se os cálculos resultaram em valores válidos
    const etiquetasPorLinha = labelsPerRow > 0 ? labelsPerRow : 1;
    const etiquetasPorColuna = labelsPerColumn > 0 ? labelsPerColumn : 1;
    
    console.log("Configurações da página:", {
      pageWidth,
      pageHeight,
      etiquetasPorLinha,
      etiquetasPorColuna,
      margens: [margensValidas.superior, margensValidas.direita, margensValidas.inferior, margensValidas.esquerda],
      espacamento: [espacamentosValidos.horizontal, espacamentosValidos.vertical]
    });
    
    // Inicializar posição
    let currentRow = options.startRow - 1;
    let currentColumn = options.startColumn - 1;
    let currentPage = 0;
    
    // Garantir valores válidos
    if (currentRow < 0) currentRow = 0;
    if (currentColumn < 0) currentColumn = 0;
    
    // Calcular número total de etiquetas a serem geradas
    const totalLabels = items.reduce((total, item) => {
      return total + options.copias;
    }, 0);
    
    console.log(`Gerando ${totalLabels} etiquetas no total`);
    
    let labelCounter = 0;
    
    // Para cada item, gerar as etiquetas solicitadas
    for (const item of items) {
      for (let i = 0; i < options.copias; i++) {
        // Verificar se precisa de nova página
        if (currentRow >= etiquetasPorColuna) {
          currentRow = 0;
          currentColumn++;
          
          if (currentColumn >= etiquetasPorLinha) {
            currentColumn = 0;
            pdf.addPage();
            currentPage++;
          }
        }
        
        // Calcular posição da etiqueta
        const x = margensValidas.esquerda + currentColumn * (etiquetaLargura + espacamentosValidos.horizontal);
        const y = margensValidas.superior + currentRow * (etiquetaAltura + espacamentosValidos.vertical);
        
        // Desenhar borda da etiqueta (opcional, pode ser comentado para produção)
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(x, y, etiquetaLargura, etiquetaAltura);
        
        // Renderizar os campos da etiqueta
        if (campos && Array.isArray(campos)) {
          campos.forEach(campo => {
            if (!campo.tipo) return;
            
            // Configurar fonte
            pdf.setFontSize(campo.tamanhoFonte);
            
            // Determinar o conteúdo com base no tipo de campo
            let conteudo = "";
            if (campo.tipo === "nome") {
              conteudo = item.name || "Sem nome";
            } else if (campo.tipo === "codigo") {
              conteudo = item.sku || item.barcode || "000000";
            } else if (campo.tipo === "preco") {
              const preco = typeof item.price === "number" ? item.price.toFixed(2) : "0.00";
              conteudo = `R$ ${preco}`;
            }
            
            // Posicionar e desenhar o texto (convertendo números para string)
            const posX = x + campo.x;
            const posY = y + campo.y;
            
            // Converter coordenadas para string conforme esperado pelo jsPDF
            pdf.text(conteudo, posX, posY);
          });
        } else {
          console.warn("Modelo sem campos definidos ou campos inválidos");
          // Adicionar texto padrão se não houver campos definidos
          pdf.setFontSize(10);
          pdf.text("Etiqueta sem elementos", x + 5, y + 15);
        }
        
        currentRow++;
        labelCounter++;
        
        if (labelCounter % 10 === 0) {
          console.log(`Geradas ${labelCounter} etiquetas de ${totalLabels}`);
        }
      }
    }
    
    console.log(`Geração de PDF concluída com ${labelCounter} etiquetas em ${currentPage + 1} páginas`);
    
    // Gerar URL do arquivo
    const pdfBlob = pdf.output("blob");
    return URL.createObjectURL(pdfBlob);
  } catch (error) {
    console.error("Erro ao gerar PDF de etiquetas:", error);
    if (error instanceof Error) {
      toast.error(`Erro ao gerar etiquetas: ${error.message}`);
    } else {
      toast.error("Erro desconhecido ao gerar etiquetas");
    }
    throw error;
  }
};
