
import { useState, useEffect, useCallback, memo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Clock,
  Package,
  User,
  CreditCard,
  Printer,
  DollarSign,
  Calculator
} from "lucide-react";
import { toast } from "sonner";
import { Acerto } from "@/types/suitcase";
import { AcertoMaletaController } from "@/controllers/acertoMaletaController";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { getProductPhotoUrl } from "@/utils/photoUtils";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface AcertoDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  acertoId?: string;
}

// Memorizamos o componente de venda para evitar re-renderizações desnecessárias
const AcertoItemCard = memo(({ item }: { item: any }) => {
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
    <div className="border rounded p-3 flex items-center justify-between">
      <div>
        <p className="font-medium">{item.product?.name}</p>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>Código: {item.product?.sku}</span>
          <span>Preço: {formatCurrency(item.price)}</span>
        </div>
        <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
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
          {item.commission_value !== undefined && item.commission_value > 0 && (
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Comissão: {formatCurrency(item.commission_value)} ({formatPercent(item.commission_rate || 0.3)})
            </span>
          )}
          {item.net_profit !== undefined && (
            <span className="flex items-center gap-1">
              <Calculator className="h-3 w-3" />
              Lucro: {formatCurrency(item.net_profit)}
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
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Package className="h-8 w-8" />
          </div>
        )}
      </div>
    </div>
  );
});

