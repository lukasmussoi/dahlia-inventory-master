
import { useRef, useState, useEffect } from "react";
import { format } from "date-fns";
import { useReactToPrint } from "react-to-print";
import { SuitcaseController } from "@/controllers/suitcaseController";
import { Printer, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SuitcasePrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suitcaseId: string;
}

export function SuitcasePrintDialog({
  open,
  onOpenChange,
  suitcaseId,
}: SuitcasePrintDialogProps) {
  const [suitcase, setSuitcase] = useState<any>(null);
  const [suitcaseItems, setSuitcaseItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchSuitcaseDetails() {
      if (open && suitcaseId) {
        setLoading(true);
        try {
          const suitcaseData = await SuitcaseController.getSuitcaseById(suitcaseId);
          const itemsData = await SuitcaseController.getSuitcaseItems(suitcaseId);
          
          setSuitcase(suitcaseData);
          setSuitcaseItems(itemsData);
        } catch (error) {
          console.error("Erro ao buscar detalhes da maleta:", error);
        } finally {
          setLoading(false);
        }
      }
    }

    fetchSuitcaseDetails();
  }, [open, suitcaseId]);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    onAfterPrint: () => {
      toast.success("Relatório impresso com sucesso");
    },
    onPrintError: () => {
      toast.error("Erro ao imprimir relatório");
    },
  });

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
            <span className="ml-2">Carregando detalhes da maleta...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!suitcase) {
    return null;
  }

  // Calcular valor total das peças
  const totalValue = suitcaseItems.reduce((total, item) => {
    return total + (item.product?.price || 0);
  }, 0);

  // Formatar código da maleta
  const code = suitcase.code || `ML${suitcase.id.substring(0, 3)}`;

  // Obter nome da revendedora
  const resellerName = suitcase.seller && suitcase.seller.name 
    ? suitcase.seller.name 
    : "Revendedora não especificada";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" /> Impressão de Peças da Maleta
          </DialogTitle>
        </DialogHeader>

        <div className="p-4">
          <Button 
            onClick={handlePrint}
            className="mb-4"
          >
            <Printer className="h-4 w-4 mr-2" /> Imprimir Lista
          </Button>

          <div ref={printRef} className="p-6 bg-white">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold">Maleta {code}</h1>
              <p className="text-gray-600">Revendedora: {resellerName}</p>
              <p className="text-gray-600">Data: {format(new Date(), 'dd/MM/yyyy')}</p>
            </div>

            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-4 text-left">Imagem</th>
                  <th className="py-2 px-4 text-left">Código</th>
                  <th className="py-2 px-4 text-left">Peça</th>
                  <th className="py-2 px-4 text-right">Preço</th>
                  <th className="py-2 px-4 text-center">Vendido</th>
                  <th className="py-2 px-4 text-left">Cliente</th>
                  <th className="py-2 px-4 text-left">Pagamento</th>
                </tr>
              </thead>
              <tbody>
                {suitcaseItems.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3 px-4">
                      <div className="h-12 w-12 bg-gray-100">
                        {item.product?.photo_url && (
                          <img 
                            src={item.product.photo_url} 
                            alt={item.product.name} 
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">{item.product?.sku || "N/A"}</td>
                    <td className="py-3 px-4">{item.product?.name || "Produto não especificado"}</td>
                    <td className="py-3 px-4 text-right">
                      R$ {item.product?.price.toFixed(2).replace('.', ',') || "0,00"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-block h-4 w-4 border border-gray-300"></div>
                    </td>
                    <td className="py-3 px-4 border-b border-dashed"></td>
                    <td className="py-3 px-4 border-b border-dashed"></td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-right font-bold">Total:</td>
                  <td className="py-3 px-4 text-right font-bold">
                    R$ {totalValue.toFixed(2).replace('.', ',')}
                  </td>
                  <td colSpan={3}></td>
                </tr>
              </tbody>
            </table>

            <div className="mt-12 pt-6 border-t">
              <p className="text-center mb-8">Assinatura da Revendedora: ____________________________</p>
              <p className="text-center text-sm text-gray-500">Dália Joias © {new Date().getFullYear()}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
