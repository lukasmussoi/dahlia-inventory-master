
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { toast } from "sonner";

// Interface para os props do componente
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
  suitcaseItems
}: SuitcasePrintDialogProps) {
  // Referência para o componente que será impresso
  const printRef = useRef<HTMLDivElement>(null);

  // Função para imprimir o conteúdo
  const handlePrint = useReactToPrint({
    documentTitle: `Maleta ${suitcase?.code || ''}`,
    onPrintError: (error) => {
      console.error('Erro ao imprimir:', error);
      toast.error('Erro ao imprimir documento');
    },
    content: () => printRef.current
  });

  if (!suitcase) return null;

  // Calcular o total da maleta
  const totalValue = suitcaseItems?.reduce((total, item) => {
    return total + (item.product?.price || 0);
  }, 0);

  // Formatar a data
  const formattedDate = (date: string) => {
    if (!date) return '';
    try {
      return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
    } catch (e) {
      return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Imprimir Maleta</DialogTitle>
        </DialogHeader>

        {/* Conteúdo a ser impresso */}
        <div 
          ref={printRef} 
          className="p-6 print:text-black print:p-0"
        >
          <div className="border-b pb-4 mb-4">
            <h1 className="text-2xl font-bold mb-2">
              Maleta {suitcase.code || `ML${suitcase.id?.substring(0, 3)}`}
            </h1>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Revendedora</p>
                <p>{suitcase.seller?.name || "Não especificada"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data de Criação</p>
                <p>{formattedDate(suitcase.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cidade/Bairro</p>
                <p>
                  {suitcase.city || "N/A"} / {suitcase.neighborhood || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Próximo Acerto</p>
                <p>{formattedDate(suitcase.next_settlement_date) || "Não definido"}</p>
              </div>
            </div>
          </div>

          <table className="min-w-full print:border-collapse print:border">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Item</th>
                <th className="text-left py-2">SKU</th>
                <th className="text-right py-2">Preço</th>
                <th className="text-right py-2 print:w-[100px]">Status</th>
              </tr>
            </thead>
            <tbody>
              {suitcaseItems?.length > 0 ? (
                suitcaseItems.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-2">{item.product?.name || "—"}</td>
                    <td className="py-2">{item.product?.sku || "—"}</td>
                    <td className="py-2 text-right">
                      R$ {(item.product?.price || 0).toFixed(2).replace('.', ',')}
                    </td>
                    <td className="py-2 text-right">
                      {item.status === "sold" ? "Vendido" : "Disponível"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-muted-foreground">
                    Nenhum item na maleta
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="font-bold">
                <td colSpan={2} className="py-2 text-right">Total:</td>
                <td className="py-2 text-right">
                  R$ {totalValue.toFixed(2).replace('.', ',')}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>

          <div className="mt-8 print:mt-16 grid grid-cols-2 gap-8">
            <div>
              <div className="border-t border-dashed w-full pt-2">
                Assinatura da Revendedora
              </div>
            </div>
            <div>
              <div className="border-t border-dashed w-full pt-2">
                Dália Joias
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button 
            onClick={() => {
              if (handlePrint) {
                handlePrint();
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
