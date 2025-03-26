
/**
 * Utilitários para geração de PDF
 */
import { toast } from "sonner";
import { generatePdfLabel as generateLabel } from "@/utils/pdf/labelGenerator";
import type { GeneratePdfLabelOptions } from "@/utils/pdf/types";

/**
 * Abre um PDF em uma nova aba do navegador
 * @param pdfUrl URL do PDF a ser aberto
 */
export const openPdfInNewTab = (pdfUrl: string): void => {
  if (!pdfUrl) {
    toast.error("URL do PDF não fornecida");
    return;
  }

  const newWindow = window.open();
  if (newWindow) {
    newWindow.document.write(`
      <iframe src="${pdfUrl}" width="100%" height="100%" style="border: none;"></iframe>
    `);
  } else {
    toast.error("Não foi possível abrir o PDF. Verifique se o bloqueador de pop-ups está ativo.");
  }
};

/**
 * Gera um PDF com etiquetas baseado nas opções fornecidas
 * 
 * @param options Opções para geração do PDF
 * @returns Uma Promise com a URL do PDF gerado
 */
export const generatePdfLabel = async (options: GeneratePdfLabelOptions): Promise<string> => {
  // Usamos a mesma função do arquivo labelGenerator.ts para manter consistência
  return await generateLabel(options);
};
