
import { useState } from "react";
import { SuitcaseController } from "@/controllers/suitcaseController";
import { SuitcaseItem } from "@/types/suitcase";
import { toast } from "sonner";
import { openPdfInNewTab } from "@/utils/pdfUtils";
import { SupplyPdfController } from "@/controllers/suitcase/pdf/supplyPdfController";

export function usePrintOperations() {
  const [isPrintingPdf, setIsPrintingPdf] = useState(false);

  // Visualizar o recibo de um acerto
  const handleViewReceipt = (receiptUrl: string) => {
    if (!receiptUrl) {
      toast.error("Recibo não disponível");
      return;
    }

    // Abrir recibo em nova janela usando a função utilitária
    openPdfInNewTab(receiptUrl);
  };

  // Imprimir PDF da maleta
  const handlePrint = async (suitcaseId: string, items: SuitcaseItem[], suitcaseInfo: any) => {
    setIsPrintingPdf(true);
    try {
      // Utilizar o SupplyPdfController para gerar um PDF com o formato do abastecimento
      const pdfDataUri = await SupplyPdfController.generateSupplyPDF(
        suitcaseId,
        items,
        suitcaseInfo
      );
      
      // Abrir PDF em nova janela usando a função utilitária
      openPdfInNewTab(pdfDataUri);
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
