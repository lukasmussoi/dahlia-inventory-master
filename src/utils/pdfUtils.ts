
/**
 * Utilitários para manipulação de PDFs
 * @file Fornece funções para lidar com arquivos PDF
 * @relacionamento Utilizado por controladores que geram PDFs
 */

import { toast } from "sonner";

/**
 * Abre um PDF em uma nova aba do navegador
 * @param pdfDataUri URL ou Data URI do PDF a ser aberto
 */
export const openPdfInNewTab = (pdfUrl: string): void => {
  try {
    console.log("Iniciando abertura do PDF em nova aba");
    
    // Verifica se é uma URL de objeto blob
    if (pdfUrl.startsWith('blob:')) {
      window.open(pdfUrl, '_blank');
      return;
    }
    
    // Verifica se é uma data URI
    if (pdfUrl.startsWith('data:application/pdf;base64,')) {
      window.open(pdfUrl, '_blank');
      return;
    }
    
    // Verifica se é um formato customizado (que precisa ser normalizado)
    if (pdfUrl.startsWith('data:application/pdf;filename=')) {
      // Extrai e formata corretamente a base64
      const base64Start = pdfUrl.indexOf('base64,');
      if (base64Start !== -1) {
        const formattedDataUri = 'data:application/pdf;base64,' + pdfUrl.substring(base64Start + 7);
        window.open(formattedDataUri, '_blank');
        return;
      }
    }
    
    // Se chegou aqui, o formato não é reconhecido
    console.error("Formato de dados inválido:", pdfUrl.substring(0, 100) + "...");
    throw new Error("Formato de dados do PDF inválido");
    
  } catch (error) {
    console.error("Erro ao abrir PDF em nova aba:", error);
    toast.error("Erro ao abrir o PDF. Por favor, tente novamente.");
  }
};

/**
 * Gera etiquetas em PDF para os itens do inventário
 * @param options Opções para geração de etiquetas
 * @returns URL do PDF gerado
 */
export const generatePdfLabel = async (options: any): Promise<string> => {
  try {
    // Importa o utilitário específico para etiquetas
    const { generatePdfLabel: generateLabel } = await import("./pdf/labelGenerator");
    
    // Delega a geração para o módulo especializado
    return await generateLabel(options);
  } catch (error) {
    console.error("Erro ao gerar etiquetas:", error);
    throw error;
  }
};
