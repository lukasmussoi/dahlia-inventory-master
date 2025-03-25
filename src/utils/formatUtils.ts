
/**
 * Utilidades de Formatação
 * @file Contém funções para formatação de diversos tipos de dados
 * @relacionamento Utilizado por vários componentes do sistema
 */

import { SuitcaseStatus } from "@/types/suitcase";

/**
 * Formata o status da maleta para exibição na interface
 * @param status Status da maleta
 * @returns String formatada do status
 */
export const formatStatus = (status: SuitcaseStatus): string => {
  switch (status) {
    case 'in_use':
      return 'Em uso';
    case 'returned':
      return 'Devolvida';
    case 'in_replenishment':
      return 'Em reabastecimento';
    case 'lost':
      return 'Extraviada';
    case 'in_audit':
      return 'Em auditoria';
    default:
      return 'Desconhecido';
  }
};

/**
 * Formata um valor monetário para exibição
 * @param value Valor a ser formatado
 * @returns String formatada como moeda
 */
export const formatMoney = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

/**
 * Formata um valor para exibição como preço
 * @param value Valor a ser formatado
 * @returns String formatada como preço
 */
export const formatPrice = (value: number): string => {
  return formatMoney(value);
};

/**
 * Formata uma data para exibição
 * @param date Data a ser formatada
 * @returns String formatada como data
 */
export const formatDate = (date: Date | string): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(dateObj);
};

/**
 * Formata um número de telefone para exibição
 * @param phone Número de telefone a ser formatado
 * @returns String formatada como telefone
 */
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
};

/**
 * Formata um CPF ou CNPJ para exibição
 * @param cpfCnpj CPF ou CNPJ a ser formatado
 * @returns String formatada como CPF ou CNPJ
 */
export const formatCPFOrCNPJ = (cpfCnpj: string): string => {
  const cleaned = cpfCnpj.replace(/\D/g, '');
  
  if (cleaned.length <= 11) {
    // Formatação de CPF: 000.000.000-00
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else {
    // Formatação de CNPJ: 00.000.000/0000-00
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
};

/**
 * Formata um CEP para exibição
 * @param zipCode CEP a ser formatado
 * @returns String formatada como CEP
 */
export const formatZipCode = (zipCode: string): string => {
  const cleaned = zipCode.replace(/\D/g, '');
  return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
};
