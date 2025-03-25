
/**
 * Controlador de Exclusão de Maletas
 * @file Este arquivo controla as operações relacionadas à exclusão de maletas
 */
import { SuitcaseModel } from "@/models/suitcaseModel";

export const DeleteSuitcaseController = {
  async deleteSuitcaseWithCascade(suitcaseId: string) {
    try {
      // Buscar itens da maleta
      const items = await SuitcaseModel.getSuitcaseItems(suitcaseId);
      
      // Retornar cada item ao estoque
      for (const item of items) {
        await SuitcaseModel.returnItemToInventory(item.id);
      }
      
      // Excluir a maleta
      await SuitcaseModel.deleteSuitcase(suitcaseId);
      
      return { success: true };
    } catch (error) {
      console.error("Erro ao excluir maleta com cascade:", error);
      throw error;
    }
  }
};
