
import { Card } from "@/components/ui/card";
import { Users, Package, Briefcase } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DashboardController } from "@/controllers/dashboardController";

export function DashboardContent() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-data'],
    queryFn: () => DashboardController.getDashboardData(),
  });

  return (
    <main className="flex-1 p-6 md:p-8 overflow-x-hidden animate-fadeIn">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Bem-vindo ao Dália Manager
          </h1>
          <p className="text-gray-600">
            Confira os principais indicadores do seu negócio
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6 hover:shadow-lg transition-shadow duration-300 bg-white/50 backdrop-blur-sm border border-white/20">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Usuárias Ativas</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {isLoading ? '...' : (dashboardData?.activeUsersCount ?? 0)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow duration-300 bg-white/50 backdrop-blur-sm border border-white/20">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-100 rounded-full">
                <Package className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Peças em Estoque</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {isLoading ? '...' : (dashboardData?.totalInventory ?? 0)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow duration-300 bg-white/50 backdrop-blur-sm border border-white/20">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gold/20 rounded-full">
                <Briefcase className="h-6 w-6 text-gold" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Maletas Ativas</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {isLoading ? '...' : (dashboardData?.activeSuitcasesCount ?? 0)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 bg-white/50 backdrop-blur-sm border border-white/20">
            <h2 className="text-xl font-semibold mb-4">Últimas Atividades</h2>
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : (
              <div className="text-gray-600">
                Implementação futura do histórico de atividades...
              </div>
            )}
          </Card>

          <Card className="p-6 bg-white/50 backdrop-blur-sm border border-white/20">
            <h2 className="text-xl font-semibold mb-4">Resumo Financeiro</h2>
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : (
              <div className="text-gray-600">
                Implementação futura do resumo financeiro...
              </div>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}
