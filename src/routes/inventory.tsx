
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { InventoryContent } from "@/components/inventory/InventoryContent";
import { AuthController } from "@/controllers/authController";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const Inventory = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  // Verificar autenticação ao carregar a página
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await AuthController.checkAuth();
        if (!user) {
          toast.error("Sessão expirada. Por favor, faça login novamente.");
          navigate('/');
          return;
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        toast.error("Erro ao verificar autenticação");
        navigate('/');
      }
    };

    checkAuth();
  }, [navigate]);

  // Buscar perfil e permissões do usuário
  const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => AuthController.getUserProfileWithRoles(),
    enabled: !isLoading, // Só executa quando a verificação inicial estiver concluída
  });

  // Se estiver carregando, mostrar loading
  if (isLoading || isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-screen bg-background">
      <main className="flex-1 space-y-4 p-4 pt-20">
        <InventoryContent isAdmin={userProfile?.isAdmin} />
      </main>
    </div>
  );
}

export default Inventory;
