
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ResellerList } from "@/components/resellers/ResellerList";
import { AuthController } from "@/controllers/authController";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export default function ResellersPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  // Verificar autenticação ao carregar a página
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await AuthController.checkAuth();
        if (!user) {
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
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  // Verificar se o usuário é admin
  if (!userProfile?.isAdmin) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-destructive/20 p-4 rounded-md">
          <h2 className="text-xl font-bold text-destructive">Acesso Negado</h2>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página. Esta funcionalidade é restrita aos administradores do sistema.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Revendedoras</h1>
          <p className="text-muted-foreground">
            Gerencie as revendedoras do sistema
          </p>
        </div>
        <ResellerList />
      </div>
    </div>
  );
}
