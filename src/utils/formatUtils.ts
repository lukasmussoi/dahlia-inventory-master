
/**
 * Utilitários para formatação de dados
 * @file Este arquivo contém funções para formatação de valores
 */

/**
 * Formata um valor numérico para o formato de moeda (R$)
 * @param value Valor a ser formatado
 * @param options Opções de formatação
 * @returns String formatada
 */
export function formatMoney(value: number, options?: Intl.NumberFormatOptions): string {
  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  };

  const mergedOptions = { ...defaultOptions, ...options };

  return new Intl.NumberFormat('pt-BR', mergedOptions).format(value || 0);
}

/**
 * Formata uma data para o formato dd/mm/yyyy
 * @param date Data a ser formatada
 * @returns String formatada
 */
export function formatDate(date: Date | string | null): string {
  if (!date) return '-';
  
  const dateObject = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(dateObject);
}

/**
 * Formata um número com casas decimais
 * @param value Valor a ser formatado
 * @param decimals Número de casas decimais
 * @returns String formatada
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value || 0);
}
