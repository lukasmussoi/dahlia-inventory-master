import { InventoryModel } from "@/models/inventoryModel";
import { ResellerModel } from "@/models/resellerModel";
import { SuitcaseModel } from "@/models/suitcaseModel";
import { format } from "date-fns";

export class SuitcaseController {
  static async getSuitcases(searchParams: any) {
    try {
      const { page, per_page, seller_id, status } = searchParams;
      const currentPage = page ? parseInt(page as string, 10) : 1;
      const itemsPerPage = per_page ? parseInt(per_page as string, 10) : 10;

      const suitcases = await SuitcaseModel.getAllSuitcases();
      
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const filteredSuitcases = suitcases.filter(suitcase => {
        if (seller_id && suitcase.seller_id !== seller_id) return false;
        if (status && status !== 'todos' && suitcase.status !== status) return false;
        return true;
      });
      
      const paginatedSuitcases = filteredSuitcases.slice(startIndex, endIndex);
      const totalSuitcases = filteredSuitcases.length;
      const totalPages = Math.ceil(totalSuitcases / itemsPerPage);

      return {
        data: paginatedSuitcases,
        meta: {
          current_page: currentPage,
          per_page: itemsPerPage,
          total_pages: totalPages,
          total_items: totalSuitcases,
        },
      };
    } catch (error: any) {
      console.error("Erro ao buscar maletas:", error);
      throw new Error(error.message || "Erro ao buscar maletas");
    }
  }

  static async getSuitcaseById(id: string) {
    try {
      const suitcase = await SuitcaseModel.getSuitcaseById(id);
      if (!suitcase) {
        throw new Error("Maleta não encontrada");
      }
      return suitcase;
    } catch (error: any) {
      console.error("Erro ao buscar maleta por ID:", error);
      throw new Error(error.message || "Erro ao buscar maleta por ID");
    }
  }

  static async createSuitcase(formData: FormData) {
    try {
      const sellerId = formData.get("seller_id") as string;
      const code = formData.get("code") as string;
      const status = formData.get("status") as string;
      const city = formData.get("city") as string;
      const neighborhood = formData.get("neighborhood") as string;
      const nextSettlementDate = formData.get("next_settlement_date") as string | null;

      if (!sellerId || !code || !status || !city || !neighborhood) {
        throw new Error("Todos os campos são obrigatórios");
      }

      const suitcaseData: any = {
        seller_id: sellerId,
        code: code,
        status: status,
        city: city,
        neighborhood: neighborhood,
      };

      if (nextSettlementDate) {
        const parsedDate = new Date(nextSettlementDate);
        if (!isNaN(parsedDate.getTime())) {
          suitcaseData.next_settlement_date = parsedDate.toISOString().split("T")[0];
        }
      }

      const newSuitcase = await SuitcaseModel.createSuitcase(suitcaseData);
      return newSuitcase;
    } catch (error: any) {
      console.error("Erro ao criar maleta:", error);
      throw new Error(error.message || "Erro ao criar maleta");
    }
  }

  static async updateSuitcase(id: string, data: any) {
    try {
      const updatedSuitcase = await SuitcaseModel.updateSuitcase(id, data);
      return updatedSuitcase;
    } catch (error: any) {
      console.error("Erro ao atualizar maleta:", error);
      throw new Error(error.message || "Erro ao atualizar maleta");
    }
  }

  static async deleteSuitcase(id: string) {
    try {
      await SuitcaseModel.deleteSuitcase(id);
    } catch (error: any) {
      console.error("Erro ao excluir maleta:", error);
      throw new Error(error.message || "Erro ao excluir maleta");
    }
  }

  static formatStatus(status: string) {
    switch (status) {
      case "in_use":
        return "Em Uso";
      case "returned":
        return "Devolvida";
      case "in_replenishment":
        return "Em Reposição";
      default:
        return "Desconhecido";
    }
  }

  static async getResellersForSelect() {
    try {
      const resellers = await ResellerModel.getAllResellers();
      return resellers.map((reseller) => ({
        value: reseller.id,
        label: reseller.name,
      })) || [];
    } catch (error: any) {
      console.error("Erro ao buscar revendedoras para o select:", error);
      throw new Error(
        error.message || "Erro ao buscar revendedoras para o select"
      );
    }
  }

