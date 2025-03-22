
/**
 * Utilitários para renderização de elementos em etiquetas
 */

/**
 * Retorna o texto de exemplo para pré-visualização com base no tipo do elemento
 * @param type Tipo do elemento
 * @param item Item opcional para dados reais
 * @returns Texto para pré-visualização
 */
export const getElementPreviewText = (type: string, item?: any): string => {
  switch (type) {
    case 'nome':
      return item?.name || 'Pingente Cristal';
    case 'codigo':
      return item?.sku || item?.barcode || '123456789';
    case 'preco':
      if (item?.price) {
        const price = typeof item.price === 'number' ? item.price.toFixed(2) : item.price;
        return `R$ ${price}`;
      }
      return 'R$ 99,90';
    default:
      return type || 'Elemento';
  }
};

/**
 * Obtém texto real do elemento com base no item fornecido
 * @param type Tipo do elemento
 * @param item Item com os dados reais
 * @returns Texto real para o elemento
 */
export const getElementRealText = (type: string, item: any): string => {
  if (!item) return getElementPreviewText(type);
  
  switch (type) {
    case 'nome':
      return item.name || '';
    case 'codigo':
      return item.sku || item.barcode || '';
    case 'preco':
      if (typeof item.price === 'number') {
        return `R$ ${item.price.toFixed(2)}`;
      }
      return item.price ? `R$ ${item.price}` : '';
    default:
      return '';
  }
};

/**
 * Verifica se o elemento é um código de barras
 * @param type Tipo do elemento
 * @returns True se for um código de barras
 */
export const isBarcode = (type: string): boolean => {
  return type === 'codigo';
};

/**
 * Formata o código de barras para garantir compatibilidade com Code128
 * @param code Código a ser formatado
 * @returns Código formatado
 */
export const formatBarcodeValue = (code: string): string => {
  // Remover caracteres especiais que podem interferir no código de barras
  return code.replace(/[^\w\d]/g, '').substring(0, 20);
};
