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
      
      // Buscar TODOS os itens da maleta que estão atualmente em posse
      const { data: suitcaseItems, error: itemsError } = await supabase
        .from('suitcase_items')
        .select(`
          *,
          product:inventory(id, name, sku, price, unit_cost)
        `)
        .eq('suitcase_id', data.suitcase_id)
        .eq('status', 'in_possession');
      
      if (itemsError) {
        console.error("Erro ao buscar itens da maleta:", itemsError);
        throw new Error("Erro ao buscar itens da maleta para acerto");
      }
      
      // Verificar se temos itens para processar
      if (!suitcaseItems || suitcaseItems.length === 0) {
        console.warn(`Nenhum item encontrado na maleta ${data.suitcase_id} para acerto`);
        toast.warning("Não foram encontrados itens na maleta para acerto");
      }
      
      // Processar os itens presentes e itens vendidos com base nos IDs fornecidos
      const itemsPresentIds = data.items_present.map(item => 
        typeof item === 'string' ? item : item.id
      );
      
      // Identificar itens vendidos como aqueles que estão na maleta mas não estão na lista de presentes
      let soldItems = [];
      if (suitcaseItems && suitcaseItems.length > 0) {
        soldItems = suitcaseItems.filter(item => !itemsPresentIds.includes(item.id));
      }
      
      const totalSales = soldItems.reduce((sum, item) => {
        return sum + (item.product?.price || 0);
      }, 0);
      
      const commissionRate = suitcase.seller?.commission_rate || 0.3;
      const commissionAmount = totalSales * commissionRate;
      
      // Verificar se já existe um acerto pendente para esta maleta
      const { data: existingAcerto, error: existingError } = await supabase
        .from('acertos_maleta')
        .select('id')
        .eq('suitcase_id', data.suitcase_id)
        .eq('status', 'pendente');
      
      if (existingError) {
        console.error("Erro ao verificar acerto existente:", existingError);
      }
      
      let acertoId: string;
      
      // Atualizar acerto existente ou criar um novo
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
      
      // Extrair os IDs dos itens vendidos
      const soldItemIds = soldItems.map(item => item.id);
      
      // Processar todos os itens através do modelo de acerto
      console.log(`Processando ${itemsPresentIds.length} itens presentes e ${soldItemIds.length} itens vendidos`);
      
      await AcertoMaletaModel.processAcertoItems(
        acertoId,
        data.suitcase_id,
        itemsPresentIds,
        soldItemIds
      );
      
      // Atualizar a próxima data de acerto na maleta, se fornecida
      if (data.next_settlement_date) {
        await supabase
          .from('suitcases')
          .update({ 
            next_settlement_date: new Date(data.next_settlement_date).toISOString() 
          })
          .eq('id', data.suitcase_id);
      }
      
      // Verificação final: garantir que nenhum item permaneça na maleta
      const { data: remainingItems, error: checkError } = await supabase
        .from('suitcase_items')
        .select('id')
        .eq('suitcase_id', data.suitcase_id);
      
      if (checkError) {
        console.error(`Erro ao verificar itens restantes na maleta ${data.suitcase_id}:`, checkError);
      } else if (remainingItems && remainingItems.length > 0) {
        console.warn(`Encontrados ${remainingItems.length} itens ainda na maleta após o acerto. Remoção final...`);
        
        // Remover todos os itens restantes da maleta
        const { error: removeError } = await supabase
          .from('suitcase_items')
          .delete()
          .eq('suitcase_id', data.suitcase_id);
        
        if (removeError) {
          console.error(`Erro ao remover itens restantes da maleta:`, removeError);
          toast.error("Erro ao remover alguns itens da maleta. Por favor, verifique o estado da maleta.");
        } else {
          console.log(`${remainingItems.length} itens restantes removidos com sucesso da maleta ${data.suitcase_id}`);
        }
      }
      
      // Buscar e retornar o acerto completo com todas as informações atualizadas
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
