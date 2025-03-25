
/**
 * Controlador de Operações de Acerto
 * @file Este arquivo contém operações para criar, atualizar e excluir acertos.
 * @relacionamento Utiliza o cliente Supabase e o AcertoMaletaModel para manipular dados.
 */
import { supabase } from "@/integrations/supabase/client";
import { Acerto, SuitcaseSettlementFormData } from "@/types/suitcase";
import { toast } from "sonner";
import { AcertoMaletaModel } from "@/models/acertoMaletaModel";
import { SuitcaseItemModel } from "@/models/suitcase/suitcaseItemModel";
import { AcertoDetailsController } from "./acertoDetailsController";

export class AcertoOperationsController {
  /**
   * Cria um novo acerto de maleta
   * @param data Dados do formulário de acerto
   * @returns Acerto criado
   */
  static async createAcerto(data: SuitcaseSettlementFormData): Promise<Acerto> {
    try {
      const { data: suitcase, error: suitcaseError } = await supabase
        .from('suitcases')
        .select(`
          *,
          seller:resellers(id, name, commission_rate)
        `)
        .eq('id', data.suitcase_id)
        .single();
      
      if (suitcaseError) {
        console.error("Erro ao buscar maleta:", suitcaseError);
        throw new Error("Erro ao buscar maleta para acerto");
      }
      
      const { data: suitcaseItems, error: itemsError } = await supabase
        .from('suitcase_items')
        .select(`
          *,
          product:inventory(id, name, sku, price)
        `)
        .eq('suitcase_id', data.suitcase_id)
        .eq('status', 'in_possession')
        .not('id', 'in', `(${data.items_present.join(',')})`);
      
      if (itemsError && data.items_present.length > 0) {
        console.error("Erro ao buscar itens da maleta:", itemsError);
        throw new Error("Erro ao buscar itens da maleta para acerto");
      }
      
      const soldItems = suitcaseItems || [];
      const totalSales = soldItems.reduce((sum, item) => {
        return sum + (item.product?.price || 0);
      }, 0);
      
      const commissionRate = suitcase.seller?.commission_rate || 0.3;
      const commissionAmount = totalSales * commissionRate;
      
      const { data: existingAcerto, error: existingError } = await supabase
        .from('acertos_maleta')
        .select('id')
        .eq('suitcase_id', data.suitcase_id)
        .eq('status', 'pendente');
      
      if (existingError) {
        console.error("Erro ao verificar acerto existente:", existingError);
      }
      
      let acertoId: string;
      
      if (existingAcerto && existingAcerto.length > 0) {
        const { data: updatedAcerto, error: updateError } = await supabase
          .from('acertos_maleta')
          .update({
            settlement_date: new Date(data.settlement_date).toISOString(),
            next_settlement_date: data.next_settlement_date ? new Date(data.next_settlement_date).toISOString() : null,
            total_sales: totalSales,
            commission_amount: commissionAmount,
            status: 'concluido'
          })
          .eq('id', existingAcerto[0].id)
          .select()
          .single();
        
        if (updateError) {
          console.error("Erro ao atualizar acerto:", updateError);
          throw new Error("Erro ao atualizar acerto existente");
        }
        
        acertoId = existingAcerto[0].id;
      } else {
        const { data: newAcerto, error: createError } = await supabase
          .from('acertos_maleta')
          .insert({
            suitcase_id: data.suitcase_id,
            seller_id: data.seller_id,
            settlement_date: new Date(data.settlement_date).toISOString(),
            next_settlement_date: data.next_settlement_date ? new Date(data.next_settlement_date).toISOString() : null,
            total_sales: totalSales,
            commission_amount: commissionAmount,
            status: 'concluido'
          })
          .select()
          .single();
        
        if (createError) {
          console.error("Erro ao criar acerto:", createError);
          throw new Error("Erro ao criar acerto");
        }
        
        acertoId = newAcerto.id;
      }
      
      if (soldItems.length > 0) {
        await Promise.all(soldItems.map(async (item) => {
          const { data: saleInfo, error: saleError } = await supabase
            .from('suitcase_item_sales')
            .select('*')
            .eq('suitcase_item_id', item.id);
          
          if (saleError) {
            console.error(`Erro ao buscar informações de venda para o item ${item.id}:`, saleError);
          }
          
          const { error: updateError } = await supabase
            .from('suitcase_items')
            .update({ status: 'sold' })
            .eq('id', item.id);
          
          if (updateError) {
            console.error(`Erro ao atualizar status do item ${item.id}:`, updateError);
          }
          
          const customerName = saleInfo && saleInfo.length > 0 ? saleInfo[0].customer_name : null;
          const paymentMethod = saleInfo && saleInfo.length > 0 ? saleInfo[0].payment_method : null;
          
          const { error: acertoItemError } = await supabase
            .from('acerto_itens_vendidos')
            .insert({
              acerto_id: acertoId,
              suitcase_item_id: item.id,
              inventory_id: item.inventory_id,
              price: item.product?.price || 0,
              sale_date: new Date().toISOString(),
              customer_name: customerName,
              payment_method: paymentMethod
            });
          
          if (acertoItemError) {
            console.error(`Erro ao registrar item vendido ${item.id} no acerto:`, acertoItemError);
          }
        }));
      }

      // Processar os itens presentes (devolver ao estoque)
      if (data.items_present && data.items_present.length > 0) {
        for (const itemId of data.items_present) {
          const id = typeof itemId === 'string' ? itemId : itemId.id;
          console.log(`Retornando item ${id} ao estoque`);
          await SuitcaseItemModel.returnItemToInventory(id);
        }
      }
      
      // Remover todos os itens processados da maleta
      const allProcessedItems = [
        ...data.items_present.map(item => typeof item === 'string' ? item : item.id),
        ...soldItems.map(item => item.id)
      ];
      
      if (allProcessedItems.length > 0) {
        const { error: removalError } = await supabase
          .from('suitcase_items')
          .delete()
          .in('id', allProcessedItems);
        
        if (removalError) {
          console.error(`Erro ao remover itens da maleta:`, removalError);
          throw removalError;
        }
      }
      
      if (data.next_settlement_date) {
        await supabase
          .from('suitcases')
          .update({ 
            next_settlement_date: new Date(data.next_settlement_date).toISOString() 
          })
          .eq('id', data.suitcase_id);
      }
      
      return await AcertoDetailsController.getAcertoById(acertoId);
    } catch (error) {
      console.error("Erro ao criar acerto:", error);
      throw error;
    }
  }

