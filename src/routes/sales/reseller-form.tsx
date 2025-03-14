
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthController } from "@/controllers/authController";
import { ResellerController } from "@/controllers/resellerController";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ResellerForm } from "@/components/resellers/ResellerForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ResellerFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
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

  // Buscar dados da revendedora, se for edição
  const { data: reseller, isLoading: isLoadingReseller } = useQuery({
    queryKey: ['reseller', id],
    queryFn: () => ResellerController.getResellerById(id!),
    enabled: !!id && !isLoading, // Só busca se tiver ID e a verificação inicial estiver concluída
  });

  // Callback para quando o formulário for salvo com sucesso
  const handleSuccess = () => {
    navigate('/dashboard/sales/resellers');
  };

  // Se estiver carregando, mostrar loading
  if (isLoading || isLoadingProfile || (id && isLoadingReseller)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
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
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate('/dashboard/sales/resellers')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para lista
        </Button>
      </div>
      
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">
            {id ? "Editar Revendedora" : "Nova Revendedora"}
          </h1>
          <p className="text-muted-foreground">
            {id ? "Atualize os dados da revendedora" : "Cadastre uma nova revendedora no sistema"}
          </p>
        </div>
        
        <div className="bg-card p-6 rounded-lg border">
          <ResellerForm 
            reseller={reseller}
            onCancel={() => navigate('/dashboard/sales/resellers')}
            onSuccess={handleSuccess}
          />
        </div>
      </div>
    </div>
  );
}
