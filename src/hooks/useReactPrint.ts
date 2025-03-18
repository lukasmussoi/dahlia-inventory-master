
import { useReactToPrint, UseReactToPrintOptions } from "react-to-print";
import { RefObject } from "react";

/**
 * Hook personalizado para impressão de componentes React
 * 
 * @param options Opções de configuração para impressão
 * @returns Função para disparar a impressão
 */
export function useReactPrint({ 
  contentRef, 
  ...restOptions 
}: UseReactToPrintOptions & { contentRef: RefObject<HTMLElement> }) {
  // Usar o hook original com as opções corretas
  return useReactToPrint({
    ...restOptions,
    content: () => contentRef.current,
  });
}
