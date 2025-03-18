
import { useReactToPrint as useReactToPrintOriginal } from "react-to-print";
import { RefObject } from "react";
import type { PrintOptions } from "react-to-print";

/**
 * Hook personalizado para impressão de componentes React
 * 
 * @param options Opções de configuração para impressão
 * @returns Função para disparar a impressão
 */
export function useReactPrint({ 
  contentRef, 
  ...restOptions 
}: Omit<PrintOptions, "documentTitle"> & { 
  contentRef: RefObject<HTMLElement> 
}) {
  // Usar o hook original com as opções corretas
  const handlePrint = useReactToPrintOriginal(options => ({
    ...restOptions,
    content: () => contentRef.current,
  }));

  // Retornar uma função sem parâmetros que invoca handlePrint
  return () => handlePrint();
}
