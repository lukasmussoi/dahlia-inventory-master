
/**
 * Utilitários para validação de PDFs
 */
import { ModeloEtiqueta } from "@/types/etiqueta";

/**
 * Validar as dimensões do modelo de etiqueta
 * @param modelo Modelo de etiqueta a ser validado
 * @returns Mensagem de erro ou null se válido
 */
export function validateLabelDimensions(modelo: ModeloEtiqueta): string | null {
  // Verificar se largura e altura estão definidos
  if (!modelo.largura || !modelo.altura) {
    return "Dimensões da etiqueta não definidas";
  }

  // Verificar se largura e altura são valores razoáveis
  if (modelo.largura <= 0 || modelo.altura <= 0) {
    return "Dimensões da etiqueta devem ser maiores que zero";
  }

  // Verificar formato personalizado da página
  if (modelo.formatoPagina === "Personalizado") {
    if (!modelo.larguraPagina || !modelo.alturaPagina) {
      return "Dimensões da página não definidas para formato personalizado";
    }

    // Verificar se as dimensões da etiqueta cabem na página
    const areaUtilLargura = modelo.larguraPagina - modelo.margemEsquerda - modelo.margemDireita;
    if (modelo.largura > areaUtilLargura) {
      return `A largura da etiqueta (${modelo.largura}mm) é maior que a área útil disponível (${areaUtilLargura}mm)`;
    }

    const areaUtilAltura = modelo.alturaPagina - modelo.margemSuperior - modelo.margemInferior;
    if (modelo.altura > areaUtilAltura) {
      return `A altura da etiqueta (${modelo.altura}mm) é maior que a área útil disponível (${areaUtilAltura}mm)`;
    }
  }

  return null;
}

/**
 * Validar se uma string é uma URL de dados PDF válida
 * @param dataUrl String a ser validada
 * @returns Verdadeiro se for uma URL de dados PDF válida
 */
export function validatePdfDataUrl(dataUrl: string): boolean {
  if (!dataUrl) return false;
  return dataUrl.startsWith('data:application/pdf;base64,') && dataUrl.length > 100;
}
