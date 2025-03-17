import { SuitcaseModel, Suitcase, SuitcaseItem, SuitcaseItemSale } from "@/models/suitcaseModel";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ResellerModel } from "@/models/resellerModel";
import { InventoryModel } from "@/models/inventoryModel";

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

  // Buscar peças de uma maleta
  static async getSuitcaseItems(suitcaseId: string) {
    try {
      return await SuitcaseModel.getSuitcaseItems(suitcaseId);
    } catch (error) {
      console.error(`Erro ao buscar peças da maleta ${suitcaseId}:`, error);
      toast.error("Erro ao carregar peças da maleta");
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
      let formattedDate: string | null = null;
      
      // Verificar se a propriedade next_settlement_date existe no objeto updates
      if ('next_settlement_date' in updates) {
        const dateValue = updates.next_settlement_date;
        
        if (dateValue !== null && dateValue !== undefined) {
          if (typeof dateValue === 'object' && 'toISOString' in dateValue) {
            // Garantir que é um objeto Date válido
            formattedDate = dateValue.toISOString().split('T')[0];
          } else if (typeof dateValue === 'string') {
            // Se for uma string
            formattedDate = dateValue;
          }
        }
      }
      
      const formattedUpdates = {
        ...updates,
        next_settlement_date: formattedDate
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

  // Adicionar peça à maleta
  static async addItemToSuitcase(itemData: {
    suitcase_id: string;
    inventory_id: string;
    quantity?: number;
    status?: 'in_possession' | 'sold' | 'returned' | 'lost';
  }) {
    try {
      // Verificar se a peça existe no estoque
      const inventoryItem = await InventoryModel.getInventoryItemById(itemData.inventory_id);
      if (!inventoryItem) {
        toast.error("Peça não encontrada no estoque");
        throw new Error("Peça não encontrada no estoque");
      }

      // Verificar se há quantidade suficiente disponível
      if ((inventoryItem.quantity || 0) < (itemData.quantity || 1)) {
        toast.error("Quantidade insuficiente no estoque");
        throw new Error("Quantidade insuficiente no estoque");
      }

      // Adicionar à maleta
      const result = await SuitcaseModel.addItemToSuitcase(itemData);
      
      // Registrar movimento no estoque
      await InventoryModel.updateItem(itemData.inventory_id, {
        quantity: (inventoryItem.quantity || 0) - (itemData.quantity || 1)
      });

      toast.success("Peça adicionada à maleta com sucesso");
      return result;
    } catch (error) {
      console.error("Erro ao adicionar peça à maleta:", error);
      toast.error("Erro ao adicionar peça à maleta");
      throw error;
    }
  }

  // Atualizar status de uma peça da maleta
  static async updateSuitcaseItemStatus(
    itemId: string,
    status: 'in_possession' | 'sold' | 'returned' | 'lost',
    saleInfo?: Partial<SuitcaseItemSale>
  ) {
    try {
      // Obter informações da peça antes de atualizar
      const suitcaseItem = await SuitcaseModel.getSuitcaseItemById(itemId);
      if (!suitcaseItem) {
        toast.error("Peça não encontrada");
        throw new Error("Peça não encontrada");
      }

      const result = await SuitcaseModel.updateSuitcaseItemStatus(
        itemId,
        status,
        saleInfo
      );
      
      // Se a peça for devolvida ao estoque, atualizar inventário
      if (status === 'returned' && suitcaseItem.inventory_id) {
        const inventoryItem = await InventoryModel.getInventoryItemById(suitcaseItem.inventory_id);
        if (inventoryItem) {
          await InventoryModel.updateItem(suitcaseItem.inventory_id, {
            quantity: (inventoryItem.quantity || 0) + (suitcaseItem.quantity || 1)
          });
        }
      }
      
      const statusMessages = {
        sold: "Peça marcada como vendida",
        returned: "Peça devolvida ao estoque",
        lost: "Peça marcada como perdida",
        in_possession: "Peça marcada como em posse"
      };
      
      toast.success(statusMessages[status] || "Status da peça atualizado");
      return result;
    } catch (error) {
      console.error(`Erro ao atualizar status da peça ${itemId}:`, error);
      toast.error("Erro ao atualizar status da peça");
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

  // Buscar uma revendedora por ID
  static async getResellerById(resellerId: string) {
    try {
      return await ResellerModel.getById(resellerId);
    } catch (error) {
      console.error(`Erro ao buscar revendedora ${resellerId}:`, error);
      toast.error("Erro ao buscar dados da revendedora");
      return null;
    }
  }

  // Formatar status da maleta para exibição
  static formatStatus(status: string) {
    const statusMap: Record<string, string> = {
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
    const colorMap: Record<string, string> = {
      'in_use': 'green',
      'returned': 'blue',
      'in_audit': 'yellow',
      'lost': 'red',
      'in_replenishment': 'orange'
    };
    
    return colorMap[status] || 'gray';
  }

  // Corrigir o método com o erro de TypeScript
  static async updateNextSettlementDate(suitcaseId: string, nextDate: string | null): Promise<any> {
    try {
      // Verificar se a data é válida
      let dateValue: string | null = null;
      
      // Corrigir a verificação para evitar o erro TS2358
      if (nextDate && typeof nextDate === 'string' && nextDate.trim() !== '') {
        dateValue = nextDate;
      }
      
      // Aqui estava o erro TS18047 - precisamos verificar se dateValue é null
      const result = await SuitcaseModel.updateSuitcase(suitcaseId, { 
        next_settlement_date: dateValue 
      });
      
      return result;
    } catch (error) {
      console.error("Erro ao atualizar data do próximo acerto:", error);
      throw error;
    }
  }
}
