
import { useState } from "react";
import { CombinedSuitcaseController } from "@/controllers/suitcase";
import { toast } from "sonner";

export function useSuitcaseDeletion() {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Função para excluir a maleta
  const handleDeleteSuitcase = async (suitcaseId: string, onSuccess?: () => void) => {
    if (!suitcaseId) return;
    
    setIsDeleting(true);
    try {
      // Verificar se a maleta pode ser excluída
      const { canDelete, message } = await CombinedSuitcaseController.canDeleteSuitcase(suitcaseId);
      
      if (!canDelete) {
        toast.error(message || "Não é possível excluir esta maleta");
        setIsDeleting(false);
        return false;
      }
      
      // Chamar a função de exclusão da maleta
      await CombinedSuitcaseController.deleteSuitcaseWithCascade(suitcaseId);
      
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
