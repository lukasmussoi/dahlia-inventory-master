
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EtiquetasCustom } from "@/components/etiquetas/EtiquetasCustom";
import { AuthController } from "@/controllers/authController";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function EtiquetasCustomRoute() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar autenticação ao carregar a página
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log("Sessão não encontrada, redirecionando para login");
          toast.error("Você precisa estar autenticado para acessar esta página");
          navigate('/');
          return;
        }
        console.log("Usuário autenticado:", session.user.id);
        setIsAuthenticated(true);
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

  // Buscar perfil e permissões do usuário
  const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => AuthController.getUserProfileWithRoles(),
    enabled: isAuthenticated, // Só busca o perfil se estiver autenticado
  });

  // Se estiver carregando, mostrar loading
  if (isLoadingProfile || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  console.log("Perfil do usuário carregado:", userProfile);

  return (
    <div className="h-full min-h-screen bg-background">
      <main className="flex-1 space-y-4 p-4 pt-20">
        <EtiquetasCustom />
      </main>
    </div>
  );
}
