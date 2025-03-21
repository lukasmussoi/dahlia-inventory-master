
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
    onAfterPrint: restOptions.onAfterPrint,
    // A propriedade content é necessária para o hook original
    content: () => contentRef.current,
    // Não passamos onBeforeGetContent diretamente, pois não é reconhecido na tipagem
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
