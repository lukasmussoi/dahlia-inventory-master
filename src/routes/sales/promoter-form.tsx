
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PromoterForm } from "@/components/promoters/PromoterForm";
import { PromoterController } from "@/controllers/promoterController";
import { useAuthProtection } from "@/hooks/useAuthProtection";
import { LoadingIndicator } from "@/components/shared/LoadingIndicator";
import { AccessDenied } from "@/components/shared/AccessDenied";

export default function PromoterFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isLoading, isAuthenticated, isAdmin } = useAuthProtection();
  const [isPageLoading, setIsPageLoading] = useState(!!id);
  const [error, setError] = useState<string | null>(null);

  // Verificar se o id existe e carregar dados da promotora
  useEffect(() => {
    if (id) {
      const loadPromoter = async () => {
        try {
          setIsPageLoading(true);
          // Tentar buscar a promotora pelo ID
          await PromoterController.getPromoterById(id);
        } catch (error) {
          console.error("Erro ao carregar promotora:", error);
          setError("Promotora não encontrada ou erro ao carregar dados");
          toast.error("Erro ao carregar dados da promotora");
        } finally {
          setIsPageLoading(false);
        }
      };

      loadPromoter();
    }
  }, [id]);

  // Se estiver carregando a autenticação, mostrar indicador
  if (isLoading) {
    return <LoadingIndicator message="Verificando autenticação..." />;
  }

  // Verificar se o usuário está autenticado
  if (!isAuthenticated) {
    return <LoadingIndicator message="Verificando autenticação..." />;
  }

  // Verificar se o usuário é admin
  if (!isAdmin) {
    return <AccessDenied />;
  }

  // Se estiver carregando os dados da página, mostrar indicador
  if (isPageLoading) {
    return <LoadingIndicator message="Carregando dados da promotora..." />;
  }

  // Se houve erro ao carregar a promotora
  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-1">Erro</h1>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <button
            onClick={() => navigate("/dashboard/sales/promoters")}
            className="text-blue-500 hover:underline w-fit"
          >
            Voltar para lista de promotoras
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">
            {id ? "Editar Promotora" : "Nova Promotora"}
          </h1>
          <p className="text-muted-foreground">
            {id
              ? "Atualize os dados da promotora"
              : "Cadastre uma nova promotora no sistema"}
          </p>
        </div>

        <PromoterForm
          promoterId={id}
          onSuccess={() => {
            navigate("/dashboard/sales/promoters");
          }}
        />
      </div>
    </div>
  );
}
