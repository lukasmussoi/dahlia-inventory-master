
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

/**
 * Obtém as dimensões da página com base no formato e orientação
 * @param formato Formato da página (A4, Letter, etc)
 * @param orientacao Orientação (retrato ou paisagem)
 * @param larguraPersonalizada Largura personalizada (usado quando formato é "Personalizado")
 * @param alturaPersonalizada Altura personalizada (usado quando formato é "Personalizado")
 * @returns Dimensões da página em milímetros
 */
export function getDimensoesPagina(
  formato: string,
  orientacao: 'retrato' | 'paisagem',
  larguraPersonalizada?: number,
  alturaPersonalizada?: number
): { largura: number, altura: number } {
  // Dimensões em mm
  let largura = 0;
  let altura = 0;

  if (formato === "Personalizado" && larguraPersonalizada && alturaPersonalizada) {
    largura = larguraPersonalizada;
    altura = alturaPersonalizada;
  } else {
    // Dimensões padrão dos formatos comuns em mm
    switch (formato) {
      case "A4":
        largura = 210;
        altura = 297;
        break;
      case "Letter":
        largura = 216;
        altura = 279;
        break;
      case "Legal":
        largura = 216;
        altura = 356;
        break;
      default:
        largura = 210;
        altura = 297;
        break;
    }
  }

  // Inverter dimensões para paisagem
  if (orientacao === 'paisagem') {
    return { largura: altura, altura: largura };
  }

  return { largura, altura };
}

/**
 * Valida se uma etiqueta cabe dentro de uma página com as margens especificadas
 * @param etiquetaLargura Largura da etiqueta em mm
 * @param etiquetaAltura Altura da etiqueta em mm
 * @param pagina Dimensões e configurações da página
 * @returns Objeto com validação e mensagens de erro se houver
 */
export function validarDimensoesEtiqueta(
  etiquetaLargura: number,
  etiquetaAltura: number,
  pagina: {
    largura: number,
    altura: number,
    margemSuperior: number,
    margemInferior: number,
    margemEsquerda: number,
    margemDireita: number,
    orientacao?: 'retrato' | 'paisagem'
  }
): { valido: boolean, mensagem?: string } {
  // Ajustar dimensões com base na orientação
  let larguraEfetiva = pagina.largura;
  let alturaEfetiva = pagina.altura;
  
  if (pagina.orientacao === 'paisagem') {
    larguraEfetiva = pagina.altura;
    alturaEfetiva = pagina.largura;
  }
  
  // Calcular área útil da página
  const areaUtilLargura = larguraEfetiva - pagina.margemEsquerda - pagina.margemDireita;
  const areaUtilAltura = alturaEfetiva - pagina.margemSuperior - pagina.margemInferior;

  // Verificar se as margens são válidas
  if (areaUtilLargura <= 0) {
    return {
      valido: false,
      mensagem: `As margens laterais (${pagina.margemEsquerda}mm + ${pagina.margemDireita}mm) excedem a largura da página (${larguraEfetiva}mm).`
    };
  }

  if (areaUtilAltura <= 0) {
    return {
      valido: false,
      mensagem: `As margens verticais (${pagina.margemSuperior}mm + ${pagina.margemInferior}mm) excedem a altura da página (${alturaEfetiva}mm).`
    };
  }

  // Verificar se a etiqueta cabe na área útil
  if (etiquetaLargura > areaUtilLargura) {
    return {
      valido: false,
      mensagem: `A largura da etiqueta (${etiquetaLargura}mm) excede a área útil (${areaUtilLargura}mm).`
    };
  }

  if (etiquetaAltura > areaUtilAltura) {
    return {
      valido: false,
      mensagem: `A altura da etiqueta (${etiquetaAltura}mm) excede a área útil (${areaUtilAltura}mm).`
    };
  }

  return { valido: true };
}
