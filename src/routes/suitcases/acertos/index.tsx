
/**
 * Página de Acertos de Maletas
 * @file Exibe a listagem de todos os acertos de maletas realizados
 * @relacionamento Utiliza o componente AcertosList e os controladores de acertos
 */
import { useEffect, useState } from "react";
import { AuthController } from "@/controllers/authController";
import { useQuery } from "@tanstack/react-query";
import { AcertosList } from "@/components/suitcases/settlement/AcertosList";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const AcertosPage = () => {
  // Verificar autenticação ao carregar a página
  useEffect(() => {
    AuthController.checkAuth();
  }, []);

  // Buscar perfil e permissões do usuário
  const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => AuthController.getUserProfileWithRoles(),
  });

  // Estado para controlar atualizações da lista
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Função para forçar atualização da lista
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Função para visualizar detalhes do acerto (será implementada posteriormente)
  const handleViewAcerto = (acerto: any) => {
    console.log("Visualizando acerto:", acerto);
    // Implementação futura: abrir modal de detalhes do acerto
  };

  // Se estiver carregando, mostrar loading
  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-pearl pt-20">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard/suitcases">Maletas</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink>Acertos</BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Acertos de Maletas</h1>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
          
          <AcertosList 
            onViewAcerto={handleViewAcerto}
            onRefresh={handleRefresh}
            isAdmin={userProfile?.isAdmin} 
            key={`acertos-list-${refreshTrigger}`}
          />
        </div>
      </div>
    </div>
  );
};

export default AcertosPage;
