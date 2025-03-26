
import { useState } from "react";
import { SuitcaseController } from "@/controllers/suitcaseController";
import { SuitcaseItem, SupplyItem } from "@/types/suitcase";
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

  // Converter itens de maleta para formato de abastecimento
  const convertToSupplyItems = (items: SuitcaseItem[]): SupplyItem[] => {
    return items.map(item => ({
      inventory_id: item.inventory_id,
      quantity: item.quantity || 1, // Usar 1 como valor padrão se quantity for undefined
      product: item.product
    }));
  };

  // Imprimir PDF da maleta
  const handlePrint = async (suitcaseId: string, items: SuitcaseItem[], suitcaseInfo: any) => {
    setIsPrintingPdf(true);
    try {
      // Converter itens para o formato esperado pelo SupplyPdfController
      const supplyItems = convertToSupplyItems(items);
      
      // Utilizar o SupplyPdfController para gerar um PDF com o formato do abastecimento
      const pdfDataUri = await SupplyPdfController.generateSupplyPDF(
        suitcaseId,
        supplyItems,
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
