
import { useState, useCallback } from "react";
import { CombinedSuitcaseController } from "@/controllers/suitcase";
import { toast } from "sonner";
import { Suitcase } from "@/types/suitcase";

export function usePrintOperations() {
  const [isPrintingPdf, setIsPrintingPdf] = useState(false);
  
  const handleViewReceipt = (id: string) => {
    // Implementação existente...
    console.log("Visualizando recibo:", id);
  };
  
  const handlePrint = async (suitcaseId: string, items: any[], promoterInfo: any) => {
    setIsPrintingPdf(true);
    try {
      // Buscar informações da maleta para o PDF se necessário
      let suitcaseInfo: Suitcase | null = null;
      if (!items || !Array.isArray(items) || items.length === 0) {
        console.log("Nenhum item fornecido, buscando informações da maleta");
        suitcaseInfo = await CombinedSuitcaseController.getSuitcaseById(suitcaseId);
      }
      
      const result = await CombinedSuitcaseController.generateSuitcasePDF(
        suitcaseId, 
        suitcaseInfo || { 
          id: suitcaseId, 
          code: '', 
          seller_id: '', 
          status: 'in_use', 
          created_at: new Date().toISOString() 
        }, 
        items
      );
      
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
