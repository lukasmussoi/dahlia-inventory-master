
import { useState } from "react";
import { SuitcaseController } from "@/controllers/suitcaseController";
import { toast } from "sonner";

export function useSuitcaseDeletion() {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Função para excluir a maleta
  const handleDeleteSuitcase = async (suitcaseId: string, onSuccess?: () => void) => {
    if (!suitcaseId) return;
    
    setIsDeleting(true);
    try {
      // Chamar a função de exclusão da maleta
      await SuitcaseController.deleteSuitcaseWithCascade(suitcaseId);
      
      // Fechar o diálogo de confirmação
      setShowDeleteDialog(false);
      
      // Executar callback de sucesso, se fornecido
      if (onSuccess) onSuccess();
      
      toast.success("Maleta excluída com sucesso");
      return true;
    } catch (error: any) {
      console.error("Erro ao excluir maleta:", error);
      toast.error(error.message || "Erro ao excluir maleta");
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    showDeleteDialog,
    setShowDeleteDialog,
    isDeleting,
    handleDeleteSuitcase
  };
}
