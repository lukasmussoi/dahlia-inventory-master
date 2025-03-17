
import { useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PromoterList } from "@/components/promoters/PromoterList";
import { useAuthProtection } from "@/hooks/useAuthProtection";
import { LoadingIndicator } from "@/components/shared/LoadingIndicator";
import { AccessDenied } from "@/components/shared/AccessDenied";
import { useState } from "react";
import { PromoterDialog } from "@/components/promoters/PromoterDialog";

export default function PromotersPage() {
  const navigate = useNavigate();
  const { isLoading, isAuthenticated, isAdmin } = useAuthProtection();
  const [isPromoterDialogOpen, setIsPromoterDialogOpen] = useState(false);

  console.log("PromotersPage - Estado de autenticação:", { isLoading, isAuthenticated, isAdmin });

  // Se estiver carregando, mostrar indicador de carregamento
  if (isLoading) {
    console.log("PromotersPage - Carregando...");
    return <LoadingIndicator message="Carregando informações do módulo de promotoras..." />;
  }

  // Verificar se o usuário está autenticado
  if (!isAuthenticated) {
    console.log("PromotersPage - Usuário não autenticado");
    return <LoadingIndicator message="Verificando autenticação..." />;
  }

  // Verificar se o usuário é admin
  if (!isAdmin) {
    console.log("PromotersPage - Usuário não é administrador");
    return <AccessDenied />;
  }

  console.log("PromotersPage - Renderizando página completa");
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Promotoras</h1>
          <p className="text-muted-foreground">
            Gerencie as promotoras do sistema
          </p>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button 
              onClick={() => navigate("/dashboard/sales/promoters/new")}
              className="mb-4"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Nova Promotora
            </Button>
            <Button 
              onClick={() => setIsPromoterDialogOpen(true)}
              className="mb-4"
              variant="outline"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Nova Promotora (Modal)
            </Button>
          </div>
        </div>
        
        <PromoterList />
        
        <PromoterDialog
          open={isPromoterDialogOpen}
          onOpenChange={setIsPromoterDialogOpen}
          promoter={null}
          onClose={(saved) => {
            setIsPromoterDialogOpen(false);
          }}
        />
      </div>
    </div>
  );
}
