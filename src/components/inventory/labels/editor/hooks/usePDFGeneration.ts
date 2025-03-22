
import { useState } from "react";
import { toast } from "sonner";
import { generatePreview } from "@/utils/etiqueta/previewGenerator";
import type { PreviewPDFOptions } from "@/utils/etiqueta/types";

/**
 * Hook para gerenciar a geração de PDFs
 */
export function usePDFGeneration() {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);

  /**
   * Gera uma pré-visualização do PDF
   */
  const handlePreview = async (options: PreviewPDFOptions) => {
    const { modelName, labels, pageFormat, pageSize, pageMargins, labelSpacing, autoAdjustDimensions, pageOrientation } = options;
    
    if (labels.length === 0 || labels[0].elements.length === 0) {
      toast.error("Adicione pelo menos uma etiqueta com elementos para visualizar");
      return;
    }
    
    setIsGeneratingPdf(true);
    
    try {
      // Usando a função generatePreview que recebe um único objeto de configuração
      const pdfUrl = await generatePreview({
        modelName: modelName || "Modelo sem nome",
        labels,
        pageFormat,
        pageSize,
        pageMargins,
        labelSpacing,
        autoAdjustDimensions,
        pageOrientation
      });
      
      setPreviewPdfUrl(pdfUrl);
      setIsPreviewDialogOpen(true);
    } catch (error) {
      console.error("Erro ao gerar pré-visualização:", error);
      if (error instanceof Error) {
        toast.error(`Erro na pré-visualização: ${error.message}`);
      } else {
        toast.error("Não foi possível gerar a pré-visualização");
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  /**
   * Faz o download do PDF gerado
   */
  const handleDownloadPdf = (modelName: string) => {
    if (!previewPdfUrl) return;
    
    const a = document.createElement("a");
    a.href = previewPdfUrl;
    a.download = `${modelName || "modelo-etiqueta"}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return {
    isGeneratingPdf,
    previewPdfUrl,
    isPreviewDialogOpen,
    setIsPreviewDialogOpen,
    handlePreview,
    handleDownloadPdf
  };
}
