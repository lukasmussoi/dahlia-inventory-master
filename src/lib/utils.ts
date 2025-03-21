
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
export function validateDocumentSize(width: number, height: number, format: string, orientation: string = 'portrait'): { width: number, height: number } {
  // Se for formato pequeno de etiqueta
  if (format === 'etiqueta-pequena' || format === 'custom-label-small') {
    // Para etiqueta pequena, sempre força o formato 90x10 paisagem
    return { width: 90, height: 10 };
  }
  
  let dimensions: { width: number, height: number };
  
  // Para outros formatos predefinidos
  switch (format) {
    case 'A4':
      dimensions = { width: 210, height: 297 };
      break;
    case 'A5':
      dimensions = { width: 148, height: 210 };
      break;
    case 'Letter':
      dimensions = { width: 216, height: 279 };
      break;
    case 'Legal':
      dimensions = { width: 216, height: 356 };
      break;
    default:
      // Para formatos personalizados, garantir dimensões mínimas
      dimensions = { 
        width: Math.max(width, 10), 
        height: Math.max(height, 10) 
      };
      break;
  }
  
  // Ajustar dimensões com base na orientação
  if (orientation === 'landscape' && dimensions.height > dimensions.width) {
    return { width: dimensions.height, height: dimensions.width };
  }
  
  return dimensions;
}
