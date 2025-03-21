
/**
 * Formata um valor numérico para moeda brasileira (R$)
 * @param value Valor a ser formatado
 * @returns String formatada
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

/**
 * Formata uma data para o formato brasileiro (dd/mm/yyyy)
 * @param dateString String de data ISO ou objeto Date
 * @returns String formatada
 */
export const formatDate = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};
