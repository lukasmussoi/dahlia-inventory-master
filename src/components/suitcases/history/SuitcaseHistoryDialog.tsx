
/**
 * Diálogo de Histórico da Maleta
 * @file Exibe o histórico completo de acertos de uma maleta específica
 * @relacionamento Utilizado pelo SuitcaseCard quando o admin clica em "Histórico"
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { LoadingIndicator } from "@/components/shared/LoadingIndicator";
import { X, Calendar, TrendingUp } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CombinedSuitcaseController } from "@/controllers/suitcase";
import { Acerto, AcertoItem } from "@/types/suitcase";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

// Cores para o gráfico
const CHART_COLORS = [
  "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF",
  "#FF9F40", "#8AC926", "#1982C4", "#6A4C93", "#F94144"
];

interface SuitcaseHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suitcaseId: string;
  suitcaseCode: string;
}

export function SuitcaseHistoryDialog({
  open,
  onOpenChange,
  suitcaseId,
  suitcaseCode
}: SuitcaseHistoryDialogProps) {
  // Estados locais
  const [acertos, setAcertos] = useState<Acerto[]>([]);
  const [topItems, setTopItems] = useState<{id: string, name: string, quantity: number, total: number}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("resumo");
  
  // Referência para controlar o estado de montagem
  const isMounted = useRef(true);
  
  // QueryClient para gerenciamento de cache
  const queryClient = useQueryClient();
  
  // Função para limpar recursos e fechar o diálogo
  const handleClose = useCallback(() => {
    console.log("[SuitcaseHistoryDialog] Fechando diálogo e limpando recursos");
    
    // Limpar cache da query para evitar vazamentos
    if (suitcaseId) {
      queryClient.cancelQueries({
        queryKey: ["acertos-historico", suitcaseId]
      });
      
      // Opcionalmente remover do cache ao fechar
      queryClient.removeQueries({
        queryKey: ["acertos-historico", suitcaseId]
      });
    }
    
    // Limpar estados locais
    setAcertos([]);
    setTopItems([]);
    setActiveTab("resumo");
    setIsLoading(false);
    
    // Notificar mudança de estado para o componente pai
    onOpenChange(false);
  }, [onOpenChange, suitcaseId, queryClient]);

  // Buscar dados do histórico da maleta
  const fetchHistoryData = useCallback(async () => {
    if (!open || !suitcaseId || !isMounted.current) return;
    
    console.log(`[SuitcaseHistoryDialog] Buscando dados para maleta ${suitcaseId}`);
    setIsLoading(true);
    
    try {
      // Buscar acertos da maleta
      const historico = await CombinedSuitcaseController.getHistoricoAcertos(suitcaseId);
      
      // Verificar se o componente ainda está montado antes de atualizar o estado
      if (!isMounted.current) return;
      
      setAcertos(historico);
      
      console.log("Histórico de acertos carregado:", historico);
      
      // Processar e calcular os itens mais vendidos
      const itemsMap = new Map<string, {id: string, name: string, quantity: number, total: number}>();
      
      // Percorrer todos os acertos e seus itens vendidos
      historico.forEach(acerto => {
        console.log(`Processando acerto ${acerto.id} com ${acerto.items_vendidos?.length || 0} itens vendidos`);
        
        if (!acerto.items_vendidos || acerto.items_vendidos.length === 0) return;
        
        acerto.items_vendidos.forEach(item => {
          if (!item.product) return;
          
          const productId = item.product.id;
          const productName = item.product.name;
          const itemPrice = item.price || 0;
          
          console.log(`Item vendido: ${productName} (ID: ${productId}) - Preço: ${itemPrice}`);
          
          if (itemsMap.has(productId)) {
            const existingItem = itemsMap.get(productId)!;
            existingItem.quantity += 1;
            existingItem.total += itemPrice;
          } else {
            itemsMap.set(productId, {
              id: productId,
              name: productName,
              quantity: 1,
              total: itemPrice
            });
          }
        });
      });
      
      // Ordenar e pegar os 5 mais vendidos
      const sortedItems = Array.from(itemsMap.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
      
      console.log("Top 5 itens vendidos processados:", sortedItems);
      
      // Verificar novamente se o componente está montado
      if (isMounted.current) {
        setTopItems(sortedItems);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Erro ao buscar histórico da maleta:", error);
      
      // Verificar se o componente está montado antes de mostrar o toast
      if (isMounted.current) {
        toast.error("Erro ao carregar o histórico da maleta");
        setIsLoading(false);
      }
    }
  }, [suitcaseId, open]);

  // Efeito para gerenciar o ciclo de vida do componente
  useEffect(() => {
    console.log(`[SuitcaseHistoryDialog] Inicializando, open: ${open}`);
    isMounted.current = true;
    
    return () => {
      console.log("[SuitcaseHistoryDialog] Desmontando componente");
      isMounted.current = false;
    };
  }, []);

  // Efeito para carregar dados quando a modal abrir
  useEffect(() => {
    if (open) {
      console.log("[SuitcaseHistoryDialog] Modal aberta, carregando dados");
      fetchHistoryData();
    }
  }, [open, fetchHistoryData]);

  // Calcular resumos financeiros corretamente
  const calculateSummary = useCallback(() => {
    // Iniciar com valores zerados
    let totalVendas = 0;
    let totalComissoes = 0;
    let totalCustos = 0;
    let totalLucro = 0;
    
    // Percorrer todos os acertos para somar valores
    acertos.forEach(acerto => {
      // Valores básicos que já estão no acerto
      totalVendas += acerto.total_sales || 0;
      totalComissoes += acerto.commission_amount || 0;
      
      // Calcular custos de forma confiável
      const custosItens = acerto.items_vendidos?.reduce(
        (sum, item) => sum + (item.unit_cost || 0), 
        0
      ) || 0;
      
      totalCustos += custosItens;
      
      // Verificar se o lucro líquido já existe no acerto, se não, calcular
      if (acerto.net_profit !== undefined && acerto.net_profit !== null) {
        totalLucro += acerto.net_profit;
      } else {
        // Calcular: vendas - comissões - custos
        const lucroCalculado = acerto.total_sales - acerto.commission_amount - custosItens;
        totalLucro += lucroCalculado;
      }
    });
    
    return {
      totalVendas,
      totalComissoes, 
      totalCustos,
      totalLucro
    };
  }, [acertos]);

  // Formatar valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Formatar datas
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };

  // Gerar dados para gráfico de pizza
  const generatePieChartData = useCallback(() => {
    const { totalVendas, totalComissoes, totalCustos, totalLucro } = calculateSummary();
    
    return [
      { name: 'Lucro', value: totalLucro },
      { name: 'Comissões', value: totalComissoes },
      { name: 'Outros Custos', value: totalCustos }
    ];
  }, [calculateSummary]);

  // Gerar dados para gráfico de barras
  const generateBarChartData = useCallback(() => {
    return acertos.slice(0, 5).map(acerto => {
      // Calcular o lucro líquido para este acerto específico se não estiver definido
      const custosItens = acerto.items_vendidos?.reduce(
        (sum, item) => sum + (item.unit_cost || 0), 
        0
      ) || 0;
      
      const lucro = acerto.net_profit !== undefined 
        ? acerto.net_profit 
        : (acerto.total_sales || 0) - (acerto.commission_amount || 0) - custosItens;
      
      return {
        data: formatDate(acerto.settlement_date),
        vendas: acerto.total_sales || 0,
        lucro: lucro,
        comissao: acerto.commission_amount || 0
      };
    });
  }, [acertos]);

  const summary = calculateSummary();
  const pieChartData = generatePieChartData();
  const barChartData = generateBarChartData();

  // Componente de carregamento
  if (isLoading && open) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <button 
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar</span>
          </button>
          
          <DialogTitle>Histórico da Maleta {suitcaseCode}</DialogTitle>
          <div className="flex justify-center items-center p-8">
            <LoadingIndicator />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <button 
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Fechar</span>
        </button>
        
        <DialogHeader>
          <DialogTitle>Histórico da Maleta {suitcaseCode}</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="acertos">Acertos Anteriores</TabsTrigger>
          </TabsList>
          
          <TabsContent value="resumo" className="space-y-4 mt-4">
            {/* Resumo da maleta */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-pink-600">{formatCurrency(summary.totalVendas)}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm font-medium">Total de Comissões</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.totalComissoes)}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalLucro)}</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Gráficos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Distribuição de Valores</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Evolução de Vendas</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData}>
                      <XAxis dataKey="data" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="vendas" name="Vendas" fill="#FF6384" />
                      <Bar dataKey="lucro" name="Lucro" fill="#4BC0C0" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
            
            {/* Top 5 itens mais vendidos */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Top 5 Itens Mais Vendidos</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topItems.length > 0 ? (
                  <div className="divide-y">
                    {topItems.map((item, index) => (
                      <div key={item.id} className="py-2 flex justify-between items-center">
                        <div className="flex-1">
                          <span className="font-medium text-sm">{index + 1}. {item.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-600 px-2 py-1 bg-gray-100 rounded">
                            {item.quantity} {item.quantity === 1 ? 'unidade' : 'unidades'}
                          </span>
                          <span className="text-sm font-medium">{formatCurrency(item.total)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Nenhum item vendido ainda nesta maleta.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="acertos" className="space-y-4 mt-4">
            {acertos.length > 0 ? (
              <div className="space-y-4">
                {acertos.map((acerto) => (
                  <Card key={acerto.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-md flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Acerto em {formatDate(acerto.settlement_date)}</span>
                        </CardTitle>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          acerto.status === 'concluido' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {acerto.status === 'concluido' ? 'Concluído' : 'Pendente'}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Itens Vendidos</p>
                          <p className="text-lg font-medium">
                            {acerto.items_vendidos?.length || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Valor Total</p>
                          <p className="text-lg font-medium">
                            {formatCurrency(acerto.total_sales || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Comissão</p>
                          <p className="text-lg font-medium">
                            {formatCurrency(acerto.commission_amount || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Lucro Líquido</p>
                          <p className="text-lg font-medium">
                            {formatCurrency(
                              acerto.net_profit !== undefined 
                                ? acerto.net_profit 
                                : (acerto.total_sales || 0) - (acerto.commission_amount || 0) - (
                                  acerto.items_vendidos?.reduce((sum, item) => sum + (item.unit_cost || 0), 0) || 0
                                )
                            )}
                          </p>
                        </div>
                      </div>
                      
                      {acerto.items_vendidos && acerto.items_vendidos.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">Itens vendidos neste acerto:</h4>
                          <div className="text-sm text-gray-700 grid grid-cols-1 gap-1 max-h-32 overflow-y-auto">
                            {acerto.items_vendidos.map((item, idx) => (
                              <div key={item.id || idx} className="py-1 px-2 bg-gray-50 rounded flex justify-between">
                                <span>{item.product?.name || 'Item não encontrado'}</span>
                                <span>{formatCurrency(item.price || 0)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum acerto registrado para esta maleta.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={handleClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
