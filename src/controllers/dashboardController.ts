
import { UserModel } from "@/models/userModel";
import { InventoryModel } from "@/models/inventoryModel";
import { SuitcaseModel } from "@/models/suitcaseModel";

export class DashboardController {
  // Buscar dados do dashboard
  static async getDashboardData() {
    try {
      // Buscar todos os dados necessários para o dashboard
      const [activeUsers, totalInventory, activeSuitcases] = await Promise.all([
        UserModel.getActiveUsers(),
        InventoryModel.getTotalInventory(),
        SuitcaseModel.getActiveSuitcases()
      ]);

      return {
        activeUsersCount: activeUsers.length,
        totalInventory,
        activeSuitcasesCount: activeSuitcases
      };
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      throw error;
    }
  }
}