  /**
   * Exclui um acerto e restaura os itens vendidos
   * @param acertoId ID do acerto a ser excluído
   * @returns Indica se a operação foi bem-sucedida
   */
  static async deleteAcerto(acertoId: string): Promise<boolean> {
    try {
      const { data: isAdmin } = await supabase.rpc('is_admin');
      
      if (!isAdmin) {
        toast.error("Apenas administradores podem excluir acertos");
        return false;
      }
      
      const acerto = await AcertoDetailsController.getAcertoById(acertoId);
      
      if (!acerto) {
        toast.error("Acerto não encontrado");
        return false;
      }
      
      if (acerto.status === 'concluido' && acerto.items_vendidos && acerto.items_vendidos.length > 0) {
        const suitcaseItemIds = acerto.items_vendidos.map(item => item.suitcase_item_id);
        
        if (suitcaseItemIds.length > 0) {
          const { error: updateError } = await supabase
            .from('suitcase_items')
            .update({ status: 'in_possession' })
            .in('id', suitcaseItemIds);
          
          if (updateError) {
            console.error("Erro ao atualizar status dos itens:", updateError);
            throw new Error("Erro ao restaurar status dos itens da maleta");
          }
        }
      }
      
      await AcertoMaletaModel.deleteAcerto(acertoId);
      
      return true;
    } catch (error: any) {
      console.error("Erro ao excluir acerto:", error);
      throw new Error(error.message || "Erro ao excluir acerto");
    }
  }

  /**
   * Atualiza o status de um acerto
   * @param acertoId ID do acerto
   * @param newStatus Novo status para o acerto
   * @returns Acerto atualizado
   */
  static async updateAcertoStatus(acertoId: string, newStatus: 'pendente' | 'concluido'): Promise<Acerto> {
    try {
      const { data, error } = await supabase
        .from('acertos_maleta')
        .update({ status: newStatus })
        .eq('id', acertoId)
        .select()
        .single();
      
      if (error) {
        console.error("Erro ao atualizar status do acerto:", error);
        throw new Error("Erro ao atualizar status do acerto");
      }
      
      return await AcertoDetailsController.getAcertoById(acertoId);
    } catch (error) {
      console.error("Erro ao atualizar status do acerto:", error);
      throw error;
    }
  }
}
