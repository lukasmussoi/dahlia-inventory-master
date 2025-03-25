
import { useEffect, useState } from "react";
import { SuitcasesContent } from "@/components/suitcases/SuitcasesContent";
import { AuthController } from "@/controllers/authController";
import { useQuery } from "@tanstack/react-query";
import { CombinedSuitcaseController } from "@/controllers/suitcase";

const Suitcases = () => {
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
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-pearl pt-20">
      <SuitcasesContent isAdmin={userProfile?.isAdmin} userProfile={userProfile?.profile} />
    </div>
  );
};

export default Suitcases;