// Memorizamos o componente de sugestão para evitar re-renderizações desnecessárias
const RestockSuggestionCard = memo(({ suggestion, index }: { suggestion: any, index: number }) => {
  return (
    <div key={index} className="border rounded-md p-3">
      <p className="font-medium">{suggestion.message}</p>
      {suggestion.items && suggestion.items.length > 0 && (
        <div className="mt-2 grid gap-2">
          {suggestion.items.map((item: any, idx: number) => (
            <div key={idx} className="text-sm flex justify-between items-center">
              <span>{item.name}</span>
              <Badge variant="secondary">{item.action}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export function AcertoDetailsDialog({
  open,
  onOpenChange,
  acertoId
}: AcertoDetailsDialogProps) {
  const [currentAcerto, setCurrentAcerto] = useState<Acerto | null>(null);

  const formatDate = useCallback((dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  }, []);

  // Otimizamos usando a versão mais recente do tanstack/react-query
  const { data: acerto, isLoading, isError } = useQuery({
    queryKey: ['acerto', acertoId],
    queryFn: async () => {
      if (!acertoId) return null;
      return await AcertoMaletaController.getAcertoById(acertoId) as Acerto;
    },
    enabled: !!acertoId && open,
    staleTime: 60000, // Cache por 1 minuto para evitar requisições desnecessárias
  });

  // Atualizar o estado quando os dados mudarem
  useEffect(() => {
    if (acerto) {
      setCurrentAcerto(acerto);
    }
  }, [acerto]);

  const handleGeneratePDF = useCallback(() => {
    if (!currentAcerto) return;

    try {
      // Criar um novo documento PDF
      const doc = new jsPDF();
      
      // Adicionar título
      doc.setFontSize(16);
      doc.text("Relatório de Acerto da Maleta", 14, 15);
      
      // Informações do acerto
      doc.setFontSize(12);
      doc.text(`Data do acerto: ${formatDate(currentAcerto.settlement_date)}`, 14, 25);
      doc.text(`Revendedora: ${currentAcerto.seller?.name || "Não informado"}`, 14, 30);
      
      if (currentAcerto.next_settlement_date) {
        doc.text(`Próximo acerto: ${formatDate(currentAcerto.next_settlement_date.toString())}`, 14, 35);
      }

      // Resumo financeiro
      doc.setFontSize(14);
      doc.text("Resumo Financeiro", 14, 45);
      doc.setFontSize(12);
      doc.text(`Total em vendas: ${formatCurrency(currentAcerto.total_sales)}`, 14, 50);
      doc.text(`Comissão da revendedora: ${formatCurrency(currentAcerto.commission_amount)}`, 14, 55);
      
      if (currentAcerto.net_profit !== undefined) {
        doc.text(`Lucro líquido: ${formatCurrency(currentAcerto.net_profit)}`, 14, 60);
      }
      
      // Itens vendidos
      if (currentAcerto.items_vendidos && currentAcerto.items_vendidos.length > 0) {
        // Cabeçalho da tabela de itens
        const tableHeaders = [["Produto", "Código", "Preço", "Comissão", "Lucro"]];
        
        // Limitamos a 50 itens por página para evitar problemas de memória
        const itemsPerPage = 50;
        const items = currentAcerto.items_vendidos.slice(0, Math.min(currentAcerto.items_vendidos.length, 200)); 
        
        for (let i = 0; i < items.length; i += itemsPerPage) {
          const pageItems = items.slice(i, i + itemsPerPage);
          
          // Dados da tabela
          const tableData = pageItems.map(item => [
            item.product?.name || "Produto não encontrado",
            item.product?.sku || "-",
            formatCurrency(item.price),
            formatCurrency(item.commission_value || 0),
            formatCurrency(item.net_profit || 0)
          ]);
          
          // Criar tabela
          (doc as any).autoTable({
            head: i === 0 ? tableHeaders : [], // Só mostra o cabeçalho na primeira página
            body: tableData,
            startY: i === 0 ? 70 : 10,
            theme: 'striped',
            styles: { fontSize: 10 },
            headStyles: { fillColor: [233, 30, 99] }
          });
          
          // Adicionar nova página se não for a última iteração
          if (i + itemsPerPage < items.length) {
            doc.addPage();
          }
        }
      }
      
      // Adicionar informações adicionais
      const finalY = (doc as any).lastAutoTable?.finalY || 70;
      doc.text("Relatório gerado em: " + format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR }), 14, finalY + 10);
      
      // Salvar o PDF
      doc.save(`Acerto_Maleta_${formatDate(currentAcerto.settlement_date)}.pdf`);
      toast.success("Relatório de acerto gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar o relatório PDF");
    }
  }, [currentAcerto, formatDate]);

  if (!acertoId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto p-0">
        <div className="p-6 pb-2">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-pink-500" />
            Detalhes do Acerto
          </DialogTitle>
        </div>
        
        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
            </div>
          ) : isError || !acerto ? (
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total em vendas:</p>
                      <p className="font-semibold text-lg">{formatCurrency(acerto.total_sales)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Comissão da revendedora:</p>
                      <p className="font-semibold text-lg text-green-600">{formatCurrency(acerto.commission_amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Lucro líquido:</p>
                      <p className="font-semibold text-lg text-blue-600">{formatCurrency(acerto.net_profit || 0)}</p>
                    </div>
                  </div>
                  
                  {acerto.items_vendidos && acerto.items_vendidos.length > 0 ? (
                    <div>
                      <h4 className="font-medium mb-2 mt-4 flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        Itens Vendidos ({acerto.items_vendidos.length})
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {acerto.items_vendidos.slice(0, 20).map((item) => (
                          <AcertoItemCard key={item.id} item={item} />
                        ))}
                        {acerto.items_vendidos.length > 20 && (
                          <div className="text-center py-2 text-sm text-muted-foreground">
                            + {acerto.items_vendidos.length - 20} outros itens
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Nenhum item registrado neste acerto.</p>
                  )}
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleGeneratePDF}
                      className="w-full sm:w-auto"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Gerar Relatório PDF
                    </Button>
                    
                    {acerto.receipt_url && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(acerto.receipt_url, '_blank')}
                        className="w-full sm:w-auto"
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        Visualizar Comprovante
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {acerto.restock_suggestions && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-4 w-4 text-pink-500" />
                      Sugestões para Próxima Reposição
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Array.isArray(acerto.restock_suggestions) && acerto.restock_suggestions.length > 0 ? (
                      <div className="space-y-2">
                        {acerto.restock_suggestions.slice(0, 5).map((suggestion, index) => (
                          <RestockSuggestionCard key={index} suggestion={suggestion} index={index} />
                        ))}
                        {acerto.restock_suggestions.length > 5 && (
                          <div className="text-center py-2 text-sm text-muted-foreground">
                            + {acerto.restock_suggestions.length - 5} outras sugestões
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Nenhuma sugestão de reposição disponível.</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
