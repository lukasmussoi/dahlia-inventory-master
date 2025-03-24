
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SuitcaseController } from "@/controllers/suitcaseController";
import { Suitcase } from "@/types/suitcase";
import { toast } from "sonner";
import { Printer, FileText } from "lucide-react";

interface SuitcasePrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suitcase: Suitcase | null;
}

export function SuitcasePrintDialog({ open, onOpenChange, suitcase }: SuitcasePrintDialogProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handlePrintPDF = async () => {
    if (!suitcase) return;
    
    setIsGeneratingPdf(true);
    try {
      const pdfUrl = await SuitcaseController.generateSuitcasePDF(suitcase.id);
      window.open(pdfUrl, '_blank');
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
