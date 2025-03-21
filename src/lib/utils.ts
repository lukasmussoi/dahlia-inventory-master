
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// Função para obter as dimensões da página com base no formato e orientação
export function getPageDimensions(
  formatoPagina: string,
  orientacao: string,
  larguraPagina?: number,
  alturaPagina?: number
): { largura: number; altura: number } {
  // Dimensões padrão para formatos conhecidos em milímetros
  let largura: number = 0;
  let altura: number = 0;

  if (formatoPagina === 'Personalizado' || formatoPagina === 'Custom') {
    largura = larguraPagina || 210;
    altura = alturaPagina || 297;
  } else {
    switch (formatoPagina) {
      case 'A4':
        largura = 210;
        altura = 297;
        break;
      case 'A5':
        largura = 148;
        altura = 210;
        break;
      case 'Letter':
        largura = 216;
        altura = 279;
        break;
      case 'Legal':
        largura = 216;
        altura = 356;
        break;
      default:
        largura = 210;
        altura = 297;
    }
  }

  // Se a orientação for paisagem, inverter largura e altura
  if (orientacao === 'paisagem') {
    return { largura: altura, altura: largura };
  }

  return { largura, altura };
}

// Função para validar se a etiqueta cabe na página
export function validateLabelFitsPage(
  etiquetaLargura: number,
  etiquetaAltura: number,
  formatoPagina: string,
  orientacao: string,
  margemEsquerda: number,
  margemDireita: number,
  margemSuperior: number,
  margemInferior: number,
  larguraPagina?: number,
  alturaPagina?: number
): { valid: boolean; message?: string } {
  // Obter dimensões da página
  const { largura: paginaLargura, altura: paginaAltura } = getPageDimensions(
    formatoPagina,
    orientacao,
    larguraPagina,
    alturaPagina
  );

  // Calcular área útil
  const areaUtilLargura = paginaLargura - margemEsquerda - margemDireita;
  const areaUtilAltura = paginaAltura - margemSuperior - margemInferior;

  // Validar dimensões
  if (areaUtilLargura <= 0) {
    return { 
      valid: false, 
      message: `As margens horizontais (${margemEsquerda}mm + ${margemDireita}mm) excedem a largura da página (${paginaLargura}mm).` 
    };
  }

  if (areaUtilAltura <= 0) {
    return { 
      valid: false, 
      message: `As margens verticais (${margemSuperior}mm + ${margemInferior}mm) excedem a altura da página (${paginaAltura}mm).` 
    };
  }

  if (etiquetaLargura > areaUtilLargura) {
    return { 
      valid: false, 
      message: `A largura da etiqueta (${etiquetaLargura}mm) excede a área útil (${areaUtilLargura}mm).` 
    };
  }

  if (etiquetaAltura > areaUtilAltura) {
    return { 
      valid: false, 
      message: `A altura da etiqueta (${etiquetaAltura}mm) excede a área útil (${areaUtilAltura}mm).` 
    };
  }

  return { valid: true };
}

// Função para garantir que o texto seja uma string
export function ensureString(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value._type === 'undefined') return '';
  return String(value);
}
