
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LabelViewer } from "@/components/labels/custom/LabelViewer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthModel } from "@/models/authModel";

export default function LabelCustomViewerRoute() {
  const navigate = useNavigate();

  // Verificar autenticação ao carregar a página
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error("Você precisa estar autenticado para acessar esta página");
          navigate('/');
          return;
        }
        console.log("Usuário autenticado na visualização de etiqueta:", session.user);
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
    queryKey: ['user-profile-label-viewer'],
    queryFn: async () => {
      try {
        const profile = await AuthModel.getCurrentUserProfile();
        console.log("Perfil carregado (visualizador de etiqueta):", profile);
        return profile;
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        toast.error("Erro ao verificar permissões. Redirecionando...");
        navigate('/dashboard');
        return { profile: null, isAdmin: false };
      }
    },
  });

  // Se estiver carregando, mostrar loading
  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
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
        <LabelViewer />
      </main>
    </div>
  );
}
