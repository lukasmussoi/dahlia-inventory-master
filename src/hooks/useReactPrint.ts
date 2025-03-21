
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
    documentTitle: restOptions.documentTitle || 'Documento',
    // Passamos as funções e propriedades diretamente para o hook original
    onAfterPrint: restOptions.onAfterPrint,
    pageStyle: restOptions.pageStyle,
    // A propriedade content é obrigatória para o hook original
    content: () => contentRef.current
  });

  // Retornar uma função sem parâmetros que invoca handlePrint
  return () => handlePrint();
}
