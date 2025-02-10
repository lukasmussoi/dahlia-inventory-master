
import { Card } from "@/components/ui/card";
import { Package, Users, Briefcase } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DashboardController } from "@/controllers/dashboardController";

export function DashboardContent() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-data'],
    queryFn: () => DashboardController.getDashboardData(),
  });

  return (
    <main className="flex-1 p-6 overflow-hidden animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="glass-effect rounded-2xl p-8 space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Bem-vindo(a) ao Dália Manager
          </h1>
          <p className="text-gray-600 max-w-2xl">
            Aqui você encontra um resumo das principais informações do seu negócio. 
            Utilize o menu lateral para navegar entre as diferentes seções do sistema.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 glass-effect hover-scale">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-purple-100 rounded-xl">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Usuárias Ativas</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {isLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    dashboardData?.activeUsersCount ?? 0
                  )}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 glass-effect hover-scale">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-rose-100 rounded-xl">
                <Package className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Peças em Estoque</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {isLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    dashboardData?.totalInventory ?? 0
                  )}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 glass-effect hover-scale">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-accent/20 rounded-xl">
                <Briefcase className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Maletas Ativas</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {isLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    dashboardData?.activeSuitcasesCount ?? 0
                  )}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 glass-effect">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Atividades Recentes
            </h2>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-lg bg-background/50 hover:bg-background transition-colors">
                    <p className="text-gray-600">Implementação futura do histórico de atividades...</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6 glass-effect">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Package className="h-5 w-5 text-rose-600" />
              Resumo do Estoque
            </h2>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-lg bg-background/50 hover:bg-background transition-colors">
                    <p className="text-gray-600">Implementação futura do resumo do estoque...</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}
