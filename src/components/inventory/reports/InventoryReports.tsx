
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { InventoryModel } from "@/models/inventoryModel";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function InventoryReports() {
  // Buscar dados do inventário
  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: () => InventoryModel.getAllItems(),
  });

  // Calcular métricas gerais
  const totalItems = inventoryItems.length;
  const totalValue = inventoryItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const averageProfit = inventoryItems.reduce((sum, item) => sum + (item.profit_margin || 0), 0) / totalItems;
  const lowStockItems = inventoryItems.filter(item => item.quantity <= item.min_stock);

  // Dados para o gráfico de lucratividade por categoria
  const profitByCategory = inventoryItems.reduce((acc, item) => {
    const categoryName = item.category_name || 'Sem categoria';
    if (!acc[categoryName]) {
      acc[categoryName] = {
        name: categoryName,
        avgProfit: 0,
        itemCount: 0,
      };
    }
    acc[categoryName].avgProfit += item.profit_margin || 0;
    acc[categoryName].itemCount += 1;
    return acc;
  }, {} as Record<string, { name: string; avgProfit: number; itemCount: number; }>);

  const chartData = Object.values(profitByCategory).map(category => ({
    name: category.name,
    lucratividade: Number((category.avgProfit / category.itemCount * 100).toFixed(2)),
  }));

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Relatórios do Estoque</h2>
        <Button onClick={() => window.print()} className="hidden print:block">
          Imprimir Relatório
        </Button>
      </div>

      {/* Cards de métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total em Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(totalValue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem Média de Lucro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(averageProfit * 100).toFixed(2)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens em Baixo Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Lucratividade por Categoria */}
      <Card className="p-4">
        <CardHeader>
          <CardTitle>Lucratividade Média por Categoria (%)</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="lucratividade" fill="#F97316" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabela de Itens em Baixo Estoque */}
      <Card>
        <CardHeader>
          <CardTitle>Itens em Baixo Estoque</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Qtd. Atual</TableHead>
                <TableHead className="text-right">Estoque Mínimo</TableHead>
                <TableHead className="text-right">Preço</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStockItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.category_name}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{item.min_stock}</TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(item.price)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
