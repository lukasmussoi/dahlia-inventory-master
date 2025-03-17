
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SuitcasePrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suitcase: any;
  suitcaseItems: any[];
}

export function SuitcasePrintDialog({
  open,
  onOpenChange,
  suitcase,
  suitcaseItems = [],
}: SuitcasePrintDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // Configurar impressão
  const handlePrint = useReactToPrint({
    documentTitle: `Maleta_${suitcase?.code || ""}`,
    onPrintError: () => toast.error("Erro ao imprimir maleta"),
    onAfterPrint: () => toast.success("Maleta impressa com sucesso"),
    removeAfterPrint: true,
    printTimeout: 1000,
  });

  if (!suitcase) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Imprimir Maleta</DialogTitle>
        </DialogHeader>

        <div className="py-4 flex justify-center">
          {suitcaseItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-gold" />
              <p className="mt-4">Carregando itens da maleta...</p>
            </div>
          ) : (
            <div
              ref={printRef}
              className="w-full max-w-2xl p-6 border rounded-md"
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold">Maleta: {suitcase.code}</h1>
                <p>Revendedora: {suitcase.seller?.name || "Não especificada"}</p>
                <p>
                  Local: {suitcase.city || "Não especificado"}{" "}
                  {suitcase.neighborhood
                    ? `- ${suitcase.neighborhood}`
                    : ""}
                </p>
              </div>

              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">Item</th>
                    <th className="py-2 text-right">Código</th>
                    <th className="py-2 text-right">Preço</th>
                    <th className="py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {suitcaseItems.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="py-3">{item.product?.name || "N/A"}</td>
                      <td className="py-3 text-right">{item.product?.sku || "N/A"}</td>
                      <td className="py-3 text-right">
                        R$ {item.product?.price?.toFixed(2).replace(".", ",") || "0,00"}
                      </td>
                      <td className="py-3 text-right">
                        {item.status === "sold" ? "Vendido" : "Disponível"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-6 border-t pt-4">
                <p className="text-right font-semibold">
                  Total de Itens: {suitcaseItems.length}
                </p>
                <p className="text-right font-semibold">
                  Valor Total: R${" "}
                  {suitcaseItems
                    .reduce(
                      (total, item) => total + (item.product?.price || 0),
                      0
                    )
                    .toFixed(2)
                    .replace(".", ",")}
                </p>
              </div>

              <div className="mt-12 border-t pt-6">
                <p className="text-center text-sm">
                  Assinatura da Revendedora:
                </p>
                <div className="h-8 border-b mt-8 mx-8"></div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={() => {
              if (printRef.current) {
                handlePrint(printRef);
              }
            }} 
            className="gap-1"
          >
            <Printer className="h-4 w-4" /> Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
