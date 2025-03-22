
/**
 * Utilitários para manipulação de elementos de etiquetas
 */

/**
 * Obtém o texto apropriado para um elemento em modo de pré-visualização
 * @param element Elemento da etiqueta
 * @param item Item de dados para o elemento
 * @returns Texto formatado para o elemento
 */
export const getElementPreviewText = (element: any, item: any): string => {
  if (!element || !element.type) return "";

  // Usar valor específico para o tipo de elemento, ou valor padrão
  switch (element.type) {
    case 'nome':
      return element.valor || item?.name || "Nome do Produto";
    
    case 'codigo':
      return element.valor || item?.sku || item?.code || "SKU12345";
    
    case 'preco':
      if (element.valor) return element.valor;
      const preco = item?.price || 99.90;
      return `R$ ${typeof preco === 'number' ? preco.toFixed(2) : preco}`;
    
    case 'texto':
      return element.valor || "Texto";
    
    default:
      return element.valor || "Elemento";
  }
};
