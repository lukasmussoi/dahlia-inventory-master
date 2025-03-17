
import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { TopNavbar } from "@/components/dashboard/TopNavbar";
import { AuthController } from "@/controllers/authController";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const Dashboard = () => {
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
        console.error('Erro ao verificar autenticação:', error);
        toast.error("Erro ao verificar autenticação. Por favor, tente novamente.");
        navigate('/');
      }
    };
    
    checkAuth();
  }, [navigate]);

  // Buscar perfil e permissões do usuário após autenticação confirmada
  const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => AuthController.getUserProfileWithRoles(),
    enabled: !isLoading, // Só executa quando a verificação inicial estiver concluída
  });

  if (isLoading || isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pearl">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pearl to-pearl-dark">
      <TopNavbar isAdmin={userProfile?.isAdmin} />
      <div className="pt-16">
        <Outlet />
      </div>
    </div>
  );
};

export default Dashboard;
