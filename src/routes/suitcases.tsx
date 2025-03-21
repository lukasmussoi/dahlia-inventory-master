
import { useEffect, useState } from "react";
import { SuitcasesContent } from "@/components/suitcases/SuitcasesContent";
import { AuthController } from "@/controllers/authController";
import { useQuery } from "@tanstack/react-query";
import { LoadingIndicator } from "@/components/shared/LoadingIndicator";

const Suitcases = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  // Verificar autenticação ao carregar a página - apenas uma vez
  useEffect(() => {
    const checkAuth = async () => {
      await AuthController.checkAuth();
      setIsInitialized(true);
    };
    checkAuth();
  }, []);

  // Buscar perfil e permissões do usuário com otimizações para evitar recargas
  const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => AuthController.getUserProfileWithRoles(),
    staleTime: 300000, // Cache por 5 minutos
    refetchOnWindowFocus: false, // Não recarregar ao focar na janela
    enabled: isInitialized, // Só buscar após a inicialização
  });

  // Se estiver carregando, mostrar loading otimizado
  if (isLoadingProfile || !isInitialized) {
    return <LoadingIndicator />;
  }

  return (
    <div className="min-h-screen w-full bg-pearl pt-20">
      <SuitcasesContent isAdmin={userProfile?.isAdmin} userProfile={userProfile?.profile} />
    </div>
  );
};

export default Suitcases;
