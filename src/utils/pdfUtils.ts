
/**
 * Utilitários para geração de PDFs
 * @file Este arquivo reexporta as funções de geração de PDFs de outros módulos
 */

import { generatePdfLabel } from "./pdf/labelGenerator";
import type { GeneratePdfLabelOptions, PdfGenerationResult, ReceiptPdfOptions, AcertoReceiptData } from "./pdf/types";

/**
 * Abre um arquivo PDF em uma nova aba do navegador a partir de uma URL de dados
 * @param dataUrl URL de dados do PDF (formato base64)
 */
export function openPdfInNewTab(dataUrl: string): void {
  try {
    console.log("Iniciando abertura do PDF em nova aba");
    
    // Verificar se a URL é válida
    if (!dataUrl) {
      console.error("URL de dados vazia ou nula");
      throw new Error("URL de dados do PDF inválida");
    }

    let base64Data: string;
    
    // Verificar o formato da URL e extrair dados base64
    if (dataUrl.startsWith('data:application/pdf;base64,')) {
      base64Data = dataUrl.split(',')[1];
    } else if (/^[A-Za-z0-9+/=]+$/.test(dataUrl)) {
      // Assume que já é uma string base64 sem o prefixo
      base64Data = dataUrl;
    } else {
      console.error("Formato de dados inválido:", dataUrl?.substring(0, 50) + "...");
      throw new Error("Formato de dados do PDF inválido");
    }

    // Converter base64 para Blob
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
    
    // Processar em pequenos pedaços para evitar problemas de memória
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    const blob = new Blob(byteArrays, { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);
    
    console.log("Blob URL criada com sucesso:", blobUrl);
    
    // Abrir em nova aba
    window.open(blobUrl, '_blank');
    
    // Limpar a URL do objeto após um tempo
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
      console.log("Blob URL revogada");
    }, 60000); // Revogar após 1 minuto
    
    console.log("PDF aberto com sucesso em nova aba");
  } catch (error) {
    console.error("Erro ao abrir PDF em nova aba:", error);
    alert("Erro ao abrir o PDF. Por favor, tente novamente.");
  }
}

export { generatePdfLabel, type GeneratePdfLabelOptions, type PdfGenerationResult, type ReceiptPdfOptions, type AcertoReceiptData };
