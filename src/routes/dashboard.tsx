
import { useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { AuthController } from "@/controllers/authController";
import { useQuery } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";

const Dashboard = () => {
  const isMobile = useIsMobile();

  // Verificar autenticação ao carregar a página
  useEffect(() => {
    AuthController.checkAuth();
  }, []);

  // Buscar perfil e permissões do usuário
  const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => AuthController.getUserProfileWithRoles(),
  });

  // Se estiver carregando, mostrar loading
  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen flex w-full bg-pearl">
        <div className="fixed left-0 top-0 h-full z-50">
          <DashboardSidebar isAdmin={userProfile?.isAdmin} />
        </div>
        <div className="flex-1 md:ml-64">
          <DashboardContent />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
