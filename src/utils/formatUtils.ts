
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
 * Formata um valor numérico para o formato de moeda (R$)
 * Alias para formatMoney para manter compatibilidade com código existente
 * @param value Valor a ser formatado
 * @returns String formatada
 */
export function formatPrice(value: number): string {
  return formatMoney(value);
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

/**
 * Formata um número de telefone para o formato (xx) xxxxx-xxxx
 * @param phone Número de telefone a ser formatado
 * @returns String formatada
 */
export function formatPhone(phone: string): string {
  if (!phone) return '';
  
  // Remove todos os caracteres não numéricos
  const numbers = phone.replace(/\D/g, '');
  
  // Verifica se é celular (11 dígitos) ou telefone fixo (10 dígitos)
  if (numbers.length === 11) {
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (numbers.length === 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return phone; // Retorna original se não conseguir formatar
}

/**
 * Formata um CPF (11 dígitos) ou CNPJ (14 dígitos)
 * @param value CPF ou CNPJ a ser formatado
 * @returns String formatada
 */
export function formatCPFOrCNPJ(value: string): string {
  if (!value) return '';
  
  // Remove todos os caracteres não numéricos
  const numbers = value.replace(/\D/g, '');
  
  // Verifica se é CPF (11 dígitos) ou CNPJ (14 dígitos)
  if (numbers.length === 11) {
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (numbers.length === 14) {
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  
  return value; // Retorna original se não conseguir formatar
}

/**
 * Formata um CEP para o formato xxxxx-xxx
 * @param zipCode CEP a ser formatado
 * @returns String formatada
 */
export function formatZipCode(zipCode: string): string {
  if (!zipCode) return '';
  
  // Remove todos os caracteres não numéricos
  const numbers = zipCode.replace(/\D/g, '');
  
  if (numbers.length === 8) {
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
  
  return zipCode; // Retorna original se não conseguir formatar
}

