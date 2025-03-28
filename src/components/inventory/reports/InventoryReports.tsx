
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InventoryModel } from "@/models/inventory";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function InventoryReports() {
  const [isLoading, setIsLoading] = useState(true);
  const [inventoryStats, setInventoryStats] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Obter estatísticas do inventário
        const stats = await InventoryModel.getTotalInventory();
        setInventoryStats(stats);
      } catch (error) {
        console.error("Erro ao carregar dados do relatório:", error);
        setError("Não foi possível carregar os dados do relatório. Tente novamente mais tarde.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventoryData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Relatórios de Inventário</h1>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="categories">Por Categoria</TabsTrigger>
          <TabsTrigger value="low-stock">Baixo Estoque</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total em Estoque</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {inventoryStats?.totalItems || 0} itens
                </div>
                <p className="text-xs text-muted-foreground">
                  Total de itens no estoque
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor de Estoque</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(inventoryStats?.totalValue || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Valor total do estoque
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Custo de Estoque</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(inventoryStats?.totalCost || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Custo total do estoque
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Informações Adicionais</CardTitle>
              <CardDescription>
                Detalhes sobre o estoque atual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Métrica</TableHead>
                    <TableHead>Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Margem média</TableCell>
                    <TableCell>
                      {inventoryStats?.averageMargin 
                        ? `${(inventoryStats.averageMargin * 100).toFixed(2)}%` 
                        : 'N/A'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Itens abaixo do estoque mínimo</TableCell>
                    <TableCell>{inventoryStats?.lowStockItems || 0}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Categorias com mais itens</TableCell>
                    <TableCell>{inventoryStats?.topCategory || 'N/A'}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Itens por Categoria</CardTitle>
              <CardDescription>
                Distribuição do estoque por categoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inventoryStats?.categories && inventoryStats.categories.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryStats.categories.map((category: any) => (
                      <TableRow key={category.id}>
                        <TableCell>{category.name}</TableCell>
                        <TableCell>{category.itemCount}</TableCell>
                        <TableCell>{formatCurrency(category.value || 0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-4">Nenhuma categoria encontrada</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="low-stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Itens com Estoque Baixo</CardTitle>
              <CardDescription>
                Itens que estão abaixo ou próximos do estoque mínimo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inventoryStats?.lowStockItemsList && inventoryStats.lowStockItemsList.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Estoque Atual</TableHead>
                      <TableHead>Estoque Mínimo</TableHead>
                      <TableHead>Ações Necessárias</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryStats.lowStockItemsList.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.min_stock}</TableCell>
                        <TableCell>
                          {item.quantity < item.min_stock 
                            ? <span className="text-red-500 font-medium">Repor Urgente</span>
                            : <span className="text-yellow-500 font-medium">Monitorar</span>
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-4">Nenhum item com estoque baixo</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
