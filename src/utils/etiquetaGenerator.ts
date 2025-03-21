
import { jsPDF } from "jspdf";
import { generateBarcode } from "./barcodeUtils";
import type { ModeloEtiqueta, CampoEtiqueta } from "@/types/etiqueta";

interface GenerateEtiquetaPDFOptions {
  startRow?: number;
  startColumn?: number;
  copias?: number;
}

/**
 * Gera um PDF de etiquetas com base em um modelo personalizado
 * 
 * @param modelo Modelo de etiqueta personalizado
 * @param items Array de itens a serem impressos
 * @param options Opções de configuração
 * @returns URL do arquivo PDF gerado
 */
export async function generateEtiquetaPDF(
  modelo: ModeloEtiqueta,
  items: any[],
  options: GenerateEtiquetaPDFOptions = {}
): Promise<string> {
  const {
    startRow = 1,
    startColumn = 1,
    copias = 1
  } = options;

  console.log("Gerando PDF para modelo:", modelo);
  console.log("Itens para impressão:", items);
  console.log("Opções:", { startRow, startColumn, copias });

  // Configurações da página
  const formatoPagina = modelo.formatoPagina || "A4";
  const orientacao = modelo.orientacao || "retrato";
  
  // Definir dimensões da página
  let larguraPagina: number;
  let alturaPagina: number;
  
  if (formatoPagina === "Personalizado" && modelo.larguraPagina && modelo.alturaPagina) {
    larguraPagina = modelo.larguraPagina;
    alturaPagina = modelo.alturaPagina;
  } else {
    // Dimensões padrão para formatos conhecidos (em mm)
    switch (formatoPagina) {
      case "A4":
        larguraPagina = 210;
        alturaPagina = 297;
        break;
      case "Letter":
        larguraPagina = 216;
        alturaPagina = 279;
        break;
      case "Legal":
        larguraPagina = 216;
        alturaPagina = 356;
        break;
      default:
        larguraPagina = 210;
        alturaPagina = 297;
    }
  }
  
  // Considerar a orientação da página - CORREÇÃO aqui
  let larguraEfetiva = larguraPagina;
  let alturaEfetiva = alturaPagina;
  
  if (orientacao === "paisagem") {
    larguraEfetiva = alturaPagina;
    alturaEfetiva = larguraPagina;
  }
  
  console.log("Dimensões da página:", { 
    larguraPagina, 
    alturaPagina, 
    larguraEfetiva,
    alturaEfetiva,
    orientacao 
  });
  
  // Validar dimensões da etiqueta em relação à página
  const margemSuperior = modelo.margemSuperior || 10;
  const margemInferior = modelo.margemInferior || 10;
  const margemEsquerda = modelo.margemEsquerda || 10;
  const margemDireita = modelo.margemDireita || 10;
  
  // CORREÇÃO: Usar larguraEfetiva e alturaEfetiva aqui
  const areaUtilLargura = larguraEfetiva - margemEsquerda - margemDireita;
  const areaUtilAltura = alturaEfetiva - margemSuperior - margemInferior;
  
  if (modelo.largura > areaUtilLargura) {
    throw new Error(`A largura da etiqueta (${modelo.largura}mm) é maior que a área útil disponível (${areaUtilLargura}mm).`);
  }
  
  if (modelo.altura > areaUtilAltura) {
    throw new Error(`A altura da etiqueta (${modelo.altura}mm) é maior que a área útil disponível (${areaUtilAltura}mm).`);
  }
  
  // Calcular quantas etiquetas cabem por página
  const espacamentoHorizontal = modelo.espacamentoHorizontal || 0;
  const espacamentoVertical = modelo.espacamentoVertical || 0;
  
  const etiquetasPorLinha = Math.floor((areaUtilLargura + espacamentoHorizontal) / (modelo.largura + espacamentoHorizontal));
  const etiquetasPorColuna = Math.floor((areaUtilAltura + espacamentoVertical) / (modelo.altura + espacamentoVertical));
  
  console.log("Cálculo de layout:", {
    etiquetasPorLinha,
    etiquetasPorColuna,
    areaUtilLargura,
    areaUtilAltura
  });
  
  // Criar documento PDF
  const doc = new jsPDF({
    orientation: orientacao === "paisagem" ? "landscape" : "portrait",
    unit: "mm",
    format: formatoPagina === "Personalizado" ? [larguraPagina, alturaPagina] : formatoPagina
  });
  
  // Configuração inicial
  let currentRow = startRow - 1;
  let currentColumn = startColumn - 1;
  
  // Garantir valores válidos
  if (currentRow < 0) currentRow = 0;
  if (currentColumn < 0) currentColumn = 0;
  
  // Cache de códigos de barras
  const barcodeCache: Record<string, string> = {};
  
  // Processar cada item
  for (const item of items) {
    // Para cada cópia do mesmo item
    for (let i = 0; i < copias; i++) {
      // Verificar se precisa de nova página
      if (currentRow >= etiquetasPorColuna) {
        currentRow = 0;
        currentColumn++;
        
        if (currentColumn >= etiquetasPorLinha) {
          currentColumn = 0;
          doc.addPage();
        }
      }
      
      // Calcular posição da etiqueta na página
      const x = margemEsquerda + currentColumn * (modelo.largura + espacamentoHorizontal);
      const y = margemSuperior + currentRow * (modelo.altura + espacamentoVertical);
      
      // Renderizar cada campo da etiqueta
      for (const campo of modelo.campos) {
        await renderCampo(doc, campo, item, x, y, barcodeCache);
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
 * Renderiza um campo individual da etiqueta
 */
async function renderCampo(
  doc: jsPDF,
  campo: CampoEtiqueta,
  item: any,
  etiquetaX: number,
  etiquetaY: number,
  barcodeCache: Record<string, string>
): Promise<void> {
  const x = etiquetaX + campo.x;
  const y = etiquetaY + campo.y;
  
  try {
    switch (campo.tipo) {
      case "nome":
        doc.setFontSize(campo.tamanhoFonte);
        doc.setFont("helvetica", "normal");
        doc.text(item.name || "Sem nome", x, y);
        break;
        
      case "codigo":
        // Gerar ou recuperar código de barras do cache
        const barcodeText = item.barcode || item.sku || "0000000000";
        let barcodeData = barcodeCache[barcodeText];
        
        if (!barcodeData) {
          barcodeData = await generateBarcode(barcodeText);
          barcodeCache[barcodeText] = barcodeData;
        }
        
        doc.addImage(barcodeData, "PNG", x, y, campo.largura, campo.altura);
        break;
        
      case "preco":
        doc.setFontSize(campo.tamanhoFonte);
        doc.setFont("helvetica", "bold");
        const price = typeof item.price === 'number' ? item.price.toFixed(2) : '0.00';
        const priceText = `R$ ${price}`;
        doc.text(priceText, x, y);
        break;
    }
  } catch (error) {
    console.error(`Erro ao renderizar campo ${campo.tipo}:`, error);
  }
}

/**
 * Gera um PDF de pré-visualização do modelo de etiqueta
 */
export async function generatePreviewPDF(modelo: ModeloEtiqueta): Promise<string> {
  // Criar um item de exemplo para pré-visualização
  const itemExemplo = {
    name: "Pingente Cristal",
    barcode: "123456789",
    sku: "PC001",
    price: 99.90
  };
  
  // Usar a função principal para gerar o PDF
  return generateEtiquetaPDF(modelo, [itemExemplo], { copias: 1 });
}
