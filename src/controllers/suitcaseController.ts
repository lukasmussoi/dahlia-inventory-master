
import { SuitcaseModel, Suitcase, SuitcaseItem, SuitcaseItemSale } from "@/models/suitcaseModel";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export class SuitcaseController {
  // Buscar todas as maletas
  static async getAllSuitcases() {
    try {
      return await SuitcaseModel.getAllSuitcases();
    } catch (error) {
      console.error("Erro ao buscar maletas:", error);
      toast.error("Erro ao buscar maletas");
      return [];
    }
  }

  // Buscar resumo das maletas
  static async getSuitcaseSummary() {
    try {
      return await SuitcaseModel.getSuitcaseSummary();
    } catch (error) {
      console.error("Erro ao buscar resumo das maletas:", error);
      toast.error("Erro ao buscar resumo das maletas");
      return {
        total: 0,
        in_use: 0,
        returned: 0,
        in_replenishment: 0
      };
    }
  }

  // Buscar uma maleta por ID
  static async getSuitcaseById(id: string) {
    try {
      return await SuitcaseModel.getSuitcaseById(id);
    } catch (error) {
      console.error(`Erro ao buscar maleta ${id}:`, error);
      toast.error("Erro ao buscar detalhes da maleta");
      return null;
    }
  }

  // Buscar itens de uma maleta
  static async getSuitcaseItems(suitcaseId: string) {
    try {
      return await SuitcaseModel.getSuitcaseItems(suitcaseId);
    } catch (error) {
      console.error(`Erro ao buscar itens da maleta ${suitcaseId}:`, error);
      toast.error("Erro ao carregar itens da maleta");
      return [];
    }
  }

  // Criar nova maleta
  static async createSuitcase(suitcaseData: {
    seller_id: string;
    status?: 'in_use' | 'returned' | 'lost' | 'in_audit' | 'in_replenishment';
    city?: string;
    neighborhood?: string;
    code?: string;
    next_settlement_date?: Date;
  }) {
    try {
      // Verificar se cidade e bairro estão preenchidos
      if (!suitcaseData.city || !suitcaseData.neighborhood) {
        toast.error("Cidade e Bairro são obrigatórios");
        throw new Error("Cidade e Bairro são obrigatórios");
      }

      // Gerar código único se não fornecido
      if (!suitcaseData.code) {
        suitcaseData.code = await SuitcaseModel.generateSuitcaseCode();
      }

      // Formatar a data para o formato esperado pelo banco de dados (ISO)
      const formattedData = {
        ...suitcaseData,
        next_settlement_date: suitcaseData.next_settlement_date 
          ? suitcaseData.next_settlement_date.toISOString().split('T')[0] 
          : undefined
      };

      const result = await SuitcaseModel.createSuitcase(formattedData);
      toast.success("Maleta criada com sucesso");
      return result;
    } catch (error: any) {
      console.error("Erro ao criar maleta:", error);
      toast.error(error.message || "Erro ao criar maleta");
      throw error;
    }
  }

  // Atualizar maleta
  static async updateSuitcase(id: string, updates: Partial<Suitcase> & { next_settlement_date?: Date | string | null }) {
    try {
      // Verificar se cidade e bairro estão preenchidos
      if (updates.city === "" || updates.neighborhood === "") {
        toast.error("Cidade e Bairro são obrigatórios");
        throw new Error("Cidade e Bairro são obrigatórios");
      }

      // Formatar a data para o formato esperado pelo banco de dados (ISO)
      const formattedUpdates = {
        ...updates,
        next_settlement_date: updates.next_settlement_date 
          ? (typeof updates.next_settlement_date === 'object' && updates.next_settlement_date !== null && 'toISOString' in updates.next_settlement_date)
            ? updates.next_settlement_date.toISOString().split('T')[0]
            : String(updates.next_settlement_date)
          : undefined
      };

      const result = await SuitcaseModel.updateSuitcase(id, formattedUpdates);
      toast.success("Maleta atualizada com sucesso");
      return result;
    } catch (error: any) {
      console.error(`Erro ao atualizar maleta ${id}:`, error);
      toast.error(error.message || "Erro ao atualizar maleta");
      throw error;
    }
  }

  // Excluir maleta
  static async deleteSuitcase(id: string) {
    try {
      await SuitcaseModel.deleteSuitcase(id);
      toast.success("Maleta excluída com sucesso");
    } catch (error) {
      console.error(`Erro ao excluir maleta ${id}:`, error);
      toast.error("Erro ao excluir maleta");
      throw error;
    }
  }

  // Adicionar item à maleta
  static async addItemToSuitcase(itemData: {
    suitcase_id: string;
    inventory_id: string;
    quantity?: number;
    status?: 'in_possession' | 'sold' | 'returned' | 'lost';
  }) {
    try {
      const result = await SuitcaseModel.addItemToSuitcase(itemData);
      toast.success("Item adicionado à maleta com sucesso");
      return result;
    } catch (error) {
      console.error("Erro ao adicionar item à maleta:", error);
      toast.error("Erro ao adicionar item à maleta");
      throw error;
    }
  }

  // Atualizar status de um item da maleta
  static async updateSuitcaseItemStatus(
    itemId: string,
    status: 'in_possession' | 'sold' | 'returned' | 'lost',
    saleInfo?: Partial<SuitcaseItemSale>
  ) {
    try {
      const result = await SuitcaseModel.updateSuitcaseItemStatus(
        itemId,
        status,
        saleInfo
      );
      
      const statusMessages = {
        sold: "Item marcado como vendido",
        returned: "Item marcado como devolvido",
        lost: "Item marcado como perdido",
        in_possession: "Item marcado como em posse"
      };
      
      toast.success(statusMessages[status] || "Status do item atualizado");
      return result;
    } catch (error) {
      console.error(`Erro ao atualizar status do item ${itemId}:`, error);
      toast.error("Erro ao atualizar status do item");
      throw error;
    }
  }

  // Buscar maletas filtradas
  static async searchSuitcases(filters: {
    status?: string;
    search?: string;
    city?: string;
    neighborhood?: string;
  }) {
    try {
      return await SuitcaseModel.searchSuitcases(filters);
    } catch (error) {
      console.error("Erro ao buscar maletas filtradas:", error);
      toast.error("Erro ao buscar maletas");
      return [];
    }
  }

  // Buscar revendedoras para seleção
  static async getResellersForSelect() {
    try {
      // Usar o método correto para buscar revendedoras
      const { data: resellers, error } = await supabase
        .from('resellers')
        .select('id, name');
      
      if (error) throw error;
      
      return resellers.map(reseller => ({
        value: reseller.id,
        label: reseller.name
      }));
    } catch (error) {
      console.error("Erro ao buscar revendedoras:", error);
      toast.error("Erro ao buscar revendedoras");
      return [];
    }
  }

  // Formatar status da maleta para exibição
  static formatStatus(status: string) {
    const statusMap = {
      'in_use': 'Em Uso',
      'returned': 'Devolvida',
      'in_audit': 'Em Auditoria',
      'lost': 'Perdida',
      'in_replenishment': 'Aguardando Reposição'
    };
    
    return statusMap[status] || status;
  }

  // Obter cor do status da maleta
  static getStatusColor(status: string) {
    const colorMap = {
      'in_use': 'green',
      'returned': 'blue',
      'in_audit': 'yellow',
      'lost': 'red',
      'in_replenishment': 'orange'
    };
    
    return colorMap[status] || 'gray';
  }
}
