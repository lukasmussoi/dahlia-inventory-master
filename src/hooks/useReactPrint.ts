
import { useReactToPrint as useReactToPrintOriginal } from "react-to-print";
import { RefObject } from "react";
import { validateDocumentSize } from "@/lib/utils";

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
    orientation?: 'portrait' | 'landscape' | 'retrato' | 'paisagem';
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
    // Mapear orientação em português para inglês
    const orientationMapping: Record<string, 'portrait' | 'landscape'> = {
      'portrait': 'portrait',
      'landscape': 'landscape',
      'retrato': 'portrait',
      'paisagem': 'landscape'
    };
    
    // Obter a orientação final (padrão: portrait)
    const orientationInput = mediaSize.orientation || 'portrait';
    const orientation = orientationMapping[orientationInput] || 'portrait';
    
    // Garantir que os valores sejam números válidos
    const width = mediaSize.width && mediaSize.width > 0 ? mediaSize.width : 90;
    const height = mediaSize.height && mediaSize.height > 0 ? mediaSize.height : 10;
    const unit = mediaSize.unit || 'mm';
    
    // Validar e ajustar dimensões com base na orientação
    const dimensions = validateDocumentSize(width, height, "Personalizado", orientation);
    
    // Construir tamanho personalizado
    const size = `size: ${dimensions.width}${unit} ${dimensions.height}${unit};`;
    const pageOrientation = `orientation: ${orientation};`;
    
    console.log('Configuração de impressão:', {
      dimensoes: { largura: dimensions.width, altura: dimensions.height, unidade: unit },
      orientacao: orientation
    });
    
    // Adicionar aos estilos existentes
    pageStyle = `
      @page {
        ${size}
        ${pageOrientation}
        margin: 0;
      }
      @media print {
        html, body {
          width: ${dimensions.width}${unit};
          height: ${dimensions.height}${unit};
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
  
  // Garantir que o content callback não retorne null
  const contentCallback = () => {
    return contentRef.current || document.createElement('div');
  };
  
  // Usar o hook original com as opções corretas
  const handlePrint = useReactToPrintOriginal({
    content: contentCallback,
    documentTitle: restOptions.documentTitle || 'Dalia Manager - Documento',
    pageStyle: pageStyle,
    onBeforeGetContent: restOptions.onBeforeGetContent,
    onAfterPrint: restOptions.onAfterPrint,
    removeAfterPrint: restOptions.removeAfterPrint || false,
    suppressErrors: true, // Suprimir erros para evitar quebras na aplicação
    ...restOptions
  } as Parameters<typeof useReactToPrintOriginal>[0]);

  // Retornar uma função sem parâmetros que invoca handlePrint
  return () => {
    try {
      handlePrint();
    } catch (error) {
      console.error("Erro ao imprimir:", error);
    }
  };
}
