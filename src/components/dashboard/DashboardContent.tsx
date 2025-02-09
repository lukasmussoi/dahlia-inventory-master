
import { Card } from "@/components/ui/card";
import { Users, Package, Briefcase } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DashboardController } from "@/controllers/dashboardController";

export function DashboardContent() {
  // Buscar dados do dashboard usando o controller
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard-data'],
    queryFn: () => DashboardController.getDashboardData(),
  });

  // Se houver erro, podemos mostrar uma mensagem amigável
  if (error) {
    console.error('Erro ao carregar dados do dashboard:', error);
  }

  return (
    <main className="flex-1 p-4 md:p-8 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-6 md:mb-8">Visão Geral</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <Card className="p-4 md:p-6 shadow-lg animate-slideIn hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-2 md:p-3 bg-gold/10 rounded-full">
                <Users className="h-5 w-5 md:h-6 md:w-6 text-gold" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
                <p className="text-xl md:text-2xl font-semibold text-gray-900">
                  {isLoading ? '...' : (dashboardData?.activeUsersCount ?? 0)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6 shadow-lg animate-slideIn hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-2 md:p-3 bg-rosegold/10 rounded-full">
                <Package className="h-5 w-5 md:h-6 md:w-6 text-rosegold" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Peças em Estoque</p>
                <p className="text-xl md:text-2xl font-semibold text-gray-900">
                  {isLoading ? '...' : (dashboardData?.totalInventory ?? 0)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6 shadow-lg animate-slideIn hover:shadow-xl transition-shadow md:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-2 md:p-3 bg-gray-100 rounded-full">
                <Briefcase className="h-5 w-5 md:h-6 md:w-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Maletas Ativas</p>
                <p className="text-xl md:text-2xl font-semibold text-gray-900">
                  {isLoading ? '...' : (dashboardData?.activeSuitcasesCount ?? 0)}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
