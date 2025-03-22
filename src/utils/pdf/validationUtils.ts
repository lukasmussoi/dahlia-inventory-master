
/**
 * Utilitários para validação de dimensões de etiquetas e páginas
 */
import type { ModeloEtiqueta } from "@/types/etiqueta";

/**
 * Valida as dimensões da etiqueta em relação à página
 * @param modelo O modelo de etiqueta para validação
 * @returns Uma mensagem de erro se houver problemas, ou null se estiver tudo correto
 */
export function validateLabelDimensions(modelo: ModeloEtiqueta): string | null {
  // Validar dimensões da página personalizada
  if (modelo.formatoPagina === "Personalizado") {
    console.log("Verificando dimensões personalizadas:", {
      larguraPagina: modelo.larguraPagina,
      alturaPagina: modelo.alturaPagina
    });
    
    // Se as dimensões não estiverem definidas, retornar erro
    if (!modelo.larguraPagina || !modelo.alturaPagina) {
      return "Dimensões personalizadas não definidas. Por favor, defina a largura e altura da página.";
    }
    
    // Validar valores positivos
    if (modelo.larguraPagina <= 0 || modelo.alturaPagina <= 0) {
      console.error("Dimensões de página inválidas:", { 
        largura: modelo.larguraPagina, 
        altura: modelo.alturaPagina 
      });
      return "Dimensões de página personalizadas inválidas. Os valores devem ser maiores que zero.";
    }
    
    // Validar se a etiqueta cabe na página
    const areaUtilLargura = modelo.larguraPagina - modelo.margemEsquerda - modelo.margemDireita;
    if (modelo.largura > areaUtilLargura) {
      console.error("Etiqueta maior que área útil:", {
        larguraEtiqueta: modelo.largura,
        areaUtilLargura
      });
      
      const sugestaoLarguraEtiqueta = Math.floor(areaUtilLargura * 0.9);
      return `A largura da etiqueta (${modelo.largura}mm) é maior que a área útil disponível (${areaUtilLargura}mm). ` +
        `Sugestão: Reduza a largura da etiqueta para ${sugestaoLarguraEtiqueta}mm ou ` +
        `aumente a largura da página/reduza as margens.`;
    }
    
    const areaUtilAltura = modelo.alturaPagina - modelo.margemSuperior - modelo.margemInferior;
    if (modelo.altura > areaUtilAltura) {
      console.error("Etiqueta maior que área útil:", {
        alturaEtiqueta: modelo.altura,
        areaUtilAltura
      });
      
      const sugestaoAlturaEtiqueta = Math.floor(areaUtilAltura * 0.9);
      return `A altura da etiqueta (${modelo.altura}mm) é maior que a área útil disponível (${areaUtilAltura}mm). ` +
        `Sugestão: Reduza a altura da etiqueta para ${sugestaoAlturaEtiqueta}mm ou ` +
        `aumente a altura da página/reduza as margens.`;
    }
  }
  
  // Validar se há campos definidos
  if (!modelo.campos || modelo.campos.length === 0) {
    console.error("Modelo sem campos definidos");
    return "O modelo de etiqueta não possui elementos para impressão. Adicione elementos ao modelo.";
  }
  
  return null;
}
