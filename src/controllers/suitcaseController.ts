import { SuitcaseModel } from "@/models/suitcaseModel";
import { SuitcaseItemStatus, InventoryItemSuitcaseInfo } from "@/types/suitcase";
import { acertoMaletaController } from "@/controllers/acertoMaletaController";
import { promoterController } from "@/controllers/promoterController";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const suitcaseController = {
  async getAllSuitcases(filters?: any) {
    try {
      const suitcases = await SuitcaseModel.getAllSuitcases(filters);
      return suitcases;
    } catch (error) {
      console.error("Erro ao buscar maletas:", error);
      throw new Error("Erro ao buscar maletas");
    }
  },

  async getSuitcaseById(id: string) {
    try {
      const suitcase = await SuitcaseModel.getSuitcaseById(id);
      return suitcase;
    } catch (error) {
      console.error("Erro ao buscar maleta:", error);
      throw new Error("Erro ao buscar maleta");
    }
  },

  async createSuitcase(data: any) {
    try {
      if (!data.code) {
        data.code = await SuitcaseModel.generateSuitcaseCode();
      }

      const newSuitcase = await SuitcaseModel.createSuitcase(data);
      return newSuitcase;
    } catch (error) {
      console.error("Erro ao criar maleta:", error);
      throw new Error("Erro ao criar maleta");
    }
  },

  async updateSuitcase(id: string, data: any) {
    try {
      if (data.status === 'returned') {
        console.log("Processando devolução de maleta:", id);
        
        const items = await SuitcaseModel.getSuitcaseItems(id);
        const itemsInPossession = items.filter(item => item.status === 'in_possession');
        
        console.log(`Devolvendo ${itemsInPossession.length} itens ao estoque...`);
        
        for (const item of itemsInPossession) {
          try {
            await SuitcaseModel.returnItemToInventory(item.id);
            console.log(`Item ${item.id} devolvido ao estoque com sucesso.`);
          } catch (error) {
            console.error(`Erro ao retornar item ${item.id} ao estoque:`, error);
          }
        }
      }
      
      const updatedSuitcase = await SuitcaseModel.updateSuitcase(id, data);
      return updatedSuitcase;
    } catch (error) {
      console.error("Erro ao atualizar maleta:", error);
      throw new Error("Erro ao atualizar maleta");
    }
  },

  async deleteSuitcase(id: string) {
    try {
      const { data: acertos, error: acertosError } = await supabase
        .from('acertos_maleta')
        .select('id')
        .eq('suitcase_id', id);
      
      if (acertosError) throw acertosError;
      
      if (acertos && acertos.length > 0) {
        throw new Error("Não é possível excluir esta maleta pois ela possui acertos registrados. Você pode mudar o status da maleta para 'Devolvida' em vez de excluí-la.");
      }
      
      const { data: suitcaseItems, error: itemsError } = await supabase
        .from('suitcase_items')
        .select('id')
        .eq('suitcase_id', id);
      
      if (itemsError) throw itemsError;
      
      if (suitcaseItems && suitcaseItems.length > 0) {
        const itemIds = suitcaseItems.map(item => item.id);
        
        const { data: sales, error: salesError } = await supabase
          .from('suitcase_item_sales')
          .select('id')
          .in('suitcase_item_id', itemIds);
        
        if (salesError) throw salesError;
        
        if (sales && sales.length > 0) {
          throw new Error("Não é possível excluir esta maleta pois ela possui itens com vendas registradas. Você pode mudar o status da maleta para 'Devolvida' em vez de excluí-la.");
        }
        
        const { error: deleteItemsError } = await supabase
          .from('suitcase_items')
          .delete()
          .eq('suitcase_id', id);
        
        if (deleteItemsError) throw deleteItemsError;
      }
      
      await SuitcaseModel.deleteSuitcase(id);
      return true;
    } catch (error: any) {
      console.error("Erro ao excluir maleta:", error);
      
      if (error.code === '23503') {
        if (error.details.includes('acertos_maleta')) {
          throw new Error("Não é possível excluir esta maleta pois ela possui acertos registrados. Você pode mudar o status da maleta para 'Devolvida' em vez de excluí-la.");
        } else if (error.details.includes('suitcase_item_sales')) {
          throw new Error("Não é possível excluir esta maleta pois ela possui itens com vendas registradas. Você pode mudar o status da maleta para 'Devolvida' em vez de excluí-la.");
        } else {
          throw new Error("Não é possível excluir esta maleta pois ela possui registros relacionados. Você pode mudar o status da maleta para 'Devolvida' em vez de excluí-la.");
        }
      }
      
      throw error;
    }
  },

  async getSuitcaseItems(suitcaseId: string) {
    try {
      const items = await SuitcaseModel.getSuitcaseItems(suitcaseId);
      return items;
    } catch (error) {
      console.error("Erro ao buscar itens da maleta:", error);
      throw new Error("Erro ao buscar itens da maleta");
    }
  },

  async addItemToSuitcase(suitcaseId: string, inventoryId: string, quantity: number = 1) {
    try {
      const suitcase = await SuitcaseModel.getSuitcaseById(suitcaseId);
      if (!suitcase) {
        throw new Error("Maleta não encontrada");
      }

      const availability = await SuitcaseModel.checkItemAvailability(inventoryId);
      
      if (!availability.available) {
        if (availability.in_suitcase) {
          throw new Error(`Item "${availability.item_info?.name}" já está na maleta ${availability.in_suitcase.suitcase_code} (${availability.in_suitcase.seller_name})`);
        } else {
          throw new Error(`Item "${availability.item_info?.name}" não está disponível no estoque`);
        }
      }
      
      if (availability.quantity < quantity) {
        throw new Error(`Quantidade solicitada (${quantity}) excede o estoque disponível (${availability.quantity})`);
      }
      
      if (suitcase.seller_id) {
        try {
          const salesFrequency = await acertoMaletaController.getItemSalesFrequency(inventoryId, suitcase.seller_id);
          
          if (salesFrequency.count > 0) {
            let message = "";
            if (salesFrequency.frequency === "alta") {
              message = `Ótima escolha! Este item foi vendido ${salesFrequency.count} vezes nos últimos 90 dias por esta revendedora.`;
              toast.success(message, { duration: 5000 });
            } else if (salesFrequency.frequency === "média") {
              message = `Este item foi vendido ${salesFrequency.count} vezes nos últimos 90 dias por esta revendedora.`;
              toast.info(message, { duration: 4000 });
            } else {
              message = `Este item foi vendido apenas ${salesFrequency.count} vez nos últimos 90 dias por esta revendedora.`;
              toast(message, { duration: 3000 });
            }
          }
        } catch (error) {
          console.error("Erro ao buscar histórico de vendas:", error);
        }
      }
      
      const newItem = await SuitcaseModel.addItemToSuitcase({
        suitcase_id: suitcaseId,
        inventory_id: inventoryId,
        quantity: quantity,
        status: "in_possession"
      });
      return newItem;
    } catch (error) {
      console.error("Erro ao adicionar item à maleta:", error);
      throw error;
    }
  },

  async removeItemFromSuitcase(itemId: string) {
    try {
      await SuitcaseModel.removeSuitcaseItem(itemId);
      return true;
    } catch (error) {
      console.error("Erro ao remover item da maleta:", error);
      throw new Error("Erro ao remover item da maleta");
    }
  },

  async updateSuitcaseItemStatus(itemId: string, status: SuitcaseItemStatus) {
    try {
      const validStatus = ["in_possession", "sold", "returned", "lost"] as const;
      
      if (!validStatus.includes(status as any)) {
        throw new Error(`Status inválido: ${status}`);
      }
      
      const updatedItem = await SuitcaseModel.updateSuitcaseItemStatus(
        itemId, 
        status as "in_possession" | "sold" | "returned" | "lost"
      );
      return updatedItem;
    } catch (error) {
      console.error("Erro ao atualizar status do item:", error);
      throw new Error("Erro ao atualizar status do item");
    }
  },

  async updateSuitcaseItemQuantity(itemId: string, quantity: number) {
    try {
      if (quantity < 1) {
        throw new Error("A quantidade deve ser maior que zero");
      }
      
      const updatedItem = await SuitcaseModel.updateSuitcaseItemQuantity(itemId, quantity);
      return updatedItem;
    } catch (error: any) {
      console.error("Erro ao atualizar quantidade do item:", error);
      throw new Error(error.message || "Erro ao atualizar quantidade do item");
    }
  },

  async updateSaleInfo(itemId: string, field: string, value: string) {
    try {
      // Verificar se já existe uma venda para este item
      const { data: existingSales, error: salesError } = await supabase
        .from('suitcase_item_sales')
        .select('*')
        .eq('suitcase_item_id', itemId);
      
      if (salesError) throw salesError;
      
      // Se já existe uma venda, atualizar
      if (existingSales && existingSales.length > 0) {
        const { error: updateError } = await supabase
          .from('suitcase_item_sales')
          .update({ [field]: value })
          .eq('id', existingSales[0].id);
        
        if (updateError) throw updateError;
        
        return existingSales[0].id;
      } 
      // Se não existe venda, criar uma nova
      else {
        const { data: newSale, error: createError } = await supabase
          .from('suitcase_item_sales')
          .insert({ 
            suitcase_item_id: itemId, 
            [field]: value 
          })
          .select()
          .single();
        
        if (createError) throw createError;
        
        return newSale.id;
      }
    } catch (error) {
      console.error("Erro ao atualizar informações de venda:", error);
      throw new Error("Erro ao atualizar informações de venda");
    }
  },

  async getSuitcaseSummary() {
    try {
      const summary = await SuitcaseModel.getSuitcaseSummary();
      return summary;
    } catch (error) {
      console.error("Erro ao buscar resumo das maletas:", error);
      throw new Error("Erro ao buscar resumo das maletas");
    }
  },
  
  async searchSuitcases(filters: any) {
    try {
      const suitcases = await SuitcaseModel.searchSuitcases(filters);
      return suitcases;
    } catch (error) {
      console.error("Erro ao buscar maletas:", error);
      throw new Error("Erro ao buscar maletas");
    }
  },
  
  async getResellersForSelect() {
    try {
      const resellers = await SuitcaseModel.getAllSellers();
      return resellers.map((reseller: any) => ({
        value: reseller.id,
        label: reseller.name
      }));
    } catch (error) {
      console.error("Erro ao buscar revendedoras:", error);
      throw new Error("Erro ao buscar revendedoras");
    }
  },
  
  formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'in_use': 'Em Uso',
      'returned': 'Devolvida',
      'in_replenishment': 'Em Reposição',
      'in_possession': 'Em Posse',
      'sold': 'Vendido',
      'reserved': 'Reservado',
      'available': 'Disponível',
      'lost': 'Perdido'
    };
    
    return statusMap[status] || status;
  },
  
  async searchInventoryItems(query: string) {
    try {
      const items = await SuitcaseModel.searchInventoryItems(query);
      return items;
    } catch (error) {
      console.error("Erro ao buscar itens:", error);
      throw new Error("Erro ao buscar itens");
    }
  },

  async getItemSuitcaseInfo(inventoryId: string): Promise<InventoryItemSuitcaseInfo | null> {
    try {
      const suitcaseInfo = await SuitcaseModel.getItemSuitcaseInfo(inventoryId);
      return suitcaseInfo;
    } catch (error) {
      console.error("Erro ao buscar informações da maleta que contém o item:", error);
      throw error;
    }
  },

  async getPromoterForReseller(resellerId: string) {
    try {
      if (!resellerId) {
        throw new Error("ID da revendedora é necessário");
      }
      
      const promoter = await promoterController.getPromoterByResellerId(resellerId);
      return promoter;
    } catch (error) {
      console.error("Erro ao buscar promotora responsável:", error);
      return null;
    }
  }
};

// Criar um alias para compatibilidade com código existente
export const SuitcaseController = suitcaseController;
