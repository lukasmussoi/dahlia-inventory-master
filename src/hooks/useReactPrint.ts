
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
  orientation = 'portrait',
  ...restOptions 
}: { 
  contentRef: RefObject<HTMLElement>,
  orientation?: 'portrait' | 'landscape'
} & Omit<Parameters<typeof useReactToPrintOriginal>[0], "content">) {
  // Usar o hook original com as opções corretas
  const handlePrint = useReactToPrintOriginal({
    content: () => contentRef.current,
    documentTitle: restOptions.documentTitle || 'Documento',
    pageStyle: `
      @page {
        size: ${orientation === 'landscape' ? 'landscape' : 'portrait'};
        margin: ${restOptions.margin || '1cm'};
      }
    `,
    ...restOptions
  } as Parameters<typeof useReactToPrintOriginal>[0]);

  // Retornar uma função sem parâmetros que invoca handlePrint
  return () => handlePrint();
}
