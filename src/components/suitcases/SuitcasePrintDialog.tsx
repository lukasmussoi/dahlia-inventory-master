
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
import { Printer, Package } from "lucide-react";
import { getProductPhotoUrl } from "@/utils/photoUtils";

interface SuitcasePrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suitcase: Suitcase | null;
  suitcaseItems: SuitcaseItem[];
  promoterInfo: any;
}

export function SuitcasePrintDialog({
  open,
  onOpenChange,
  suitcase,
  suitcaseItems,
  promoterInfo,
}: SuitcasePrintDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactPrint({
    contentRef: printRef,
    documentTitle: `Maleta_${suitcase?.code || 'sem_codigo'}`,
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
        .item-image {
          max-width: 100%;
          height: auto;
        }
        table {
          page-break-inside: auto;
        }
        tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }
      }
    `,
  });

  if (!suitcase) return null;

  const formatDate = (date: string) => {
    if (!date) return "Não definida";
    return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(price);
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
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">Maleta: {suitcase.code}</h1>
              <div className="text-right">
                <p className="text-sm">Data de impressão:</p>
                <p className="font-medium">{format(new Date(), "dd/MM/yyyy", { locale: ptBR })}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm text-gray-500">Revendedora</p>
                <p className="font-medium">{suitcase.seller?.name || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Promotora</p>
                <p className="font-medium">{promoterInfo?.name || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Telefone da Revendedora</p>
                <p className="font-medium">{suitcase.seller?.phone || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Telefone da Promotora</p>
                <p className="font-medium">{promoterInfo?.phone || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Localização</p>
                <p className="font-medium">{suitcase.city || "—"}, {suitcase.neighborhood || "—"}</p>
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
              <div>
                <p className="text-sm text-gray-500">Data de criação</p>
                <p className="font-medium">{formatDate(suitcase.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Próximo acerto</p>
                <p className="font-medium">
                  {suitcase.next_settlement_date ? formatDate(suitcase.next_settlement_date) : "Não definida"}
                </p>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-4">Itens da Maleta</h2>
          
          {suitcaseItems.length === 0 ? (
            <div className="text-center py-8 border rounded-md">
              <Package className="h-12 w-12 mx-auto text-gray-300" />
              <p className="mt-2 text-muted-foreground">Nenhum item encontrado na maleta</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {suitcaseItems.map((item) => (
                <div key={item.id} className="border rounded-md p-3">
                  <div className="flex">
                    <div className="w-16 h-16 bg-gray-100 rounded-md mr-3 flex-shrink-0 item-image">
                      {item.product?.photo_url ? (
                        <img 
                          src={getProductPhotoUrl(item.product?.photo_url)} 
                          alt={item.product?.name} 
                          className="w-full h-full object-cover rounded-md" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div>
                          <h4 className="font-medium">{item.product?.name}</h4>
                          <p className="text-sm text-gray-600">
                            Código: {item.product?.sku}
                          </p>
                          <p className="font-medium">
                            {formatPrice(item.product?.price || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            Status: {
                              item.status === 'in_possession' ? 'Em posse' :
                              item.status === 'sold' ? 'Vendido' :
                              item.status === 'returned' ? 'Devolvido' :
                              'Perdido'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-6 border-t pt-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-lg font-medium">Total de peças: {suitcaseItems.length}</p>
              </div>
              <div className="text-right">
                <p className="text-sm">Valor total da maleta:</p>
                <p className="text-xl font-bold">
                  {formatPrice(suitcaseItems.reduce((total, item) => {
                    return total + (item.product?.price || 0);
                  }, 0))}
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-4 border-t">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm mb-2">Assinatura Revendedora:</p>
                <div className="border-b border-black h-8 mt-8"></div>
                <p className="text-center mt-2">{suitcase.seller?.name}</p>
              </div>
              <div>
                <p className="text-sm mb-2">Assinatura Promotora:</p>
                <div className="border-b border-black h-8 mt-8"></div>
                <p className="text-center mt-2">{promoterInfo?.name}</p>
              </div>
            </div>
          </div>
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
