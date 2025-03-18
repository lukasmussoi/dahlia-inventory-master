
import { useReactToPrint, type UseReactToPrintOptions } from "react-to-print";

// Definindo nossa interface estendida
export interface UseReactToPrintOptions extends Omit<UseReactToPrintOptions, 'content'> {
  content: () => HTMLElement | null;
}

// Hook personalizado que aceita nossa interface estendida
export function useReactPrint(options: UseReactToPrintOptions) {
  // Extrair a função content das opções
  const { content, ...restOptions } = options;
  
  // Usar o hook original com as opções corretas
  return useReactToPrint({
    ...restOptions,
    content: content, // Passando a função content diretamente
  });
}
