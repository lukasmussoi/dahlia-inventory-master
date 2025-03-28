/**
 * Controlador de Abastecimento de Maletas
 * @file Este arquivo coordena as operações de abastecimento de maletas
 * @relacionamento Utiliza SupplyItemController, SupplyPdfController e SuitcaseItemModel 
 */
import { supabase } from "@/integrations/supabase/client";
import { SupplyItemController } from "../inventory/supplyItemController";
import { SupplyPdfController } from "../pdf/supplyPdfController";
import { ItemOperationsModel } from "@/models/suitcase/item/itemOperationsModel";

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
    console.log(`[SuitcaseSupplyController] Iniciando busca de inventário: ${searchTerm}`);
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
      console.log(`[SuitcaseSupplyController] Iniciando abastecimento da maleta ${suitcaseId} com ${items.length} itens`);
      console.log(`[SuitcaseSupplyController] Detalhes dos itens:`, JSON.stringify(items, null, 2));
      
      if (!suitcaseId) throw new Error("ID da maleta é necessário");
      if (!items || items.length === 0) throw new Error("Nenhum item selecionado para abastecimento");

      // Primeiro obter o código da maleta para mensagens de erro mais claras
      let suitcaseCode = suitcaseId;
      try {
        const { data: suitcaseData } = await supabase
          .from('suitcases')
          .select('code')
          .eq('id', suitcaseId)
          .single();
          
        if (suitcaseData?.code) {
          suitcaseCode = suitcaseData.code;
        }
      } catch (e) {
        // Ignorar erro e continuar usando o ID
      }

      const addedItems = [];

      // Adicionar cada item à maleta
      for (const item of items) {
        if (!item.inventory_id) {
          console.warn(`[SuitcaseSupplyController] Item sem ID de inventário, ignorando`);
          continue;
        }
        
        const productName = item.product?.name || 'sem nome';
        const productSku = item.product?.sku || 'sem SKU';
        console.log(`[SuitcaseSupplyController] Processando item ${item.inventory_id} (${productName} - ${productSku}) com quantidade ${item.quantity}`);
        
        // Verificar se o item está disponível usando o Controller específico
        const quantity = item.quantity || 1;
        const availability = await SupplyItemController.checkItemAvailability(item.inventory_id, quantity);
        
        console.log(`[SuitcaseSupplyController] Verificação de disponibilidade para ${productName} (${productSku}):`, availability);
        
        if (!availability.available) {
          console.warn(`[SuitcaseSupplyController] Item ${productSku} não disponível: ${availability.message}`);
          throw new Error(`Item ${productName} (${productSku}) não disponível para abastecimento: ${availability.message}`);
        }
        
        try {
          console.log(`[SuitcaseSupplyController] Chamando reserveItemToSuitcase para o item ${productSku} com quantidade ${quantity}`);
          console.log(`[SuitcaseSupplyController] Parâmetros:`, {
            suitcase_id: suitcaseId,
            inventory_id: item.inventory_id,
            quantity
          });
          console.log(`[LOG] Adicionando ${quantity} unidades do item ${productSku} à maleta ${suitcaseCode}`);
          
          // Reservar item para a maleta com a quantidade especificada
          const addedItem = await ItemOperationsModel.reserveItemToSuitcase({
            suitcase_id: suitcaseId,
            inventory_id: item.inventory_id,
            quantity
          });
          
          if (!addedItem) {
            console.error(`[SuitcaseSupplyController] A função reserveItemToSuitcase não retornou dados para o item ${productSku}`);
            throw new Error(`Erro ao adicionar ${productName} à maleta ${suitcaseCode}. Nenhum dado retornado da operação.`);
          }
          
          // Adicionar à lista de itens adicionados
          addedItems.push({
            ...addedItem,
            product: item.product || addedItem.product
          });
          
          console.log(`[SuitcaseSupplyController] Item ${productSku} adicionado à maleta com quantidade ${quantity}`);
          console.log(`[LOG] Item ${productName} (${productSku}) adicionado com sucesso à maleta ${suitcaseCode} (${quantity} unidades)`);
        } catch (error: any) {
          console.error(`[SuitcaseSupplyController] Erro ao adicionar unidade ${quantity} do item ${item.inventory_id} à maleta:`, error);
          throw error; // Propagar erro para interromper a operação
        }
      }

      console.log(`[SuitcaseSupplyController] Abastecimento concluído: ${addedItems.length} itens adicionados`);
      return addedItems;
    } catch (error) {
      console.error("[SuitcaseSupplyController] Erro ao abastecer maleta:", error);
      throw error;
    }
  }

  /**
   * Gera um PDF de comprovante de abastecimento
   * @param suitcaseId ID da maleta
   * @param items Itens adicionados à maleta
   * @returns URL do PDF gerado
   */
  static async generateSupplyPDF(suitcaseId: string, items: SupplyItem[], suitcaseInfo: any): Promise<string> {
    return SupplyPdfController.generateSupplyPDF(suitcaseId, items, suitcaseInfo);
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
