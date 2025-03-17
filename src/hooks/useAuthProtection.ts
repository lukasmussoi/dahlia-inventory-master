
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthController } from '@/controllers/authController';
import { useQuery } from '@tanstack/react-query';

interface UseAuthProtectionResult {
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  userProfile: any;
}

/**
 * Hook personalizado para proteger rotas e verificar permissões
 * Este hook centraliza a lógica de autenticação e controle de acesso
 * para evitar duplicação de código e inconsistências
 */
export const useAuthProtection = (): UseAuthProtectionResult => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar autenticação ao carregar a página
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Verificando autenticação...");
        const user = await AuthController.checkAuth();
        if (!user) {
          console.log("Usuário não autenticado, redirecionando...");
          toast.error("Sessão expirada. Por favor, faça login novamente.");
          navigate('/');
          return;
        }
        console.log("Usuário autenticado com sucesso:", user.id);
        setIsAuthenticated(true);
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
    enabled: isAuthenticated, // Só executa quando a autenticação for confirmada
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutos
    onError: (error) => {
      console.error("Erro ao buscar perfil do usuário:", error);
      toast.error("Erro ao carregar perfil do usuário");
    }
  });

  return {
    isLoading: isLoading || isLoadingProfile,
    isAuthenticated,
    isAdmin: !!userProfile?.isAdmin,
    userProfile
  };
};
