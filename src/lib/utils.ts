
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
  // Validar valores de entrada
  if (!width || width <= 0) width = 90;
  if (!height || height <= 0) height = 10;
  
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
    case 'Personalizado':
      // Para formatos personalizados, garantir dimensões mínimas
      dimensions = { 
        width: Math.max(width || 10, 10), 
        height: Math.max(height || 10, 10) 
      };
      break;
    default:
      // Para outros formatos, garantir dimensões mínimas
      dimensions = { 
        width: Math.max(width || 10, 10), 
        height: Math.max(height || 10, 10) 
      };
      break;
  }
  
  // Verificar se a orientação é válida
  const validOrientation = ['portrait', 'landscape', 'retrato', 'paisagem'].includes(orientation);
  if (!validOrientation) {
    orientation = 'portrait'; // Valor padrão se inválido
  }
  
  // Mapear orientação em português para inglês
  if (orientation === 'retrato') orientation = 'portrait';
  if (orientation === 'paisagem') orientation = 'landscape';
  
  // Ajustar dimensões com base na orientação
  // Em paisagem, o lado maior é a largura, o menor é a altura
  if (orientation === 'landscape') {
    if (dimensions.width < dimensions.height) {
      return { width: dimensions.height, height: dimensions.width };
    }
  } else {
    // Em retrato, o lado maior é a altura, o menor é a largura
    if (dimensions.width > dimensions.height) {
      return { width: dimensions.height, height: dimensions.width };
    }
  }
  
  return dimensions;
}
