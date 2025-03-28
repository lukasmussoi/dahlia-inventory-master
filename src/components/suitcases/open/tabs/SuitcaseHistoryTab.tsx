
/**
 * Aba de Histórico da Maleta
 * @file Exibe os acertos passados e estatísticas de vendas da maleta
 * @relacionamento Utilizado pelo OpenSuitcaseDialog na aba "Histórico da Maleta"
 */
import { useMemo } from "react";
import { Suitcase, Acerto } from "@/types/suitcase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatMoney } from "@/utils/formatUtils";
import { getProductPhotoUrl } from "@/utils/photoUtils";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

interface SuitcaseHistoryTabProps {
  suitcase: Suitcase;
  acertosHistorico: Acerto[];
}

export function SuitcaseHistoryTab({
  suitcase,
  acertosHistorico
}: SuitcaseHistoryTabProps) {
  // Formatar os dados para o gráfico
  const chartData = useMemo(() => {
    return acertosHistorico
      .filter(acerto => acerto.status === 'concluido')
      .map(acerto => ({
        date: format(parseISO(acerto.settlement_date), 'dd/MM/yy'),
        vendas: Number(acerto.total_sales || 0),
        lucro: Number(acerto.net_profit || 0)
      }))
      .sort((a, b) => a.date.localeCompare(b.date)); // Ordenar por data
  }, [acertosHistorico]);

  // Processar todos os itens vendidos de todos os acertos para análise
  const todosItensVendidos = useMemo(() => {
    // Array para guardar todos os itens vendidos de todos os acertos
    const itens: any[] = [];
    
    // Processar cada acerto
    acertosHistorico.forEach(acerto => {
      if (acerto.items_vendidos && Array.isArray(acerto.items_vendidos)) {
        acerto.items_vendidos.forEach(item => {
          if (item.product) {
            // Adicionar item à lista de vendidos com dados completos
            itens.push({
              id: item.inventory_id,
              name: item.product.name,
              sku: item.product.sku,
              price: Number(item.price || item.product.price || 0),
              photo_url: getProductPhotoUrl(item.product.photo_url),
              unit_cost: Number(item.unit_cost || item.product.unit_cost || 0)
            });
          }
        });
      }
    });
    
    return itens;
  }, [acertosHistorico]);

  // Calcular top 5 itens mais vendidos
  const topItensVendidos = useMemo(() => {
    // Agrupar itens por ID e contar ocorrências
    const contagem = todosItensVendidos.reduce((acc, item) => {
      const key = item.id;
      if (!acc[key]) {
        acc[key] = {
          id: item.id,
          name: item.name,
          sku: item.sku,
          photo_url: item.photo_url,
          quantity: 1,
          total: item.price
        };
      } else {
        acc[key].quantity += 1;
        acc[key].total += item.price;
      }
      return acc;
    }, {} as Record<string, any>);
    
    // Converter para array e ordenar por quantidade
    const topItems = Object.values(contagem)
      .sort((a, b) => b.quantity - a.quantity || b.total - a.total)
      .slice(0, 5); // Limitar aos 5 principais
      
    console.log("Top 5 itens vendidos processados:", topItems);
    return topItems;
  }, [todosItensVendidos]);

  return (
    <div className="space-y-6">
      {/* Gráfico de Vendas */}
      {chartData.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Evolução de Vendas e Lucro</CardTitle>
            <CardDescription>
              Histórico dos últimos {chartData.length} acertos realizados
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [formatMoney(Number(value)), ""]} 
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Legend />
                <Bar dataKey="vendas" name="Total Vendido" fill="#8884d8" />
                <Bar dataKey="lucro" name="Lucro Líquido" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Evolução de Vendas e Lucro</CardTitle>
            <CardDescription>
              Não há acertos concluídos para exibir no gráfico
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 flex justify-center items-center h-[300px]">
            <p className="text-gray-500">Sem dados disponíveis</p>
          </CardContent>
        </Card>
      )}

      {/* Lista de Acertos */}
      <div>
        <h3 className="text-lg font-medium mb-3">
          Histórico de Acertos
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({acertosHistorico.length} {acertosHistorico.length === 1 ? 'acerto' : 'acertos'})
          </span>
        </h3>
        
        {acertosHistorico.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Comissão</TableHead>
                <TableHead>Lucro Líquido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {acertosHistorico.map((acerto) => (
                <TableRow key={acerto.id}>
                  <TableCell>
                    {format(parseISO(acerto.settlement_date), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={acerto.status === 'concluido' ? 'default' : 'outline'}>
                      {acerto.status === 'concluido' ? 'Concluído' : 'Pendente'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatMoney(Number(acerto.total_sales || 0))}</TableCell>
                  <TableCell>{formatMoney(Number(acerto.commission_amount || 0))}</TableCell>
                  <TableCell>{formatMoney(Number(acerto.net_profit || 0))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-md">
            <p className="text-gray-500">Não há acertos registrados para esta maleta.</p>
          </div>
        )}
      </div>

      {/* Top 5 Itens Mais Vendidos */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Itens Mais Vendidos</CardTitle>
          <CardDescription>
            Os itens mais vendidos desta maleta
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topItensVendidos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {topItensVendidos.map((item) => (
                <div 
                  key={item.id} 
                  className="border rounded-md p-2 flex flex-col items-center text-center"
                >
                  <div className="w-16 h-16 mb-2">
                    {item.photo_url ? (
                      <img
                        src={item.photo_url}
                        alt={item.name}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-gray-500 text-xs">Sem foto</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium truncate w-full">{item.name}</p>
                  <p className="text-xs text-gray-500 truncate w-full">{item.sku}</p>
                  <div className="mt-1 flex flex-col items-center">
                    <Badge variant="outline">
                      {item.quantity} {item.quantity === 1 ? 'venda' : 'vendas'}
                    </Badge>
                    <span className="text-xs mt-1 font-medium">
                      {formatMoney(item.total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum item vendido ainda nesta maleta.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
