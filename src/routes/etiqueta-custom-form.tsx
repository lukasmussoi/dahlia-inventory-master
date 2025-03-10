
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { EtiquetaCustomForm } from "@/components/inventory/labels/EtiquetaCustomForm";
import { EtiquetaCustomModel } from "@/models/etiquetaCustomModel";
import { toast } from "sonner";
import { AuthController } from "@/controllers/authController";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function EtiquetaCustomFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [modelo, setModelo] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await AuthController.checkAuth();
        if (!user) {
          navigate('/');
          return;
        }
        
        // Se tiver um ID, carregar o modelo existente
        if (id && id !== 'novo') {
          const modeloData = await EtiquetaCustomModel.getById(id);
          if (!modeloData) {
            toast.error("Modelo de etiqueta não encontrado");
            navigate('/dashboard/inventory/labels');
            return;
          }
          setModelo(modeloData);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Erro ao verificar autenticação ou carregar modelo:", error);
        toast.error("Erro ao carregar dados. Por favor, tente novamente.");
        navigate('/dashboard/inventory/labels');
      }
    };

    checkAuth();
  }, [id, navigate]);

  const handleGoBack = () => {
    navigate('/dashboard/inventory/labels');
  };

  const handleSuccess = () => {
    toast.success(id ? "Modelo atualizado com sucesso!" : "Modelo criado com sucesso!");
    navigate('/dashboard/inventory/labels');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-screen bg-background">
      <main className="flex-1 space-y-4 p-4 pt-20">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleGoBack}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <h1 className="text-xl font-semibold">
              {id && id !== 'novo' ? 'Editar Modelo de Etiqueta' : 'Novo Modelo de Etiqueta'}
            </h1>
          </div>
        </div>

        <div className="bg-background border rounded-md">
          <EtiquetaCustomForm 
            modelo={modelo} 
            onClose={handleGoBack} 
            onSuccess={handleSuccess} 
          />
        </div>
      </main>
    </div>
  );
}
