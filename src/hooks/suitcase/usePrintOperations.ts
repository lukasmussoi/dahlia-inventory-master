import { useState, useCallback } from "react";
import { CombinedSuitcaseController } from "@/controllers/suitcase";
import { toast } from "sonner";

export function usePrintOperations() {
  const [isPrintingPdf, setIsPrintingPdf] = useState(false);
  
  const handleViewReceipt = (id: string) => {
    // Implementação existente...
    console.log("Visualizando recibo:", id);
  };
  
  const handlePrint = async (suitcaseId: string, items: any[], promoterInfo: any) => {
    setIsPrintingPdf(true);
    try {
      await CombinedSuitcaseController.generateSuitcasePDF(suitcaseId, items, promoterInfo);
      toast.success("PDF gerado com sucesso");
      return true;
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF");
      return false;
    } finally {
      setIsPrintingPdf(false);
    }
  };
  
  // Adicionar função de reset
  const resetPrintState = useCallback(() => {
    setIsPrintingPdf(false);
  }, []);
  
  return {
    isPrintingPdf,
    handleViewReceipt,
    handlePrint,
    resetPrintState
  };
}