  static async getResellerById(id: string) {
    try {
      const reseller = await ResellerModel.getReseller(id);
      return reseller;
    } catch (error: any) {
      console.error("Erro ao buscar revendedora por ID:", error);
      throw new Error(error.message || "Erro ao buscar revendedora por ID");
    }
  }

  static async getSuitcaseItems(suitcaseId: string) {
    try {
      const items = await SuitcaseModel.getSuitcaseItems(suitcaseId);
      return items;
    } catch (error: any) {
      console.error("Erro ao buscar itens da maleta:", error);
      throw new Error(error.message || "Erro ao buscar itens da maleta");
    }
  }

  static async handleSuitcaseForm(formData: FormData) {
    try {
      const suitcaseId = formData.get("suitcaseId") as string;
      const sellerId = formData.get("seller_id") as string;
      const code = formData.get("code") as string;
      const status = formData.get("status") as string;
      const city = formData.get("city") as string;
      const neighborhood = formData.get("neighborhood") as string;

      if (!sellerId || !code || !status || !city || !neighborhood) {
        throw new Error("Todos os campos são obrigatórios");
      }

      const suitcaseData: any = {
        seller_id: sellerId,
        code: code,
        status: status,
        city: city,
        neighborhood: neighborhood,
      };

      const dateValue = formData.get('next_settlement_date');
      if (dateValue) {
        const parsedDate = new Date(dateValue.toString());
        if (!isNaN(parsedDate.getTime())) {
          suitcaseData.next_settlement_date = parsedDate.toISOString().split('T')[0];
        }
      }

      if (suitcaseId) {
        await SuitcaseModel.updateSuitcase(suitcaseId, suitcaseData);
        return { message: "Maleta atualizada com sucesso" };
      } else {
        await SuitcaseModel.createSuitcase(suitcaseData);
        return { message: "Maleta criada com sucesso" };
      }
    } catch (error: any) {
      console.error("Erro ao manipular formulário da maleta:", error);
      throw new Error(
        error.message || "Erro ao manipular formulário da maleta"
      );
    }
  }

  static async searchSuitcases(filters: any) {
    try {
      return await SuitcaseModel.searchSuitcases(filters);
    } catch (error: any) {
      console.error("Erro ao buscar maletas:", error);
      throw new Error(error.message || "Erro ao buscar maletas");
    }
  }

  static async getAllSuitcases() {
    try {
      return await SuitcaseModel.getAllSuitcases();
    } catch (error: any) {
      console.error("Erro ao buscar maletas:", error);
      throw new Error(error.message || "Erro ao buscar maletas");
    }
  }

  static async getSuitcaseSummary() {
    try {
      return await SuitcaseModel.getSuitcaseSummary();
    } catch (error: any) {
      console.error("Erro ao buscar resumo das maletas:", error);
      throw new Error(error.message || "Erro ao buscar resumo das maletas");
    }
  }

  static async addItemToSuitcase(data: { suitcase_id: string, inventory_id: string }) {
    try {
      return await SuitcaseModel.addItemToSuitcase(data);
    } catch (error: any) {
      console.error("Erro ao adicionar item à maleta:", error);
      throw new Error(error.message || "Erro ao adicionar item à maleta");
    }
  }

  static async markItemAsSold(inventoryId: string) {
    try {
      await InventoryModel.updateInventoryItemStatus(inventoryId, 'sold');
      return { message: "Item marcado como vendido com sucesso" };
    } catch (error: any) {
      console.error("Erro ao marcar item como vendido:", error);
      throw new Error(error.message || "Erro ao marcar item como vendido");
    }
  }

  static async updateSuitcaseItemStatus(
    itemId: string, 
    status: string, 
    saleInfo?: any
  ) {
    try {
      return await SuitcaseModel.updateSuitcaseItemStatus(itemId, status as any, saleInfo);
    } catch (error: any) {
      console.error("Erro ao atualizar status do item:", error);
      throw new Error(error.message || "Erro ao atualizar status do item");
    }
  }
}
