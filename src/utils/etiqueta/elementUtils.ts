
/**
 * Utilitários para elementos de etiquetas
 */

/**
 * Obtém texto de exemplo para cada tipo de elemento
 * @param type Tipo do elemento
 * @returns Texto de exemplo para o tipo especificado
 */
export const getElementPreviewText = (type: string): string => {
  switch (type) {
    case 'nome':
      return 'Pingente Cristal';
    case 'codigo':
      return '123456789';
    case 'preco':
      return 'R$ 99,90';
    default:
      return 'Exemplo';
  }
};

