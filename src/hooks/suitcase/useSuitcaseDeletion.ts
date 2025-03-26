
import { useState, useCallback } from "react";
import { CombinedSuitcaseController } from "@/controllers/suitcase";
import { toast } from "sonner";

export function useSuitcaseDeletion() {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteSuitcase = async (suitcaseId: string) => {
    setIsDeleting(true);
    try {
      // Verificar se a maleta pode ser excluída
      const canDelete = await CombinedSuitcaseController.canDeleteSuitcase(suitcaseId);
      if (!canDelete.canDelete) {
        toast.error(canDelete.message || "Esta maleta não pode ser excluída");
        return false;
      }

      // Excluir a maleta
      await CombinedSuitcaseController.deleteSuitcaseWithCascade(suitcaseId);
      toast.success("Maleta excluída com sucesso");
      setShowDeleteDialog(false);
      return true;
    } catch (error) {
      console.error("Erro ao excluir maleta:", error);
      toast.error("Erro ao excluir maleta");
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  // Função para resetar os estados
  const resetDeletionState = useCallback(() => {
    setShowDeleteDialog(false);
    setIsDeleting(false);
  }, []);

  return {
    showDeleteDialog,
    setShowDeleteDialog,
    isDeleting,
    handleDeleteSuitcase,
    resetDeletionState
  };
}
