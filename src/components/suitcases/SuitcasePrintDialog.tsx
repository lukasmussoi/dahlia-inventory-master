
import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { SuitcaseController } from "@/controllers/suitcaseController";
import { Briefcase, Printer, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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

  // Buscar detalhes da maleta
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

  // Função para imprimir
  const handlePrint = () => {
    if (printRef.current) {
      const printContents = printRef.current.innerHTML;
      const originalContents = document.body.innerHTML;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Impressão de Maleta - ${suitcase?.code || ''}</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  padding: 20px;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                }
                th, td {
                  padding: 8px;
                  text-align: left;
                  border-bottom: 1px solid #ddd;
                }
                th {
                  background-color: #f2f2f2;
                }
                .header {
                  text-align: center;
                  margin-bottom: 20px;
                }
                .footer {
                  margin-top: 30px;
                }
                .signature-line {
                  margin-top: 50px;
                  border-top: 1px solid #000;
                  width: 300px;
                  text-align: center;
                  padding-top: 5px;
                  margin-left: auto;
                  margin-right: auto;
                }
                .total {
                  font-weight: bold;
                  text-align: right;
                  margin-top: 20px;
                }
                .checkbox {
                  width: 20px;
                  height: 20px;
                  border: 1px solid #000;
                  display: inline-block;
                }
                .location {
                  margin-top: 5px;
                  font-style: italic;
                }
              </style>
            </head>
            <body>
              ${printContents}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        setTimeout(() => printWindow.close(), 100);
      }
    }
  };

  // Calcular valor total da maleta
  const calculateTotal = () => {
    return suitcaseItems.reduce((total, item) => {
      const price = item.product?.price || 0;
      return total + price;
    }, 0);
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
            <span className="ml-2">Carregando detalhes para impressão...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!suitcase) {
    return null;
  }

  // Formatar código da maleta
  const code = suitcase.code || `ML${suitcase.id.substring(0, 3)}`;
  
  // Obter nome da revendedora
  const resellerName = suitcase.seller?.full_name || "Revendedora não especificada";
  
  // Data atual formatada
  const currentDate = format(new Date(), 'dd/MM/yyyy');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" /> Impressão de Itens da Maleta
          </DialogTitle>
          <DialogDescription>
            Visualize e imprima a lista de itens da maleta {code}.
          </DialogDescription>
        </DialogHeader>

        <div ref={printRef} className="print-content">
          <div className="header text-center mb-6">
            <h2 className="text-xl font-bold">Maleta {code}</h2>
            <p className="font-medium">Revendedora: {resellerName}</p>
            <p className="text-sm text-muted-foreground location">
              {suitcase.city && suitcase.neighborhood
                ? `${suitcase.city} - ${suitcase.neighborhood}`
                : "Localização não especificada"}
            </p>
            <p className="text-sm text-muted-foreground">Data: {currentDate}</p>
          </div>

          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="py-2 px-4 text-left w-1/6">Imagem</th>
                <th className="py-2 px-4 text-left w-1/6">Código</th>
                <th className="py-2 px-4 text-left w-1/4">Item</th>
                <th className="py-2 px-4 text-right w-1/6">Preço</th>
                <th className="py-2 px-4 text-center w-1/12">Vendido</th>
                <th className="py-2 px-4 text-left w-1/4">Cliente</th>
                <th className="py-2 px-4 text-left w-1/6">Pagamento</th>
              </tr>
            </thead>
            <tbody>
              {suitcaseItems.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="py-3 px-4">
                    <div className="h-12 w-12 bg-gray-100 rounded">
                      {item.product?.photo_url && (
                        <img 
                          src={item.product.photo_url} 
                          alt={item.product.name} 
                          className="h-full w-full object-cover rounded"
                        />
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 align-middle">
                    {item.product?.sku || "N/A"}
                  </td>
                  <td className="py-3 px-4 align-middle">
                    {item.product?.name || "Produto não especificado"}
                  </td>
                  <td className="py-3 px-4 text-right align-middle">
                    R$ {item.product?.price.toFixed(2).replace('.', ',') || "0,00"}
                  </td>
                  <td className="py-3 px-4 text-center align-middle">
                    <div className="w-5 h-5 border border-gray-400 inline-block"></div>
                  </td>
                  <td className="py-3 px-4 align-middle">
                    <div className="border-b border-gray-300 h-6"></div>
                  </td>
                  <td className="py-3 px-4 align-middle">
                    <div className="border-b border-gray-300 h-6"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="total text-right mt-4">
            <p className="font-bold">Total: R$ {calculateTotal().toFixed(2).replace('.', ',')}</p>
          </div>

          <div className="footer mt-8">
            <div className="signature-line">
              <p>Assinatura da Revendedora</p>
            </div>
            <div className="text-center mt-4 text-sm text-muted-foreground">
              <p>Dália Joias © {new Date().getFullYear()}</p>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <DialogFooter>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Imprimir Lista
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
