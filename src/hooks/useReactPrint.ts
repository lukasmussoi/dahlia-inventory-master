
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
  contentRef: RefObject<HTMLElement>,
  documentTitle?: string,
  onBeforeGetContent?: () => Promise<void> | void,
  onAfterPrint?: () => void,
  pageStyle?: string
}) {
  // Usar o hook original com as opções corretas
  const handlePrint = useReactToPrintOriginal({
    content: () => contentRef.current,
    documentTitle: restOptions.documentTitle || 'Documento',
    onBeforeGetContent: restOptions.onBeforeGetContent,
    onAfterPrint: restOptions.onAfterPrint,
    pageStyle: restOptions.pageStyle
  });

  // Retornar uma função sem parâmetros que invoca handlePrint
  return () => handlePrint();
}
