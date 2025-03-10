
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { EtiquetaCustomForm } from "@/components/inventory/labels/EtiquetaCustomForm";
import { EtiquetaCustomModel } from "@/models/etiquetaCustomModel";
import { toast } from "sonner";
import { AuthController } from "@/controllers/authController";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function EtiquetaCustomFormPage() {
  console.log("Componente EtiquetaCustomFormPage inicializado");
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [modelo, setModelo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Verificando autenticação e carregando modelo...");
        const user = await AuthController.checkAuth();
        if (!user) {
          console.log("Usuário não autenticado");
          toast.error("Você precisa estar autenticado para acessar esta página");
          navigate('/');
          return;
        }
        
        console.log("Usuário autenticado:", user);
        console.log("ID do modelo recebido:", id);
        
        // Se tiver um ID, e não for 'novo', carregar o modelo existente
        if (id && id !== 'novo') {
          console.log("Carregando modelo existente com ID:", id);
          const modeloData = await EtiquetaCustomModel.getById(id);
          if (!modeloData) {
            console.log("Modelo não encontrado");
            toast.error("Modelo de etiqueta não encontrado");
            navigate('/dashboard/inventory/labels');
            return;
          }
          
          console.log("Modelo carregado com sucesso:", modeloData);
          setModelo(modeloData);
        } else {
          console.log("Criando novo modelo (id = novo ou nulo)");
          // Se for 'novo', não precisamos carregar nenhum modelo
          // Apenas continuar com o modelo nulo para criar um novo
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Erro ao verificar autenticação ou carregar modelo:", error);
        setError("Erro ao carregar dados. Por favor, tente novamente.");
        toast.error("Erro ao carregar dados. Por favor, tente novamente.");
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [id, navigate]);

  const handleGoBack = () => {
    navigate('/dashboard/inventory/labels');
  };

  const handleSuccess = () => {
    toast.success(id && id !== 'novo' ? "Modelo atualizado com sucesso!" : "Modelo criado com sucesso!");
    navigate('/dashboard/inventory/labels');
  };

  // Se estiver em estado de erro, mostrar mensagem
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
        <Button variant="outline" onClick={handleGoBack} className="mt-4">
          Voltar para Etiquetas
        </Button>
      </div>
    );
  }

  // Se estiver carregando, mostrar loader
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
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
