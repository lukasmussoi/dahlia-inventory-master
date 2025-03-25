
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
