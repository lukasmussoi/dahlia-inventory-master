
import { useRef } from "react";
import { Suitcase, SuitcaseItem } from "@/types/suitcase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useReactPrint } from "@/hooks/useReactPrint";
import { Printer } from "lucide-react";

interface SuitcasePrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suitcase: Suitcase | null;
  suitcaseItems: SuitcaseItem[];
}

export function SuitcasePrintDialog({
  open,
  onOpenChange,
  suitcase,
  suitcaseItems,
}: SuitcasePrintDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // Usar o hook personalizado para impressão
  const handlePrint = useReactPrint({
    contentRef: printRef,
    pageStyle: `
      @page {
        size: A4;
        margin: 16mm;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
        }
        .print-container {
          width: 100%;
          padding: 0;
        }
        .no-print {
          display: none !important;
        }
      }
    `,
  });

  if (!suitcase) return null;

  const formatDate = (date: string) => {
    return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Imprimir Maleta: {suitcase.code}
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef} className="print-container p-4">
          <div className="mb-6 border-b pb-4">
            <h1 className="text-2xl font-bold">Maleta: {suitcase.code}</h1>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm text-gray-500">Revendedora</p>
                <p className="font-medium">{suitcase.seller?.name || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Data de criação</p>
                <p className="font-medium">{formatDate(suitcase.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Cidade</p>
                <p className="font-medium">{suitcase.city || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Bairro</p>
                <p className="font-medium">{suitcase.neighborhood || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium">
                  {suitcase.status === "in_use"
                    ? "Em uso"
                    : suitcase.status === "returned"
                    ? "Devolvida"
                    : suitcase.status === "in_replenishment"
                    ? "Em reposição"
                    : suitcase.status}
                </p>
              </div>
              {suitcase.next_settlement_date && (
                <div>
                  <p className="text-sm text-gray-500">Próximo acerto</p>
                  <p className="font-medium">
                    {formatDate(suitcase.next_settlement_date)}
                  </p>
                </div>
              )}
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-4">Itens da Maleta</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left border">Item</th>
                <th className="p-2 text-left border">SKU</th>
                <th className="p-2 text-left border">Preço</th>
                <th className="p-2 text-left border">Status</th>
                <th className="p-2 text-center border">Observações</th>
              </tr>
            </thead>
            <tbody>
              {suitcaseItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center border">
                    Nenhum item encontrado na maleta
                  </td>
                </tr>
              ) : (
                suitcaseItems.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-2 border">{item.product?.name || "—"}</td>
                    <td className="p-2 border">{item.product?.sku || "—"}</td>
                    <td className="p-2 border">
                      {item.product?.price
                        ? `R$ ${item.product.price.toFixed(2)}`
                        : "—"}
                    </td>
                    <td className="p-2 border">
                      {item.status === "in_possession"
                        ? "Em posse"
                        : item.status === "sold"
                        ? "Vendido"
                        : item.status === "returned"
                        ? "Devolvido"
                        : "Perdido"}
                    </td>
                    <td className="p-2 border h-8"></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <DialogFooter className="no-print">
          <Button
            type="button"
            variant="outline"
            className="mr-2"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
          <Button 
            onClick={handlePrint}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
