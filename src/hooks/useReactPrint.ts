
import { useReactToPrint as useReactToPrintOriginal } from "react-to-print";
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
}: Omit<Parameters<typeof useReactToPrintOriginal>[0], 'content'> & { 
  contentRef: RefObject<HTMLElement> 
}) {
  // Usar o hook original com as opções corretas
  return useReactToPrintOriginal({
    ...restOptions,
    content: () => contentRef.current,
  });
}
