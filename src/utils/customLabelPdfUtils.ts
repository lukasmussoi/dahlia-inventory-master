
import { CustomLabel } from "@/models/labelModel";
import { jsPDF } from "jspdf";
import { Json } from "@/integrations/supabase/types";

// Interface para tipo de campo na etiqueta
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

// Função para converter JSONB para campos de etiqueta tipados
export function parseJsonToCampoEtiqueta(json: Json): CampoEtiqueta[] {
  if (!json) return [];
  
  if (!Array.isArray(json)) {
    console.error("Json inválido para campos:", json);
    return [];
  }
  
  try {
    return json.map(item => {
      // Verificar se o item é um objeto antes de acessar as propriedades
      if (typeof item === 'object' && item !== null) {
        const campoItem = item as Record<string, unknown>;
        return {
          type: typeof campoItem.type === 'string' ? campoItem.type : 'text',
          text: typeof campoItem.text === 'string' ? campoItem.text : '',
          left: typeof campoItem.left === 'number' ? campoItem.left : 0,
          top: typeof campoItem.top === 'number' ? campoItem.top : 0,
          width: typeof campoItem.width === 'number' ? campoItem.width : 100,
          height: typeof campoItem.height === 'number' ? campoItem.height : 30,
          fontSize: typeof campoItem.fontSize === 'number' ? campoItem.fontSize : 12,
          fontFamily: typeof campoItem.fontFamily === 'string' ? campoItem.fontFamily : 'helvetica',
          fontWeight: typeof campoItem.fontWeight === 'string' ? campoItem.fontWeight : 'normal',
          fill: typeof campoItem.fill === 'string' ? campoItem.fill : '#000000',
          textAlign: typeof campoItem.textAlign === 'string' ? campoItem.textAlign : 'left',
          barcodeType: typeof campoItem.barcodeType === 'string' ? campoItem.barcodeType : 'CODE128'
        } as CampoEtiqueta;
      }
      // Retornar um objeto padrão para itens inválidos
      return {
        type: 'text',
        text: 'Erro',
        left: 0,
        top: 0,
        width: 100,
        height: 30,
        fontSize: 12,
        fontFamily: 'helvetica',
        fontWeight: 'normal',
        fill: '#000000',
        textAlign: 'left'
      } as CampoEtiqueta;
    });
  } catch (error) {
    console.error("Erro ao processar campos da etiqueta:", error);
    return [];
  }
}

