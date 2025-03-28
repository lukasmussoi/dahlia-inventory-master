
/**
 * Controlador de Abastecimento de Maletas
 * @file Este arquivo coordena as operações de abastecimento de maletas
 * @relacionamento Utiliza SupplyItemController, SupplyPdfController e SuitcaseItemModel 
 */
import { SuitcaseItemModel } from "@/models/suitcase/item";
import { supabase } from "@/integrations/supabase/client";
import { SupplyItemController } from "../inventory/supplyItemController";
import { SupplyPdfController } from "../pdf/supplyPdfController";

interface SupplyItem {
  inventory_id: string;
  quantity: number;
  product?: {
    id: string;
    name: string;
    sku: string;
    price: number;
    photo_url?: string | { photo_url: string }[];
  };
}

export class SuitcaseSupplyController {
  /**
   * Busca itens do inventário para abastecimento
   * @param searchTerm Termo para busca
   * @returns Lista de itens do inventário que correspondem à busca
   */
  static async searchInventoryItems(searchTerm: string) {
    return SupplyItemController.searchInventoryItems(searchTerm);
  }

  /**
   * Abastece uma maleta com itens selecionados
   * @param suitcaseId ID da maleta
   * @param items Itens para abastecer a maleta
   * @returns Se a operação foi bem-sucedida
   */
  static async supplySuitcase(suitcaseId: string, items: SupplyItem[]) {
    try {
      if (!suitcaseId) throw new Error("ID da maleta é necessário");
      if (!items || items.length === 0) throw new Error("Nenhum item selecionado para abastecimento");

      const addedItems = [];

      // Adicionar cada item à maleta
      for (const item of items) {
        if (!item.inventory_id) continue;
        
        // Verificar se o item está disponível
        const availability = await SupplyItemController.checkItemAvailability(item.inventory_id);
        
        if (!availability.available) {
          console.warn(`Item ${item.inventory_id} não disponível para abastecimento: ${JSON.stringify(availability)}`);
          continue;
        }
        
        // Verificar se a quantidade solicitada está disponível
        const quantity = item.quantity || 1;
        if (availability.quantity < quantity) {
          console.warn(`Quantidade solicitada (${quantity}) excede disponível (${availability.quantity}) para item ${item.inventory_id}`);
          continue;
        }
        
        // Para cada unidade, adicionar como um item separado
        for (let i = 0; i < quantity; i++) {
          try {
            // Adicionar item à maleta (um por vez)
            const addedItem = await SuitcaseItemModel.addItemToSuitcase({
              suitcase_id: suitcaseId,
              inventory_id: item.inventory_id,
              quantity: 1, // Sempre adicionar com quantidade 1
              status: 'in_possession'
            });
            
            // Adicionar à lista de itens adicionados
            if (addedItem) {
              addedItems.push({
                ...addedItem,
                product: item.product
              });
            }
          } catch (error) {
            console.error(`Erro ao adicionar unidade ${i+1} do item ${item.inventory_id} à maleta:`, error);
            throw error; // Propagar erro para interromper a operação
          }
        }
      }

      return addedItems;
    } catch (error) {
      console.error("Erro ao abastecer maleta:", error);
      throw error;
    }
  }

  /**
   * Gera um PDF de comprovante de abastecimento
   * @param suitcaseId ID da maleta
   * @param items Itens adicionados à maleta
   * @param suitcaseInfo Informações da maleta para o PDF
   * @returns URL do PDF gerado
   */
  static async generateSupplyPDF(suitcaseId: string, items: SupplyItem[], suitcaseInfo: any): Promise<string> {
    return SupplyPdfController.generateSuitcasePDF(suitcaseId, items, suitcaseInfo);
  }

  /**
   * Conta o número de itens em uma maleta
   * @param suitcaseId ID da maleta
   * @returns Número de itens
   */
  static async countSuitcaseItems(suitcaseId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('suitcase_items')
        .select('*', { count: 'exact', head: true })
        .eq('suitcase_id', suitcaseId)
        .eq('status', 'in_possession');

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error("Erro ao contar itens da maleta:", error);
      return 0;
    }
  }

  /**
   * Busca dados de contagem de itens para várias maletas
   * @param suitcaseIds IDs das maletas
   * @returns Objeto com contagem de itens por ID de maleta
   */
  static async getSuitcasesItemCounts(suitcaseIds: string[]): Promise<Record<string, number>> {
    try {
      if (!suitcaseIds.length) return {};

      const { data, error } = await supabase
        .from('suitcase_items')
        .select('suitcase_id')
        .in('suitcase_id', suitcaseIds)
        .eq('status', 'in_possession');

      if (error) throw error;

      // Contar itens por maleta
      const counts: Record<string, number> = {};
      suitcaseIds.forEach(id => counts[id] = 0);
      
      data.forEach(item => {
        if (counts[item.suitcase_id] !== undefined) {
          counts[item.suitcase_id]++;
        }
      });

      return counts;
    } catch (error) {
      console.error("Erro ao buscar contagem de itens das maletas:", error);
      return {};
    }
  }
}
