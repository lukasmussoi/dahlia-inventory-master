
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { InventoryContent } from "@/components/inventory/InventoryContent";
import { AuthController } from "@/controllers/authController";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PrintLabelConfirmDialog } from "@/components/inventory/PrintLabelConfirmDialog";

const Inventory = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [lastModifiedItem, setLastModifiedItem] = useState<any>(null);

  // Verificar autenticação ao carregar a página
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await AuthController.checkAuth();
        if (!user) {
          toast.error("Sessão expirada. Por favor, faça login novamente.");
          navigate('/');
          return;
        }

        // Verificar se o usuário tem perfil e permissões
        const userProfile = await AuthController.getUserProfileWithRoles();
        if (userProfile) {
          setIsAdmin(userProfile.isAdmin);
        }
        
        // Verificar estrutura da tabela inventory para diagnóstico
        // Removendo a chamada que causava o erro, pois já fizemos a verificação via SQL
        console.log("Verificando autenticação...");
        
        setIsLoading(false);
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        toast.error("Erro ao verificar autenticação");
        navigate('/');
      }
    };

    checkAuth();
  }, [navigate]);

  // Manipulador para quando um item for criado ou editado
  const handleItemModified = (item: any) => {
    console.log("Item modificado:", item);
    setLastModifiedItem(item);
    setShowPrintDialog(true);
  };

  // Fechar diálogo de impressão
  const handleClosePrintDialog = () => {
    setShowPrintDialog(false);
    setLastModifiedItem(null);
  };

  // Se estiver carregando, mostrar loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-screen bg-background">
      <main className="flex-1 space-y-4 p-4 pt-20">
        <InventoryContent isAdmin={isAdmin} onItemModified={handleItemModified} />
        
        {/* Diálogo de confirmação para impressão de etiqueta */}
        {showPrintDialog && lastModifiedItem && (
          <PrintLabelConfirmDialog 
            isOpen={showPrintDialog}
            onClose={handleClosePrintDialog}
            item={lastModifiedItem}
          />
        )}
      </main>
    </div>
  );
}

export default Inventory;
