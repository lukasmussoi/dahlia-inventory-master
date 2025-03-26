import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CombinedSuitcaseController } from "@/controllers/suitcase";
import { Suitcase, SuitcaseItem, SupplyItem } from "@/types/suitcase";
import { toast } from "sonner";
import { Printer, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SupplyPdfController } from "@/controllers/suitcase/pdf/supplyPdfController";
import { openPdfInNewTab } from "@/utils/pdfUtils";

interface SuitcasePrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suitcase: Suitcase | null;
}

export function SuitcasePrintDialog({ open, onOpenChange, suitcase }: SuitcasePrintDialogProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Buscar itens da maleta
  const { data: suitcaseItems = [] } = useQuery({
    queryKey: ["suitcase-items", suitcase?.id],
    queryFn: () => CombinedSuitcaseController.getSuitcaseItems(suitcase?.id || ""),
    enabled: !!suitcase?.id && open,
  });

  // Buscar promotora da revendedora
  const { data: promoterInfo } = useQuery({
    queryKey: ["promoter-for-reseller", suitcase?.seller_id],
    queryFn: () => CombinedSuitcaseController.getPromoterForReseller(suitcase?.seller_id || ""),
    enabled: !!suitcase?.seller_id && open,
  });

  // Converter itens de maleta para formato de abastecimento
  const convertToSupplyItems = (items: SuitcaseItem[]): SupplyItem[] => {
    return items.map(item => ({
      inventory_id: item.inventory_id,
      quantity: item.quantity || 1, // Usar 1 como valor padrão se quantity for undefined
      product: item.product
    }));
  };

  const handlePrintPDF = async () => {
    if (!suitcase) return;
    
    setIsGeneratingPdf(true);
    try {
      // Converter itens para o formato esperado pelo SupplyPdfController
      const supplyItems = convertToSupplyItems(suitcaseItems);
      
      // Usar o SupplyPdfController para gerar o PDF com o mesmo formato do PDF de abastecimento
      const pdfUrl = await SupplyPdfController.generateSupplyPDF(
        suitcase.id,
        supplyItems,
        suitcase
      );
      
      // Abrir o PDF em uma nova aba
      openPdfInNewTab(pdfUrl);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF da maleta");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Imprimir Maleta</DialogTitle>
          <DialogDescription>
            Escolha o tipo de documento para imprimir.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <Button 
            onClick={handlePrintPDF}
            className="flex items-center justify-center h-24 p-4"
            disabled={isGeneratingPdf}
          >
            {isGeneratingPdf ? (
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
            ) : (
              <>
                <FileText className="h-6 w-6 mr-2" />
                <div>
                  <div className="font-medium">Relatório Completo</div>
                  <div className="text-xs">Gerar PDF com todos os itens</div>
                </div>
              </>
            )}
          </Button>
          
          <Button 
            variant="outline"
            className="flex items-center justify-center h-24 p-4"
            disabled={true}
          >
            <Printer className="h-6 w-6 mr-2" />
            <div>
              <div className="font-medium">Etiquetas</div>
              <div className="text-xs">Imprimir etiquetas de produtos (em breve)</div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
