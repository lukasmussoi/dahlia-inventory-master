
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { InventoryContent } from "@/components/inventory/InventoryContent";
import { AuthController } from "@/controllers/authController";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

const Inventory = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Verificar autenticação ao carregar a página
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/');
      }
    };

    checkAuth();

    // Monitorar mudanças no estado da autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

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
      {function RenderContent({ open, setOpen }) {
        return (
          <div className="min-h-screen flex w-full bg-pearl">
            <div className="fixed left-0 top-0 h-full z-50">
              <DashboardSidebar isAdmin={userProfile?.isAdmin} />
            </div>
            <div className="flex-1 md:ml-64">
              <div className="p-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setOpen(!open)}
                  className="mb-4"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </div>
              <InventoryContent isAdmin={userProfile?.isAdmin} />
            </div>
          </div>
        );
      }}
    </SidebarProvider>
  );
};

export default Inventory;
