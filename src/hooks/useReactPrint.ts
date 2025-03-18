
import { useReactToPrint } from "react-to-print";

/**
 * Hook personalizado para impressão de componentes React
 * 
 * @param options Opções de configuração para impressão
 * @returns Função para disparar a impressão
 */
export function useReactPrint({ contentRef, ...restOptions }) {
  // Usar o hook original com as opções corretas
  return useReactToPrint({
    content: () => contentRef.current,
    ...restOptions,
  });
}
