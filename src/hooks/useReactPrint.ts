
import { useReactToPrint as useReactToPrintOriginal } from "react-to-print";
import { RefObject } from "react";

interface PrintOptions {
  contentRef: RefObject<HTMLElement>;
  documentTitle?: string;
  onBeforeGetContent?: () => Promise<void> | void;
  onAfterPrint?: () => void;
  removeAfterPrint?: boolean;
  pageStyle?: string;
  mediaSize?: {
    width: number;
    height: number;
    unit?: 'mm' | 'cm' | 'in';
    orientation?: 'portrait' | 'landscape';
  };
}

/**
 * Hook personalizado para impressão de componentes React
 * 
 * @param options Opções de configuração para impressão
 * @returns Função para disparar a impressão
 */
export function useReactPrint({ 
  contentRef, 
  mediaSize,
  ...restOptions 
}: PrintOptions & Omit<Parameters<typeof useReactToPrintOriginal>[0], "content">) {
  
  // Construir estilos personalizados para impressão
  let pageStyle = restOptions.pageStyle || '';
  
  // Se tiver definições personalizadas de mídia
  if (mediaSize) {
    const { width, height, unit = 'mm', orientation = 'portrait' } = mediaSize;
    
    // Verificar se as dimensões fazem sentido para orientação
    const finalWidth = width;
    const finalHeight = height;
    
    // Construir tamanho personalizado
    const size = `size: ${finalWidth}${unit} ${finalHeight}${unit};`;
    const pageOrientation = `orientation: ${orientation};`;
    
    // Adicionar aos estilos existentes
    pageStyle = `
      @page {
        ${size}
        ${pageOrientation}
        margin: 0;
      }
      @media print {
        html, body {
          width: ${finalWidth}${unit};
          height: ${finalHeight}${unit};
          margin: 0;
          padding: 0;
        }
        .no-print {
          display: none !important;
        }
      }
      ${pageStyle}
    `;
  }
  
  // Usar o hook original com as opções corretas
  const handlePrint = useReactToPrintOriginal({
    content: () => contentRef.current,
    documentTitle: restOptions.documentTitle || 'Dalia Manager - Documento',
    pageStyle: pageStyle,
    onBeforeGetContent: restOptions.onBeforeGetContent,
    onAfterPrint: restOptions.onAfterPrint,
    removeAfterPrint: restOptions.removeAfterPrint || false,
    ...restOptions
  } as Parameters<typeof useReactToPrintOriginal>[0]);

  // Retornar uma função sem parâmetros que invoca handlePrint
  return () => handlePrint();
}
