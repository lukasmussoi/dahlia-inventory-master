
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
}: { 
  contentRef: RefObject<HTMLElement> 
} & Parameters<typeof useReactToPrintOriginal>[0]) {
  // Usar o hook original com as opções corretas
  const handlePrint = useReactToPrintOriginal({
    ...restOptions,
    documentTitle: restOptions.documentTitle || 'Documento',
    // Função que retorna o elemento de referência
    content: () => contentRef.current,
  });

  // Retornar uma função sem parâmetros que invoca handlePrint
  return () => handlePrint();
}
