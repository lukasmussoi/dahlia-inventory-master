
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { InventoryLabels } from "@/components/inventory/labels/InventoryLabels";
import { AuthController } from "@/controllers/authController";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { EtiquetaCustomForm } from "@/components/inventory/labels/EtiquetaCustomForm";
import { EtiquetaCustomModel } from "@/models/etiquetaCustomModel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function InventoryLabelsRoute() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [editModeloId, setEditModeloId] = useState<string | null>(searchParams.get("edit"));
  const [modeloEmEdicao, setModeloEmEdicao] = useState(null);
  const [isLoadingModelo, setIsLoadingModelo] = useState(false);

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

  // Carregar modelo para edição quando houver um ID na URL
  useEffect(() => {
    const loadModeloParaEdicao = async () => {
      if (editModeloId) {
        setIsLoadingModelo(true);
        try {
          const modelo = await EtiquetaCustomModel.getById(editModeloId);
          if (modelo) {
            setModeloEmEdicao(modelo);
          } else {
            toast.error("Modelo de etiqueta não encontrado");
            setSearchParams({});
          }
        } catch (error) {
          console.error("Erro ao carregar modelo para edição:", error);
          toast.error("Erro ao carregar modelo de etiqueta");
          setSearchParams({});
        } finally {
          setIsLoadingModelo(false);
        }
      } else {
        setModeloEmEdicao(null);
      }
    };

    loadModeloParaEdicao();
  }, [editModeloId, setSearchParams]);

  // Buscar perfil e permissões do usuário
  const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => AuthController.getUserProfileWithRoles(),
    enabled: !isLoading, // Só executa quando a verificação inicial estiver concluída
  });

  // Fechar diálogo de edição
  const handleCloseEdit = () => {
    setEditModeloId(null);
    setSearchParams({});
  };

  // Callback de sucesso na edição
  const handleEditSuccess = () => {
    toast.success("Modelo de etiqueta atualizado com sucesso!");
    handleCloseEdit();
  };

  // Se estiver carregando, mostrar loading
  if (isLoading || isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-screen bg-background">
      <main className="flex-1 space-y-4 p-4 pt-20">
        <InventoryLabels />
      </main>

      {/* Diálogo de edição de modelo */}
      <Dialog open={!!editModeloId} onOpenChange={(open) => {
        if (!open) handleCloseEdit();
      }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle>Editar Modelo de Etiqueta</DialogTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleCloseEdit} 
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          {isLoadingModelo ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : modeloEmEdicao ? (
            <EtiquetaCustomForm
              modelo={modeloEmEdicao}
              onClose={handleCloseEdit}
              onSuccess={handleEditSuccess}
            />
          ) : (
            <div className="py-8 text-center text-gray-500">
              Modelo não encontrado
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
