
/**
 * Controlador de Suprimento de Maletas
 * @file Funções para adicionar e remover itens de maletas
 */
import { SuitcaseItemModel } from "@/models/suitcase/suitcaseItemModel";
import { SuitcaseModel } from "@/models/suitcaseModel";
import { supabase } from "@/integrations/supabase/client";
import { SupplyItem, SuitcaseItem } from "@/types/suitcase";

export class SuitcaseSupplyController {
  /**
   * Busca itens disponíveis para adicionar na maleta
   * @param searchTerm Termo de busca 
   * @param suitcaseId ID da maleta
   * @returns Itens disponíveis para adicionar
   */
  static async searchInventoryItems(searchTerm: string, suitcaseId: string): Promise<SupplyItem[]> {
    try {
      console.log(`Buscando itens com termo "${searchTerm}" para a maleta ${suitcaseId}`);
      
      // Garantir que temos um termo de busca válido
      if (!searchTerm || searchTerm.trim().length < 2) {
        return [];
      }
      
      // Buscar itens com base no termo (SKU, nome)
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          id,
          name,
          sku,
          price,
          quantity, 
          photo_url:inventory_photos (
            photo_url
          )
        `)
        .or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`)
        .gt('quantity', 0)
        .limit(10);

      if (error) {
        console.error("Erro ao buscar itens do inventário:", error);
        throw error;
      }
      
      // Verificar disponibilidade de cada item
      const availableItems: SupplyItem[] = [];
      
      for (const item of (data || [])) {
        if (item.quantity <= 0) continue;
        
        // Verificar se o item já está em alguma maleta
        const { available } = await SuitcaseItemModel.checkItemAvailability(item.id);
        
        if (available) {
          // Formatar o item para a resposta
          let photo_url = null;
          if (item.photo_url && item.photo_url.length > 0) {
            photo_url = item.photo_url[0]?.photo_url;
          }
          
          availableItems.push({
            inventory_id: item.id,
            quantity: 1,
            product: {
              id: item.id,
              name: item.name,
              sku: item.sku,
              price: item.price,
              photo_url
            }
          });
        }
      }
      
      return availableItems;
    } catch (error) {
      console.error("Erro ao buscar itens para adicionar:", error);
      throw error;
    }
  }
  
  /**
   * Adiciona um item à maleta
   * @param suitcaseId ID da maleta
   * @param inventoryId ID do item no inventário
   * @returns Item adicionado
   */
  static async addItemToSuitcase(suitcaseId: string, inventoryId: string): Promise<SuitcaseItem> {
    try {
      // Verificar disponibilidade do item
      const { available, message } = await SuitcaseItemModel.checkItemAvailability(inventoryId);
      
      if (!available) {
        throw new Error(message);
      }
      
      // Adicionar item à maleta
      const suitcaseItem = await SuitcaseItemModel.addItemToSuitcase({
        suitcase_id: suitcaseId, 
        inventory_id: inventoryId
      });
      
      // Atualizar status da maleta para não vazia
      const suitcase = await SuitcaseModel.getSuitcaseById(suitcaseId);
      if (suitcase && suitcase.status === 'in_use') {
        // Verificar se é o primeiro item (para evitar atualizações desnecessárias)
        const { count } = await SuitcaseItemModel.countSuitcaseItems(suitcaseId);
        if (count === 1) {
          await SuitcaseModel.updateSuitcase(suitcaseId, { });
        }
      }
      
      return suitcaseItem;
    } catch (error) {
      console.error("Erro ao adicionar item à maleta:", error);
      throw error;
    }
  }
}
