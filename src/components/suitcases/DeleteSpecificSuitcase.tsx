
/**
 * Componente para Exclusão da Maleta Específica
 * @file Este componente executa a exclusão de uma maleta específica e todas as suas dependências,
 * incluindo itens, acertos e registros de venda
 * @depends controllers/suitcase - Para operações de exclusão de maletas
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CombinedSuitcaseController } from "@/controllers/suitcase";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

interface DeleteSpecificSuitcaseProps {
  suitcaseCode: string;
  onSuccess?: () => void;
}

export function DeleteSpecificSuitcase({ suitcaseCode, onSuccess }: DeleteSpecificSuitcaseProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [suitcaseId, setSuitcaseId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Buscar o ID da maleta pelo código
  useEffect(() => {
    const fetchSuitcaseId = async () => {
      try {
        // Buscar todas as maletas para encontrar a que tem o código específico
        const suitcases = await CombinedSuitcaseController.searchSuitcases({ searchTerm: suitcaseCode });
        
        // Encontrar a maleta específica pelo código
        const targetSuitcase = suitcases.find(s => s.code === suitcaseCode);
        
        if (targetSuitcase) {
          setSuitcaseId(targetSuitcase.id);
          console.log(`Maleta ${suitcaseCode} encontrada com ID: ${targetSuitcase.id}`);
        } else {
          console.error(`Maleta com código ${suitcaseCode} não encontrada`);
          toast.error(`Maleta ${suitcaseCode} não encontrada`);
        }
      } catch (error) {
        console.error("Erro ao buscar maleta:", error);
        toast.error("Erro ao buscar maleta");
      }
    };

    if (suitcaseCode) {
      fetchSuitcaseId();
    }
  }, [suitcaseCode]);

  // Função para excluir a maleta
  const handleDelete = async () => {
    if (!suitcaseId) {
      toast.error("ID da maleta não encontrado");
      return;
    }

    setIsLoading(true);
    try {
      // Verificar se a maleta pode ser excluída
      const { canDelete, message } = await CombinedSuitcaseController.canDeleteSuitcase(suitcaseId);
      
      if (!canDelete) {
        toast.error(message || "Não é possível excluir esta maleta");
        setIsDialogOpen(false);
        return;
      }
      
      // Executar a exclusão da maleta e suas dependências
      const success = await CombinedSuitcaseController.performSuitcaseDeletion(suitcaseId);
      
      if (success) {
        toast.success(`Maleta ${suitcaseCode} excluída com sucesso`);
        setIsDialogOpen(false);
        
        // Executar o callback de sucesso, se fornecido
        if (onSuccess) {
          onSuccess();
        } else {
          // Navegar de volta para a lista de maletas
          navigate("/dashboard/suitcases");
        }
      } else {
        toast.error("Falha ao excluir a maleta");
      }
    } catch (error: any) {
      console.error("Erro ao excluir maleta:", error);
      toast.error(error.message || "Erro ao excluir maleta");
    } finally {
      setIsLoading(false);
    }
  };

  if (!suitcaseId) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
        <p className="text-amber-800">Buscando maleta {suitcaseCode}...</p>
      </div>
    );
  }

  return (
    <>
      <Button 
        variant="destructive" 
        onClick={() => setIsDialogOpen(true)}
        className="flex items-center"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Excluir Maleta {suitcaseCode}
      </Button>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a maleta {suitcaseCode}? Esta ação é irreversível e excluirá:
              <ul className="list-disc pl-5 mt-2">
                <li>Todos os itens da maleta</li>
                <li>Todos os acertos relacionados</li>
                <li>Todos os registros de vendas</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isLoading}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <span>Excluindo...</span>
                </div>
              ) : "Excluir Maleta"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
