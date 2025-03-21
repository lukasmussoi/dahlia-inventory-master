
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

export function formatCurrencySimple(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

export function formatDate(date: Date | string): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function formatDateTime(date: Date | string): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// Função para garantir que o tamanho do documento esteja correto
export function validateDocumentSize(width: number, height: number, format: string): { width: number, height: number } {
  // Se for formato pequeno de etiqueta
  if (format === 'etiqueta-pequena' || format === 'custom-label-small') {
    return { width: 90, height: 10 };
  }
  
  // Para outros formatos predefinidos
  switch (format) {
    case 'A4':
      return { width: 210, height: 297 };
    case 'A5':
      return { width: 148, height: 210 };
    case 'Letter':
      return { width: 216, height: 279 };
    case 'Legal':
      return { width: 216, height: 356 };
    default:
      // Para formatos personalizados, garantir dimensões mínimas
      return { 
        width: Math.max(width, 10), 
        height: Math.max(height, 10) 
      };
  }
}

