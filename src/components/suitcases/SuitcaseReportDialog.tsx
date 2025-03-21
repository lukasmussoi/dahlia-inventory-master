
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Printer, Download, FileText } from "lucide-react";
import { SuitcaseController } from "@/controllers/suitcaseController";
import { Suitcase, SuitcaseItem } from "@/types/suitcase";
import { generateSuitcaseReport } from "@/utils/reportGenerator";
import { formatCurrency } from "@/utils/formatters";

interface SuitcaseReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suitcaseId: string;
}

export function SuitcaseReportDialog({ 
  open, 
  onOpenChange, 
  suitcaseId 
}: SuitcaseReportDialogProps) {
  const [loading, setLoading] = useState(true);
  const [suitcase, setSuitcase] = useState<Suitcase | null>(null);
  const [items, setItems] = useState<SuitcaseItem[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (open && suitcaseId) {
      loadSuitcaseData();
    } else {
      // Limpar dados ao fechar
      setPdfUrl(null);
    }
  }, [open, suitcaseId]);

  const loadSuitcaseData = async () => {
    try {
      setLoading(true);
      
      // Carregar dados da maleta
      const suitcaseData = await SuitcaseController.getSuitcaseById(suitcaseId);
      setSuitcase(suitcaseData);
      
      // Carregar itens da maleta
      const suitcaseItems = await SuitcaseController.getSuitcaseItems(suitcaseId);
      const activeItems = suitcaseItems.filter(item => item.status === 'in_possession');
      setItems(activeItems);
      
    } catch (error) {
      console.error("Erro ao carregar dados da maleta:", error);
      toast.error("Erro ao carregar dados da maleta");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      if (!suitcase) {
        toast.error("Dados da maleta não disponíveis");
        return;
      }
      
      setGenerating(true);
      
      // Gerar PDF
      const reportUrl = generateSuitcaseReport(suitcase, items);
      setPdfUrl(reportUrl);
      
      toast.success("Relatório gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast.error("Erro ao gerar relatório");
    } finally {
      setGenerating(false);
    }
  };

  const handleViewReport = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  const handleDownloadReport = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `relatorio-maleta-${suitcase?.code || 'sem-codigo'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const totalValue = items.reduce((sum, item) => sum + ((item.product?.price || 0) * (item.quantity || 1)), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Relatório de Abastecimento de Maleta</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border rounded-md p-4 space-y-2">
              <p><span className="font-semibold">Maleta:</span> {suitcase?.code}</p>
              <p><span className="font-semibold">Revendedora:</span> {suitcase?.seller?.name}</p>
              {suitcase?.city && (
                <p><span className="font-semibold">Localização:</span> {suitcase.city}, {suitcase.neighborhood}</p>
              )}
              <p><span className="font-semibold">Total de Itens:</span> {items.length}</p>
              <p><span className="font-semibold">Valor Total:</span> {formatCurrency(totalValue)}</p>
            </div>
            
            {pdfUrl ? (
              <div className="flex flex-col space-y-2">
                <Button onClick={handleViewReport} className="w-full">
                  <FileText className="mr-2 h-4 w-4" />
                  Visualizar Relatório
                </Button>
                <Button variant="outline" onClick={handleDownloadReport} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Baixar PDF
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleGenerateReport} 
                disabled={generating || items.length === 0} 
                className="w-full"
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Gerando Relatório...
                  </>
                ) : (
                  <>
                    <Printer className="mr-2 h-4 w-4" />
                    Gerar Relatório de Abastecimento
                  </>
                )}
              </Button>
            )}
            
            {items.length === 0 && (
              <p className="text-sm text-amber-600">
                Esta maleta não possui itens. Adicione itens antes de gerar o relatório.
              </p>
            )}
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
