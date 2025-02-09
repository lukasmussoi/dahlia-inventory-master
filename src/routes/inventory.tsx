
import { useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { InventoryContent } from "@/components/inventory/InventoryContent";
import { AuthController } from "@/controllers/authController";
import { useQuery } from "@tanstack/react-query";

const Inventory = () => {
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
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-pearl">
        <DashboardSidebar isAdmin={userProfile?.isAdmin} />
        <InventoryContent isAdmin={userProfile?.isAdmin} />
      </div>
    </SidebarProvider>
  );
};

export default Inventory;
