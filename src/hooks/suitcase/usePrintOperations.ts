
import { useState } from "react";
import { SuitcaseController } from "@/controllers/suitcaseController";
import { toast } from "sonner";

export function usePrintOperations() {
  const [isPrintingPdf, setIsPrintingPdf] = useState(false);

  // Função para visualizar recibo
  const handleViewReceipt = (acertoId: string) => {
    console.log("Visualizar recibo:", acertoId);
    // Implementação pendente
  };

  // Função para imprimir PDF
  const handlePrint = async (suitcaseId: string, suitcaseItems: any[], promoterInfo: any) => {
    if (!suitcaseId) return;
    
    setIsPrintingPdf(true);
    try {
      // Passando os três parâmetros necessários
      const pdfUrl = await SuitcaseController.generateSuitcasePDF(
        suitcaseId,
        suitcaseItems,
        promoterInfo
      );
      // Abrir o PDF em uma nova aba
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF da maleta");
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
