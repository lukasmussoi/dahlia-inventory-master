
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
  // Usar o hook original com as opções corretas e tipos compatíveis
  const handlePrint = useReactToPrintOriginal({
    documentTitle: restOptions.documentTitle || 'Documento',
    onAfterPrint: restOptions.onAfterPrint,
    pageStyle: restOptions.pageStyle,
    // O hook original espera um getter para o elemento, não uma ref direta
    content: () => contentRef.current
  });

  // Se temos onBeforeGetContent, temos que executá-lo antes de chamar handlePrint
  const handlePrintWithBeforeContent = async () => {
    if (restOptions.onBeforeGetContent) {
      await restOptions.onBeforeGetContent();
    }
    handlePrint();
  };

  // Retornar uma função que executa a preparação e depois a impressão
  return handlePrintWithBeforeContent;
}
