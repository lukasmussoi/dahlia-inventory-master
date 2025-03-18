
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
} & Omit<Parameters<typeof useReactToPrintOriginal>[0], "content">) {
  // Usar o hook original com as opções corretas
  const handlePrint = useReactToPrintOriginal({
    ...restOptions,
    // Definir a função content que retorna o elemento a ser impresso
    content: () => contentRef.current,
  });

  // Retornar uma função sem parâmetros que invoca handlePrint
  return () => handlePrint();
}
