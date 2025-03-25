
import { useState } from "react";
import { SuitcaseController } from "@/controllers/suitcaseController";
import { SuitcaseItem } from "@/types/suitcase";
import { toast } from "sonner";

export function usePrintOperations() {
  const [isPrintingPdf, setIsPrintingPdf] = useState(false);

  // Visualizar o recibo de um acerto
  const handleViewReceipt = (receiptUrl: string) => {
    if (!receiptUrl) {
      toast.error("Recibo não disponível");
      return;
    }

    // Abrir recibo em nova janela
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`
        <iframe src="${receiptUrl}" width="100%" height="100%" style="border: none;"></iframe>
      `);
    } else {
      toast.error("Não foi possível abrir o recibo. Verifique se o bloqueador de pop-ups está ativo.");
    }
  };

  // Imprimir PDF da maleta
  const handlePrint = async (suitcaseId: string, items: SuitcaseItem[], promoterInfo: any) => {
    setIsPrintingPdf(true);
    try {
      // Gerar PDF usando o SuitcasePdfController
      const pdfDataUri = await SuitcaseController.generateSuitcasePDF(
        suitcaseId,
        items,
        promoterInfo
      );
      
      // Abrir PDF em nova janela
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <iframe src="${pdfDataUri}" width="100%" height="100%" style="border: none;"></iframe>
        `);
      } else {
        toast.error("Não foi possível abrir o PDF. Verifique se o bloqueador de pop-ups está ativo.");
      }
    } catch (error: any) {
      console.error("Erro ao gerar PDF:", error);
      toast.error(error.message || "Erro ao gerar PDF");
    } finally {
      setIsPrintingPdf(false);
    }
  };

  return {
    isPrintingPdf,
    handleViewReceipt,
    handlePrint
  };
}
