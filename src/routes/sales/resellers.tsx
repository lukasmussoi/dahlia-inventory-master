
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResellerList } from "@/components/resellers/ResellerList";
import { useAuthProtection } from "@/hooks/useAuthProtection";
import { LoadingIndicator } from "@/components/shared/LoadingIndicator";
import { AccessDenied } from "@/components/shared/AccessDenied";

export default function ResellersPage() {
  const navigate = useNavigate();
  const { isLoading, isAuthenticated, isAdmin } = useAuthProtection();

  console.log("ResellersPage - Estado de autenticação:", { isLoading, isAuthenticated, isAdmin });

  // Se estiver carregando, mostrar indicador de carregamento
  if (isLoading) {
    return <LoadingIndicator message="Carregando informações do módulo de revendedoras..." />;
  }

  // Verificar se o usuário está autenticado
  if (!isAuthenticated) {
    return <LoadingIndicator message="Verificando autenticação..." />;
  }

  // Verificar se o usuário é admin
  if (!isAdmin) {
    return <AccessDenied />;
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
        
        <div className="flex justify-between items-center">
          <Button 
            onClick={() => navigate("/dashboard/sales/resellers/new")}
            className="mb-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Revendedora
          </Button>
        </div>
        
        <ResellerList />
      </div>
    </div>
  );
}
