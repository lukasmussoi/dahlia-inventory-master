
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
        activeUsersCount: activeUsers?.length || 0,
        totalInventory,
        activeSuitcasesCount: activeSuitcases || 0,
        totalSales: 0, // Valor temporário
        salesGrowth: 5, // Valor temporário
        suitcasesGrowth: 2, // Valor temporário
        newResellers: 3 // Valor temporário
      };
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      // Retornar valores padrão em caso de erro para evitar falhas de renderização
      return {
        activeUsersCount: 0,
        totalInventory: { totalItems: 0, totalValue: 0 },
        activeSuitcasesCount: 0,
        totalSales: 0,
        salesGrowth: 0,
        suitcasesGrowth: 0,
        newResellers: 0
      };
    }
  }
}
