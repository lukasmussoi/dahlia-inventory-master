
/**
 * Funções de Formatação
 * @file Funções úteis para formatação de valores em todo o sistema
 */

// Formato de moeda
export const formatMoney = (value: number) => {
  if (value === undefined || value === null) return "R$ 0,00";
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Para compatibilidade com código existente
export const formatPrice = formatMoney;

// Formato de CPF/CNPJ
export const formatCPFOrCNPJ = (value: string): string => {
  if (!value) return '';
  
  const cleanValue = value.replace(/\D/g, '');
  
  if (cleanValue.length === 11) {
    // CPF: 123.456.789-01
    return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (cleanValue.length === 14) {
    // CNPJ: 12.345.678/0001-90
    return cleanValue.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  
  return cleanValue;
};

// Formato de telefone
export const formatPhone = (value: string): string => {
  if (!value) return '';
  
  const cleanValue = value.replace(/\D/g, '');
  
  if (cleanValue.length === 11) {
    // Celular com DDD: (99) 99999-9999
    return cleanValue.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleanValue.length === 10) {
    // Telefone fixo com DDD: (99) 9999-9999
    return cleanValue.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return cleanValue;
};

// Formato de CEP
export const formatCEP = (value: string): string => {
  if (!value) return '';
  
  const cleanValue = value.replace(/\D/g, '');
  
  if (cleanValue.length === 8) {
    // CEP: 12345-678
    return cleanValue.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
  
  return cleanValue;
};

// Alias para formatCEP (para compatibilidade)
export const formatZipCode = formatCEP;

// Formato de data
export const formatDate = (date: Date | string): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toLocaleDateString('pt-BR');
};

// Formato de data e hora
export const formatDateTime = (date: Date | string): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toLocaleDateString('pt-BR') + ' ' + 
    dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};
