
import JsPDF from 'jspdf';
import { toast } from 'sonner';
import { generateBarcode } from './barcodeUtils';
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

    // Determinar orientação com base nas dimensões da página
    const orientation = pageSize.width > pageSize.height ? 'landscape' : 'portrait';
    
    // Determinar o formato baseado no pageFormat
    let format: string | [number, number];
    
    if (pageFormat === 'Personalizado') {
      // Para formato personalizado, usamos as dimensões exatas
      format = [pageSize.width, pageSize.height];
    } else if (pageFormat === 'etiqueta-pequena') {
      // Para etiquetas de 90x10mm
      format = [90, 10];
    } else {
      // Para formatos padrão (A4, Letter, etc.)
      format = pageFormat;
    }

    // Criar o documento PDF com formato e orientação corretos
    const pdf = new JsPDF({
      orientation: orientation as 'portrait' | 'landscape',
      unit: 'mm',
      format: format
    });

    // Configurar metadados do PDF
    pdf.setProperties({
      title: "Dalia Manager - Etiquetas",
      author: "Dalia Manager",
      subject: "Etiquetas",
      keywords: "etiquetas, PDF, dalia manager",
      creator: "Dalia Manager"
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
      return 'Elo Aro Invertível';
    case 'codigo':
      return '123456789';
    case 'preco':
      return 'R$ 119,90';
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
    let format: any;

    // Determinar orientação baseada no valor do modelo
    let orientation: "portrait" | "landscape" = orientacao === "retrato" ? "portrait" : "landscape";

    if (formatoPagina === "Personalizado" && larguraPagina && alturaPagina) {
      // Para formato personalizado, usar as dimensões informadas
      if (orientation === "portrait") {
        pageWidth = larguraPagina;
        pageHeight = alturaPagina;
      } else {
        // Para paisagem, trocamos largura e altura
        pageWidth = alturaPagina;
        pageHeight = larguraPagina;
      }
      format = [pageWidth, pageHeight];
    } else if (formatoPagina === "etiqueta-pequena") {
      // Para etiquetas pequenas, sempre usar formato paisagem (90x10mm)
      pageWidth = 90;
      pageHeight = 10;
      format = [pageWidth, pageHeight];
      orientation = "landscape"; // Forçar paisagem para etiquetas pequenas
    } else {
      // Tamanhos padrão (em mm)
      if (formatoPagina === "A4") {
        if (orientation === "portrait") {
          pageWidth = 210;
          pageHeight = 297;
        } else {
          pageWidth = 297;
          pageHeight = 210;
        }
        format = "a4";
      } else if (formatoPagina === "Letter") {
        if (orientation === "portrait") {
          pageWidth = 216;
          pageHeight = 279;
        } else {
          pageWidth = 279;
          pageHeight = 216;
        }
        format = "letter";
      } else if (formatoPagina === "Legal") {
        if (orientation === "portrait") {
          pageWidth = 216;
          pageHeight = 356;
        } else {
          pageWidth = 356;
          pageHeight = 216;
        }
        format = "legal";
      } else {
        // Formato padrão caso não seja reconhecido
        pageWidth = 210;
        pageHeight = 297;
        format = "a4";
      }
    }
    
    // Verificar e corrigir dimensões inválidas
    if (!pageWidth || pageWidth <= 0) pageWidth = 90;
    if (!pageHeight || pageHeight <= 0) pageHeight = 10;
    
    console.log("Dimensões da página:", pageWidth, "x", pageHeight, "mm, Orientação:", orientation);
    
    // Criar documento PDF
    const pdf = new JsPDF({
      orientation: orientation,
      unit: "mm",
      format: format
    });
    
    // Configurar metadados do PDF
    pdf.setProperties({
      title: "Dalia Manager - Etiquetas",
      author: "Dalia Manager",
      subject: "Etiquetas",
      keywords: "etiquetas, PDF, dalia manager",
      creator: "Dalia Manager"
    });
    
    // Calcular quantas etiquetas cabem na página
    const margensValidas = {
      superior: margemSuperior > 0 ? margemSuperior : 0,
      inferior: margemInferior > 0 ? margemInferior : 0,
      esquerda: margemEsquerda > 0 ? margemEsquerda : 0,
      direita: margemDireita > 0 ? margemDireita : 0
    };
    
    const espacamentosValidos = {
      horizontal: espacamentoHorizontal >= 0 ? espacamentoHorizontal : 0,
      vertical: espacamentoVertical >= 0 ? espacamentoVertical : 0
    };
    
    // Garantir que as dimensões da etiqueta são válidas
    const etiquetaLargura = largura > 0 ? largura : 90;
    const etiquetaAltura = altura > 0 ? altura : 10;
    
    // Determinar se é uma etiqueta pequena (90x10mm ou similar)
    const isEtiquetaPequena = formatoPagina === "etiqueta-pequena" || 
      (etiquetaLargura >= 85 && etiquetaLargura <= 95 && etiquetaAltura >= 5 && etiquetaAltura <= 15);
    
    // Para etiquetas pequenas, definimos apenas 1 por página
    const etiquetasPorLinha = isEtiquetaPequena ? 1 : 
      Math.floor((pageWidth - margensValidas.esquerda - margensValidas.direita) / 
      (etiquetaLargura + espacamentosValidos.horizontal));
    
    const etiquetasPorColuna = isEtiquetaPequena ? 1 : 
      Math.floor((pageHeight - margensValidas.superior - margensValidas.inferior) / 
      (etiquetaAltura + espacamentosValidos.vertical));

    // Verificar se os valores são válidos
    const labelsPerRow = Math.max(etiquetasPorLinha, 1);
    const labelsPerColumn = Math.max(etiquetasPorColuna, 1);
    
    console.log("Configurações da página:", {
      pageWidth,
      pageHeight,
      etiquetasPorLinha: labelsPerRow,
      etiquetasPorColuna: labelsPerColumn,
      margens: [margensValidas.superior, margensValidas.direita, margensValidas.inferior, margensValidas.esquerda],
      espacamento: [espacamentosValidos.horizontal, espacamentosValidos.vertical]
    });
    
    // Inicializar contadores
    let currentRow = isEtiquetaPequena ? 0 : Math.max(0, options.startRow - 1);
    let currentColumn = isEtiquetaPequena ? 0 : Math.max(0, options.startColumn - 1);
    let currentPage = 0;
    
    // Calcular número total de etiquetas a serem geradas
    const totalLabels = items.reduce((total, item) => {
      return total + options.copias;
    }, 0);
    
    console.log(`Gerando ${totalLabels} etiquetas no total`);
    
    let labelCounter = 0;
    
    // Para etiquetas pequenas, gerar uma etiqueta por página
    if (isEtiquetaPequena) {
      for (const item of items) {
        for (let i = 0; i < options.copias; i++) {
          if (labelCounter > 0) {
            pdf.addPage(format, orientation);
          }
          
          // Posição fixa no canto superior esquerdo
          const x = margensValidas.esquerda;
          const y = margensValidas.superior;
          
          // Gerar código de barras para este item
          const barcodeText = item.barcode || item.sku || "0000000000";
          let barcodeData;
          try {
            barcodeData = await generateBarcode(barcodeText);
          } catch (error) {
            console.error("Erro ao gerar código de barras:", error);
          }
          
          // Renderizar os campos da etiqueta
          if (campos && Array.isArray(campos)) {
            for (const campo of campos) {
              if (!campo.tipo) continue;
              
              // Configurar fonte
              pdf.setFontSize(campo.tamanhoFonte);
              
              // Definir a fonte a ser usada (com fallback para helvetica)
              const fonteName = campo.fonte || "helvetica";
              const fonteStyle = campo.tipo === "preco" ? "bold" : "normal";
              pdf.setFont(fonteName, fonteStyle);
              
              // Determinar o conteúdo com base no tipo de campo
              let conteudo = "";
              if (campo.tipo === "nome") {
                conteudo = item.name || "Sem nome";
              } else if (campo.tipo === "codigo") {
                if (barcodeData) {
                  try {
                    // Adicionar imagem do código de barras
                    pdf.addImage(barcodeData, "PNG", x + campo.x, y + campo.y, campo.largura, campo.altura);
                    continue; // Pular o resto do loop para este campo
                  } catch (error) {
                    console.error("Erro ao adicionar código de barras:", error);
                    conteudo = barcodeText;
                  }
                } else {
                  conteudo = barcodeText;
                }
              } else if (campo.tipo === "preco") {
                const preco = typeof item.price === "number" ? item.price.toFixed(2).replace(".", ",") : "0,00";
                conteudo = `R$ ${preco}`;
              }
              
              // Posicionar e desenhar o texto
              let posX = x + campo.x;
              const posY = y + campo.y;
              
              // Ajustar posição X com base no alinhamento
              const alinhamento = campo.alinhamento || (campo.tipo === "preco" ? "right" : "left");
              
              if (alinhamento === "center") {
                posX = x + campo.x + (campo.largura / 2);
              } else if (alinhamento === "right") {
                posX = x + campo.x + campo.largura;
              }
              
              // Renderizar texto com alinhamento
              pdf.text(conteudo, posX, posY, { align: alinhamento });
            }
          } else {
            // Adicionar texto padrão se não houver campos definidos
            pdf.setFontSize(10);
            pdf.text("Etiqueta sem elementos", x + 5, y + 5);
          }
          
          labelCounter++;
        }
      }
    } else {
      // Para outros formatos, usar o layout de múltiplas etiquetas por página
      for (const item of items) {
        // Gerar código de barras para este item
        const barcodeText = item.barcode || item.sku || "0000000000";
        let barcodeData;
        try {
          barcodeData = await generateBarcode(barcodeText);
        } catch (error) {
          console.error("Erro ao gerar código de barras:", error);
        }
        
        for (let i = 0; i < options.copias; i++) {
          // Verificar se precisa de nova página
          if (currentRow >= labelsPerColumn) {
            currentRow = 0;
            currentColumn++;
            
            if (currentColumn >= labelsPerRow) {
              currentColumn = 0;
              pdf.addPage(format, orientation);
              currentPage++;
            }
          }
          
          // Calcular posição da etiqueta
          const x = margensValidas.esquerda + currentColumn * (etiquetaLargura + espacamentosValidos.horizontal);
          const y = margensValidas.superior + currentRow * (etiquetaAltura + espacamentosValidos.vertical);
          
          // Renderizar os campos da etiqueta
          if (campos && Array.isArray(campos)) {
            for (const campo of campos) {
              if (!campo.tipo) continue;
              
              // Configurar fonte
              pdf.setFontSize(campo.tamanhoFonte);
              
              // Definir a fonte a ser usada (com fallback para helvetica)
              const fonteName = campo.fonte || "helvetica";
              const fonteStyle = campo.tipo === "preco" ? "bold" : "normal";
              pdf.setFont(fonteName, fonteStyle);
              
              // Determinar o conteúdo com base no tipo de campo
              let conteudo = "";
              if (campo.tipo === "nome") {
                conteudo = item.name || "Sem nome";
              } else if (campo.tipo === "codigo") {
                if (barcodeData) {
                  try {
                    // Adicionar imagem do código de barras
                    pdf.addImage(barcodeData, "PNG", x + campo.x, y + campo.y, campo.largura, campo.altura);
                    continue; // Pular o resto do loop para este campo
                  } catch (error) {
                    console.error("Erro ao adicionar código de barras:", error);
                    conteudo = barcodeText;
                  }
                } else {
                  conteudo = barcodeText;
                }
              } else if (campo.tipo === "preco") {
                const preco = typeof item.price === "number" ? item.price.toFixed(2).replace(".", ",") : "0,00";
                conteudo = `R$ ${preco}`;
              }
              
              // Posicionar e desenhar o texto
              let posX = x + campo.x;
              const posY = y + campo.y;
              
              // Ajustar posição X com base no alinhamento
              const alinhamento = campo.alinhamento || (campo.tipo === "preco" ? "right" : "left");
              
              if (alinhamento === "center") {
                posX = x + campo.x + (campo.largura / 2);
              } else if (alinhamento === "right") {
                posX = x + campo.x + campo.largura;
              }
              
              // Renderizar texto com alinhamento
              pdf.text(conteudo, posX, posY, { align: alinhamento });
            }
          } else {
            // Adicionar texto padrão se não houver campos definidos
            pdf.setFontSize(10);
            pdf.text("Etiqueta sem elementos", x + 5, y + 5);
          }
          
          currentRow++;
          labelCounter++;
          
          if (labelCounter % 10 === 0) {
            console.log(`Geradas ${labelCounter} etiquetas de ${totalLabels}`);
          }
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

// Função auxiliar para verificar se formato é de etiqueta 90x10
function formato90x10(format: any): boolean {
  if (Array.isArray(format) && format.length === 2) {
    // Verificar se as dimensões são aproximadamente 90x10 ou 10x90
    const [width, height] = format;
    return (
      (Math.abs(width - 90) < 5 && Math.abs(height - 10) < 5) ||
      (Math.abs(width - 10) < 5 && Math.abs(height - 90) < 5)
    );
  }
  return false;
}
