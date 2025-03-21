
import { useReactToPrint as useReactToPrintOriginal } from "react-to-print";
import { RefObject } from "react";
import { getPageDimensions } from "@/lib/utils";

/**
 * Hook personalizado para impressão de componentes React
 * 
 * @param options Opções de configuração para impressão
 * @returns Função para disparar a impressão
 */
export function useReactPrint({ 
  contentRef, 
  pageFormat = "A4",
  orientation = "retrato",
  pageWidth,
  pageHeight,
  ...restOptions 
}: { 
  contentRef: RefObject<HTMLElement>;
  pageFormat?: string;
  orientation?: "retrato" | "paisagem";
  pageWidth?: number;
  pageHeight?: number;
} & Omit<Parameters<typeof useReactToPrintOriginal>[0], "content">) {
  
  // Determinar as dimensões da página baseadas no formato e orientação
  const { largura, altura } = getPageDimensions(
    pageFormat,
    orientation,
    pageWidth,
    pageHeight
  );

  // Converter de milímetros para polegadas (necessário para o jsPDF)
  const widthInInches = largura / 25.4;
  const heightInInches = altura / 25.4;

  // Usar o hook original com as opções corretas
  const handlePrint = useReactToPrintOriginal({
    content: () => contentRef.current,
    documentTitle: restOptions.documentTitle || 'Documento',
    pageStyle: `
      @page {
        size: ${widthInInches}in ${heightInInches}in;
        margin: 0;
      }
      @media print {
        body {
          transform-origin: top left;
          width: ${widthInInches}in !important;
          height: ${heightInInches}in !important;
        }
      }
    `,
    ...restOptions
  } as Parameters<typeof useReactToPrintOriginal>[0]);

  // Retornar uma função sem parâmetros que invoca handlePrint
  return () => handlePrint();
}
