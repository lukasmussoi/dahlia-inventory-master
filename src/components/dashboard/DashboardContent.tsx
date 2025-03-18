
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { dashboardController } from "@/controllers/dashboardController";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  Users,
  ShoppingBag,
  Package,
  DollarSign,
  TrendingUp,
} from "lucide-react";

export function DashboardContent() {
  const [activeTab, setActiveTab] = useState("overview");

  // Buscar métricas do dashboard
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: dashboardController.getDashboardMetrics,
  });

  // Valor padrão para evitar erro de undefined
  const inventoryStats = metrics?.inventoryStats || { totalItems: 0, totalValue: 0 };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 lg:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Vendas Totais
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(metrics?.totalSales || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.salesGrowth > 0 ? "+" : ""}
                  {metrics?.salesGrowth}% em relação ao período anterior
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Maletas Ativas
                </CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.activeSuitcases || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.suitcasesGrowth > 0 ? "+" : ""}
                  {metrics?.suitcasesGrowth}% em relação ao período anterior
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Peças
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inventoryStats.totalItems}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(inventoryStats.totalValue)} em valor de estoque
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Revendedoras
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.totalResellers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.newResellers || 0} novas no último mês
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Vendas Recentes</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-80 flex items-center justify-center text-gray-400">
                  <Activity className="mr-2 h-5 w-5" />
                  Gráfico de vendas será exibido aqui
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Top Produtos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center text-gray-400">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Lista de top produtos será exibida aqui
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <div className="h-[600px] w-full flex items-center justify-center border rounded-lg bg-white">
            <div className="text-center text-gray-400">
              <TrendingUp className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Analytics em Desenvolvimento
              </h3>
              <p className="max-w-md">
                Módulo de analytics estará disponível em breve, com gráficos
                detalhados e métricas avançadas.
              </p>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="reports" className="space-y-4">
          <div className="h-[600px] w-full flex items-center justify-center border rounded-lg bg-white">
            <div className="text-center text-gray-400">
              <Activity className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Relatórios em Desenvolvimento
              </h3>
              <p className="max-w-md">
                Módulo de relatórios estará disponível em breve, permitindo
                exportação de dados e análises personalizadas.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
