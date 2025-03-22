
/**
 * Gerador de PDFs para impressão de etiquetas
 */
import JsPDF from 'jspdf';
import { toast } from 'sonner';
import type { ModeloEtiqueta } from '@/types/etiqueta';
import { calcularDimensoesPagina, calcularEtiquetasPorPagina, createPdfDocument, normalizarMargens, normalizarEspacamentos } from './documentUtils';
import { EtiquetaPrintOptions } from './types';

/**
 * Gera PDF de etiquetas para impressão
 * @param modelo Modelo de etiqueta
 * @param items Itens para gerar etiquetas
 * @param options Opções de impressão
 * @returns URL do PDF gerado
 */
export const generateEtiquetaPDF = async (
  modelo: ModeloEtiqueta,
  items: any[],
  options: EtiquetaPrintOptions
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
    
    // Calcular dimensões da página
    const { pageWidth, pageHeight } = calcularDimensoesPagina(
      formatoPagina,
      orientacao,
      larguraPagina,
      alturaPagina
    );
    
    console.log("Dimensões da página:", pageWidth, "x", pageHeight, "orientação:", orientacao);
    console.log("Margens:", margemSuperior, margemInferior, margemEsquerda, margemDireita);
    console.log("Espaçamentos:", espacamentoHorizontal, espacamentoVertical);
    
    // Criar documento PDF
    const pdf = createPdfDocument(
      formatoPagina, 
      orientacao, 
      pageWidth, 
      pageHeight
    );
    
    // Normalizar margens e espaçamentos
    const margensValidas = normalizarMargens(margemSuperior, margemInferior, margemEsquerda, margemDireita);
    const espacamentosValidos = normalizarEspacamentos(espacamentoHorizontal, espacamentoVertical);
    
    // Garantir que as dimensões da etiqueta são válidas
    const etiquetaLargura = largura > 0 ? largura : 50;
    const etiquetaAltura = altura > 0 ? altura : 30;
    
    // Calcular quantas etiquetas cabem na página
    const { etiquetasPorLinha, etiquetasPorColuna } = calcularEtiquetasPorPagina(
      pageWidth,
      pageHeight,
      etiquetaLargura,
      etiquetaAltura,
      margensValidas,
      espacamentosValidos
    );
    
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
