
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
 * Valida se as dimensões da etiqueta cabem na página considerando margens e orientação
 * @param larguraEtiqueta Largura da etiqueta em mm
 * @param alturaEtiqueta Altura da etiqueta em mm
 * @param configuracaoPagina Configurações da página (dimensões e margens)
 * @returns Objeto com resultado da validação
 */
export function validarDimensoesEtiqueta(
  larguraEtiqueta: number, 
  alturaEtiqueta: number, 
  configuracaoPagina: {
    largura: number;
    altura: number;
    margemSuperior: number;
    margemInferior: number;
    margemEsquerda: number;
    margemDireita: number;
    orientacao: 'retrato' | 'paisagem';
    margemInternaEtiquetaSuperior?: number;
    margemInternaEtiquetaInferior?: number;
    margemInternaEtiquetaEsquerda?: number;
    margemInternaEtiquetaDireita?: number;
  }
) {
  try {
    // Quando a página está em paisagem, trocamos largura e altura
    let larguraPagina = configuracaoPagina.largura;
    let alturaPagina = configuracaoPagina.altura;
    
    if (configuracaoPagina.orientacao === 'paisagem') {
      larguraPagina = configuracaoPagina.altura;
      alturaPagina = configuracaoPagina.largura;
      console.log("Página em paisagem. Dimensões ajustadas:", larguraPagina, "x", alturaPagina);
    }
    
    // Considerar margens internas da etiqueta se fornecidas
    const margemInternaEtiquetaSuperior = configuracaoPagina.margemInternaEtiquetaSuperior || 0;
    const margemInternaEtiquetaInferior = configuracaoPagina.margemInternaEtiquetaInferior || 0;
    const margemInternaEtiquetaEsquerda = configuracaoPagina.margemInternaEtiquetaEsquerda || 0;
    const margemInternaEtiquetaDireita = configuracaoPagina.margemInternaEtiquetaDireita || 0;
    
    // Adicionar margens internas às dimensões da etiqueta
    const larguraEtiquetaTotal = larguraEtiqueta + margemInternaEtiquetaEsquerda + margemInternaEtiquetaDireita;
    const alturaEtiquetaTotal = alturaEtiqueta + margemInternaEtiquetaSuperior + margemInternaEtiquetaInferior;
    
    // Calcular área útil da página
    const areaUtilLargura = larguraPagina - configuracaoPagina.margemEsquerda - configuracaoPagina.margemDireita;
    const areaUtilAltura = alturaPagina - configuracaoPagina.margemSuperior - configuracaoPagina.margemInferior;
    
    console.log("Validação de dimensões:", {
      larguraEtiqueta: larguraEtiquetaTotal,
      alturaEtiqueta: alturaEtiquetaTotal,
      areaUtilLargura,
      areaUtilAltura,
      margens: {
        superior: configuracaoPagina.margemSuperior,
        inferior: configuracaoPagina.margemInferior,
        esquerda: configuracaoPagina.margemEsquerda,
        direita: configuracaoPagina.margemDireita
      },
      margensInternas: {
        superior: margemInternaEtiquetaSuperior,
        inferior: margemInternaEtiquetaInferior,
        esquerda: margemInternaEtiquetaEsquerda,
        direita: margemInternaEtiquetaDireita
      }
    });
    
    // Verificações mais detalhadas
    if (areaUtilLargura <= 0) {
      return {
        valido: false,
        mensagem: `As margens laterais (${configuracaoPagina.margemEsquerda}mm + ${configuracaoPagina.margemDireita}mm) excedem a largura da página (${larguraPagina}mm).`,
        areaUtil: { largura: areaUtilLargura, altura: areaUtilAltura }
      };
    }
    
    if (areaUtilAltura <= 0) {
      return {
        valido: false,
        mensagem: `As margens verticais (${configuracaoPagina.margemSuperior}mm + ${configuracaoPagina.margemInferior}mm) excedem a altura da página (${alturaPagina}mm).`,
        areaUtil: { largura: areaUtilLargura, altura: areaUtilAltura }
      };
    }
    
    if (larguraEtiquetaTotal > areaUtilLargura) {
      return {
        valido: false,
        mensagem: `A largura da etiqueta (${larguraEtiquetaTotal}mm incluindo margens internas) excede a área útil (${areaUtilLargura}mm).`,
        areaUtil: { largura: areaUtilLargura, altura: areaUtilAltura }
      };
    }
    
    if (alturaEtiquetaTotal > areaUtilAltura) {
      return {
        valido: false,
        mensagem: `A altura da etiqueta (${alturaEtiquetaTotal}mm incluindo margens internas) excede a área útil (${areaUtilAltura}mm).`,
        areaUtil: { largura: areaUtilLargura, altura: areaUtilAltura }
      };
    }
    
    return {
      valido: true,
      mensagem: `A etiqueta de ${larguraEtiqueta}x${alturaEtiqueta}mm cabe perfeitamente na área útil de ${areaUtilLargura}x${areaUtilAltura}mm.`,
      areaUtil: { largura: areaUtilLargura, altura: areaUtilAltura }
    };
  } catch (error) {
    console.error("Erro na validação de dimensões da etiqueta:", error);
    return {
      valido: false,
      mensagem: "Erro ao validar dimensões da etiqueta. Verifique os valores informados.",
      areaUtil: null
    };
  }
}