// Função para gerar PDF de etiquetas customizadas
export function generateCustomLabelPDF(
  etiqueta: CustomLabel,
  quantidade: number = 1
): jsPDF {
  const pdf = new jsPDF({
    orientation: etiqueta.orientacao as any,
    unit: 'mm',
    format: etiqueta.formato_pagina
  });

  // Configurações da página
  const margemSuperior = Number(etiqueta.margem_superior);
  const margemEsquerda = Number(etiqueta.margem_esquerda);
  const margemDireita = Number(etiqueta.margem_direita);
  const margemInferior = Number(etiqueta.margem_inferior);
  const larguraEtiqueta = Number(etiqueta.largura);
  const alturaEtiqueta = Number(etiqueta.altura);
  const espacamentoHorizontal = Number(etiqueta.espacamento_horizontal);
  const espacamentoVertical = Number(etiqueta.espacamento_vertical);

  // Dimensões da página
  let larguraPagina = etiqueta.formato_pagina === 'A4' ? 210 : 
                     (etiqueta.largura_pagina ? Number(etiqueta.largura_pagina) : 210);
  let alturaPagina = etiqueta.formato_pagina === 'A4' ? 297 : 
                    (etiqueta.altura_pagina ? Number(etiqueta.altura_pagina) : 297);

  if (etiqueta.orientacao === 'landscape') {
    [larguraPagina, alturaPagina] = [alturaPagina, larguraPagina];
  }

  // Área útil da página
  const larguraUtil = larguraPagina - margemEsquerda - margemDireita;
  const alturaUtil = alturaPagina - margemSuperior - margemInferior;

  // Calcular número de etiquetas por linha e por coluna
  const etiquetasPorLinha = Math.floor(larguraUtil / (larguraEtiqueta + espacamentoHorizontal));
  const etiquetasPorColuna = Math.floor(alturaUtil / (alturaEtiqueta + espacamentoVertical));

  // Converter campos de JSON para objetos tipados
  const campos = parseJsonToCampoEtiqueta(etiqueta.campos);

  // Contador para número de etiquetas geradas
  let etiquetasGeradas = 0;
  let paginaAtual = 1;

  const etiquetasTotais = Math.min(quantidade, 1000); // Limite de 1000 etiquetas para evitar problemas
  
  while (etiquetasGeradas < etiquetasTotais) {
    // Posição inicial para a etiqueta atual
    const linha = Math.floor(etiquetasGeradas % (etiquetasPorLinha * etiquetasPorColuna) / etiquetasPorLinha);
    const coluna = etiquetasGeradas % etiquetasPorLinha;
    
    const xBase = margemEsquerda + coluna * (larguraEtiqueta + espacamentoHorizontal);
    const yBase = margemSuperior + linha * (alturaEtiqueta + espacamentoVertical);
    
    // Desenhar borda da etiqueta (para visualização)
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.1);
    pdf.rect(xBase, yBase, larguraEtiqueta, alturaEtiqueta);
    
    // Renderizar campos
    campos.forEach(campo => {
      const x = xBase + campo.left;
      const y = yBase + campo.top;
      
      if (campo.type === 'text' || campo.type === 'price' || campo.type === 'sku') {
        // Configurar fonte
        pdf.setFont(campo.fontFamily || 'helvetica', campo.fontWeight === 'bold' ? 'bold' : 'normal');
        pdf.setFontSize(campo.fontSize || 12);
        
        // Converter cor de preenchimento para números RGB
        const hexToRgb = (hex: string) => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '#000000');
          return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
          } : { r: 0, g: 0, b: 0 };
        };
        
        const rgb = hexToRgb(campo.fill || '#000000');
        pdf.setTextColor(rgb.r, rgb.g, rgb.b);
        
        // Definir alinhamento
        const textAlign = campo.textAlign || 'left';
        const alignX = textAlign === 'center' ? x + (campo.width / 2) :
                      textAlign === 'right' ? x + campo.width : x;
        
        // Texto com quebra de linha se necessário
        pdf.text(
          campo.text || '', 
          alignX, 
          y + (campo.fontSize || 12) / 2.83, // Ajuste para alinhar verticalmente
          { 
            align: textAlign as any,
            maxWidth: campo.width
          }
        );
      } else if (campo.type === 'barcode') {
        // Placeholder para código de barras
        pdf.setDrawColor(150, 150, 150);
        pdf.setFillColor(240, 240, 240);
        pdf.rect(x, y, campo.width, campo.height || 20, 'FD');
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(0, 0, 0);
        pdf.text('CÓDIGO DE BARRAS', x + (campo.width / 2), y + ((campo.height || 20) / 2), { align: 'center' });
      }
    });
    
    etiquetasGeradas++;
    
    // Verificar se precisamos adicionar uma nova página
    const etiquetasPorPagina = etiquetasPorLinha * etiquetasPorColuna;
    if (etiquetasGeradas < etiquetasTotais && etiquetasGeradas % etiquetasPorPagina === 0) {
      pdf.addPage();
      paginaAtual++;
    }
  }
  
  return pdf;
}

// Função para imprimir etiqueta customizada
export async function printCustomLabel(
  etiqueta: CustomLabel,
  quantidade: number = 1
): Promise<void> {
  try {
    const pdf = generateCustomLabelPDF(etiqueta, quantidade);
    
    // Abrir em nova janela para impressão
    const pdfBlob = pdf.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(pdfUrl, '_blank');
    
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        setTimeout(() => {
          printWindow.print();
        }, 1000);
      });
    } else {
      throw new Error("Não foi possível abrir a janela de impressão. Verifique se o bloqueador de pop-ups está ativado.");
    }
  } catch (error) {
    console.error("Erro ao imprimir etiqueta:", error);
    throw error;
  }
}
