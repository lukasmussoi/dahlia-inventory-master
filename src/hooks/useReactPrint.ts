
import { useReactToPrint, type UseReactToPrintOptions as OriginalOptions } from "react-to-print";

// Estendendo o tipo para incluir a propriedade content que utilizamos
export interface UseReactToPrintOptions extends OriginalOptions {
  content: () => HTMLElement | null;
}

// Hook personalizado que aceita nossa interface estendida
export function useReactPrint(options: UseReactToPrintOptions) {
  // Usamos o hook original com as opções corretas
  return useReactToPrint(options);
}
