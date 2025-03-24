
import { History, Clock, User, CreditCard, Printer, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Acerto } from "@/types/suitcase";
import { formatPrice } from "@/utils/formatUtils";
import { ptBR } from "date-fns/locale";
import { format } from "date-fns";

interface SuitcaseHistoryProps {
  acertosHistorico: Acerto[];
  isLoadingAcertos: boolean;
  handleViewReceipt: (acertoId: string) => void;
}

export function SuitcaseHistory({
  acertosHistorico,
  isLoadingAcertos,
  handleViewReceipt
}: SuitcaseHistoryProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <History className="h-5 w-5 text-pink-500" />
        <h3 className="text-lg font-medium">Histórico de Acertos</h3>
      </div>
      
      {isLoadingAcertos ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
        </div>
      ) : acertosHistorico.length === 0 ? (
        <div className="text-center py-6 border rounded-md">
          <History className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-2 text-muted-foreground">Nenhum acerto realizado</p>
          <p className="text-sm text-muted-foreground">Os acertos realizados serão exibidos aqui</p>
        </div>
      ) : (
        acertosHistorico.map((acerto) => (
          <AcertoCard 
            key={acerto.id} 
            acerto={acerto} 
            handleViewReceipt={handleViewReceipt} 
          />
        ))
      )}
    </div>
  );
}

function AcertoCard({ 
  acerto, 
  handleViewReceipt 
}: { 
  acerto: Acerto,
  handleViewReceipt: (acertoId: string) => void
}) {
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
  
  return (
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
            <p className="font-semibold text-lg">{formatPrice(acerto.total_sales)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Comissão da revendedora:</p>
            <p className="font-semibold text-lg text-green-600">{formatPrice(acerto.commission_amount)}</p>
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
                      <span>Preço: {formatPrice(item.price)}</span>
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
            onClick={() => acerto.id && handleViewReceipt(acerto.id)}
            className="w-full sm:w-auto flex items-center gap-2"
          >
            <Printer className="h-4 w-4 mr-2" />
            Visualizar Comprovante
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
