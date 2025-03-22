
/**
 * Gerador de PDFs de pré-visualização de etiquetas
 */
import JsPDF from 'jspdf';
import { renderLabelElements } from './renderUtils';
import { PreviewPDFOptions } from './types';

/**
 * Gera um PDF de pré-visualização para um modelo de etiqueta
 * @param options Opções de configuração da pré-visualização
 * @returns URL do PDF gerado
 */
export const generatePreviewPDF = async (options: PreviewPDFOptions): Promise<string> => {
  try {
    const {
      modelName,
      labels,
      pageFormat,
      pageSize,
      margins,
      spacing,
      autoAdjustDimensions = false,
      orientation = 'retrato'
    } = options;

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

    // Criar o documento PDF com a orientação correta
    const pdf = new JsPDF({
      orientation: orientation === 'paisagem' ? 'landscape' : 'portrait',
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
    pdf.text(`Orientação: ${orientation === 'paisagem' ? 'Paisagem' : 'Retrato'}`, 10, 35);
    pdf.text(`Dimensões: ${pageSize.width} × ${pageSize.height} mm`, 10, 40);
    pdf.text(`Dimensões da etiqueta: ${labels[0].width} × ${labels[0].height} mm`, 10, 45);
    pdf.text(`Margens: Superior: ${margins.top}mm, Inferior: ${margins.bottom}mm, Esquerda: ${margins.left}mm, Direita: ${margins.right}mm`, 10, 50);
    pdf.text(`Espaçamento: Horizontal: ${spacing.horizontal}mm, Vertical: ${spacing.vertical}mm`, 10, 55);

    // Desenhar borda da página
    pdf.setDrawColor(200, 200, 200);
    pdf.rect(margins.left, margins.top, pageSize.width - margins.left - margins.right, pageSize.height - margins.top - margins.bottom);

    // Calcular quantas etiquetas cabem na página
    const columnsPerPage = Math.floor((pageSize.width - margins.left - margins.right + spacing.horizontal) / (labels[0].width + spacing.horizontal));
    const rowsPerPage = Math.floor((pageSize.height - margins.top - margins.bottom + spacing.vertical) / (labels[0].height + spacing.vertical));

    pdf.setFontSize(10);
    pdf.text(`Disposição: ${columnsPerPage} × ${rowsPerPage} (colunas × linhas)`, 10, 60);
    pdf.text(`Total de etiquetas por página: ${columnsPerPage * rowsPerPage}`, 10, 65);

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
