
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CustomLabelsPage } from "@/components/labels/custom/CustomLabelsPage";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthModel } from "@/models/authModel";

export default function LabelsCustomRoute() {
  const navigate = useNavigate();

  // Verificar autenticação ao carregar a página
  useEffect(() => {
    console.log("Verificando autenticação em etiquetas customizadas...");
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log("Usuário não autenticado, redirecionando para login");
          toast.error("Você precisa estar autenticado para acessar esta página");
          navigate('/');
          return;
        }
        console.log("Usuário autenticado em etiquetas customizadas:", session.user.id);
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        toast.error("Erro ao verificar autenticação");
        navigate('/');
      }
    };

    checkAuth();

    // Monitorar mudanças no estado da autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        toast.error("Sessão encerrada");
        navigate('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Buscar perfil e permissões do usuário para garantir acesso total para administradores
  const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['user-profile-labels-custom'],
    queryFn: async () => {
      try {
        const profile = await AuthModel.getCurrentUserProfile();
        console.log("Perfil carregado (etiquetas customizadas):", profile);
        return profile;
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        toast.error("Erro ao verificar permissões. Redirecionando...");
        navigate('/dashboard');
        return { profile: null, isAdmin: false };
      }
    },
    retry: 1,
  });

  // Se estiver carregando, mostrar loading
  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-gray-600">Carregando perfil do usuário...</p>
        </div>
      </div>
    );
  }

  // Verificar se o usuário é administrador
  if (userProfile && !userProfile.isAdmin) {
    toast.error("Você não tem permissão para acessar esta página");
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="h-full min-h-screen bg-background">
      <main className="flex-1 space-y-4 p-4 pt-6">
        <CustomLabelsPage />
      </main>
    </div>
  );
}
