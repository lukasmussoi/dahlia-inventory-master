
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Clock,
  Package,
  User,
  CreditCard,
  Printer,
  X
} from "lucide-react";
import { toast } from "sonner";
import { Acerto } from "@/types/suitcase";
import { AcertoMaletaController } from "@/controllers/acertoMaletaController";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { getProductPhotoUrl } from "@/utils/photoUtils";
import { openPdfInNewTab } from "@/utils/pdfUtils";

interface AcertoDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  acertoId?: string;
}

export function AcertoDetailsDialog({
  open,
  onOpenChange,
  acertoId
}: AcertoDetailsDialogProps) {
  const [currentAcerto, setCurrentAcerto] = useState<Acerto | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // Função para forçar recarga da página ao fechar
  const handleForceReload = () => {
    console.log("[AcertoDetailsDialog] Forçando recarga da página para resolver problemas de travamento");
    window.location.reload();
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  const formatPaymentMethod = (method?: string) => {
    if (!method) return "Não informado";
    
    const methods: Record<string, string> = {
      'cash': 'Dinheiro',
      'credit': 'Cartão de Crédito',
      'debit': 'Cartão de Débito',
      'pix': 'PIX'
    };
    
    return methods[method] || method;
  };

  const { data: acerto, isLoading } = useQuery({
    queryKey: ['acerto', acertoId],
    queryFn: async () => {
      const data = await AcertoMaletaController.getAcertoById(acertoId);
      return data as Acerto;
    },
    enabled: !!acertoId && open
  });

  useEffect(() => {
    if (acerto) {
      setCurrentAcerto(acerto);
    }
  }, [acerto]);

  const viewReceiptPdf = async () => {
    if (!acertoId) return;
    
    try {
      setIsPrinting(true);
      toast.info("Gerando recibo em PDF...");
      
      const pdfUrl = await AcertoMaletaController.generateReceiptPDF(acertoId);
      openPdfInNewTab(pdfUrl);
    } catch (error) {
      console.error("Erro ao gerar PDF do acerto:", error);
      toast.error("Erro ao gerar PDF do recibo. Tente novamente.");
    } finally {
      setIsPrinting(false);
    }
  };

  if (!acertoId) return null;

  return (
    <Dialog open={open} onOpenChange={handleForceReload}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto p-0">
        <div className="p-6 pb-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-pink-500" />
              <h2 className="text-xl font-semibold">Detalhes do Acerto</h2>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={handleForceReload}
            >
              &times;
            </Button>
          </div>
        </div>
        
        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
            </div>
          ) : !acerto ? (
            <div className="text-center py-6 border rounded-md">
              <Clock className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2 text-muted-foreground">Acerto não encontrado</p>
            </div>
          ) : (
            <div className="space-y-6">
              <Card className="mb-4">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-4 w-4 text-pink-500" />
                      Acerto de {formatDate(acerto.settlement_date)}
                    </CardTitle>
                    <Badge 
                      variant={acerto.status === 'concluido' ? 'default' : 'outline'}
                      className={acerto.status === 'concluido' 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200 border-green-300' 
                        : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300'}
                    >
                      {acerto.status === 'concluido' ? 'Concluído' : 'Pendente'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total em vendas:</p>
                      <p className="font-semibold text-lg">{formatCurrency(acerto.total_sales)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Comissão da revendedora ({acerto?.seller?.commission_rate ? 
                          `${(acerto.seller.commission_rate * 100).toFixed(0)}%` : 
                          '30%'}):
                      </p>
                      <p className="font-semibold text-lg text-green-600">{formatCurrency(acerto?.commission_amount)}</p>
                    </div>
                  </div>
                  
                  {acerto.items_vendidos && acerto.items_vendidos.length > 0 ? (
                    <div>
                      <h4 className="font-medium mb-2 mt-4 flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        Itens Vendidos ({acerto.items_vendidos.length})
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {acerto.items_vendidos.map((item) => (
                          <div key={item.id} className="border rounded p-3 flex items-center justify-between">
                            <div>
                              <p className="font-medium">{item.product?.name}</p>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span>Código: {item.product?.sku}</span>
                                <span>Preço: {formatCurrency(item.price)}</span>
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
                                {item.customer_name && (
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    Cliente: {item.customer_name}
                                  </span>
                                )}
                                {item.payment_method && (
                                  <span className="flex items-center gap-1">
                                    <CreditCard className="h-3 w-3" />
                                    Pagamento: {formatPaymentMethod(item.payment_method)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="w-16 h-16 bg-gray-100 rounded-md mr-3 flex-shrink-0">
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
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Nenhum item registrado neste acerto.</p>
                  )}
                  
                  <div className="mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={viewReceiptPdf}
                      className="w-full sm:w-auto flex items-center gap-2"
                      disabled={isPrinting}
                    >
                      {isPrinting ? (
                        <div className="h-4 w-4 border-2 border-t-transparent border-pink-500 rounded-full animate-spin mr-2"></div>
                      ) : (
                        <Printer className="h-4 w-4 mr-2" />
                      )}
                      Visualizar Comprovante
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={handleForceReload}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
