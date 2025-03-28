
/**
 * Controlador de Acertos de Maleta
 * @file Este arquivo controla as operações relacionadas aos acertos de maleta,
 * delegando as operações às camadas de modelo correspondentes
 */
import { SuitcaseModel } from "@/models/suitcaseModel";
import { AcertoMaletaModel } from "@/models/acertoMaletaModel";
import { Acerto, SuitcaseSettlementFormData, SuitcaseItem, AcertoStatus } from "@/types/suitcase";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const SettlementController = {
  /**
   * Busca o histórico de acertos de uma maleta
   * @param suitcaseId ID da maleta
   * @returns Lista de acertos da maleta
   */
  async getHistoricoAcertos(suitcaseId: string): Promise<Acerto[]> {
    try {
      console.log("Buscando histórico de acertos para a maleta:", suitcaseId);
      
      // Buscar acertos da maleta diretamente usando o cliente supabase
      const { data: acertos, error } = await supabase
        .from('acertos_maleta')
        .select(`
          *,
          suitcase:suitcases(id, code),
          seller:resellers(id, name)
        `)
        .eq('suitcase_id', suitcaseId)
        .order('settlement_date', { ascending: false });
        
      if (error) throw error;
      
      // Para cada acerto, buscar os itens vendidos com detalhes completos do produto
      const acertosCompletos = await Promise.all((acertos || []).map(async (acerto) => {
        // Buscar itens vendidos para este acerto com todos os dados necessários
        const { data: itensVendidos, error: itemsError } = await supabase
          .from('acerto_itens_vendidos')
          .select(`
            *,
            product:inventory_id(
              id, 
              name, 
              sku, 
              price, 
              unit_cost, 
              photo_url:inventory_photos(photo_url)
            )
          `)
          .eq('acerto_id', acerto.id);
          
        if (itemsError) {
          console.error(`Erro ao buscar itens vendidos para acerto ${acerto.id}:`, itemsError);
          return acerto;
        }
        
        // Processar os itens vendidos para cálculos corretos
        const processedItems = itensVendidos || [];
        
        // Calcular o total de vendas somando os preços de todos os itens vendidos
        const totalSales = processedItems.reduce((sum, item) => sum + Number(item.price || 0), 0);
        
        // Calcular o custo total dos itens vendidos
        const totalCost = processedItems.reduce((sum, item) => {
          // Usar o unit_cost do produto ou fallback para 0 se não disponível
          const unitCost = Number(item.unit_cost || item.product?.unit_cost || 0);
          return sum + unitCost;
        }, 0);
        
        // Garantir que estamos usando o valor correto de comissão da revendedora
        const commissionRate = acerto.seller?.commission_rate || 0.3; // 30% padrão se não especificado
        
        // Recalcular a comissão com base no total de vendas
        const commissionAmount = totalSales * commissionRate;
        
        // Calcular o lucro líquido (vendas - comissão - custo)
        const netProfit = totalSales - commissionAmount - totalCost;
        
        console.log(`Processando acerto ${acerto.id} com ${processedItems.length} itens vendidos`);
        if (processedItems.length > 0) {
          processedItems.forEach(item => {
            console.log(`Item vendido: ${item.product?.name} (ID: ${item.inventory_id}) - Preço: ${item.price}`);
          });
        }
        
        // Retornar acerto com valores calculados e itens vendidos
        return {
          ...acerto,
          items_vendidos: processedItems,
          total_sales: totalSales,
          commission_amount: commissionAmount,
          total_cost: totalCost,
          net_profit: netProfit
        };
      }));
      
      console.log(`Histórico de acertos buscado para a maleta: ${suitcaseId}`);
      return acertosCompletos;
    } catch (error) {
      console.error("Erro ao buscar histórico de acertos:", error);
      throw error;
    }
  },

  /**
   * Cria um acerto pendente para uma maleta
   * @param suitcaseId ID da maleta
   * @param settlementDate Data do acerto
   * @returns Informações do acerto criado
   */
  async createPendingSettlement(suitcaseId: string, settlementDate: Date): Promise<Acerto> {
    try {
      console.log("Criando acerto pendente para maleta:", suitcaseId);
      
      // Buscar informações da maleta
      const suitcase = await SuitcaseModel.getSuitcaseById(suitcaseId);
      if (!suitcase) {
        throw new Error("Maleta não encontrada");
      }
      
      // Criar acerto pendente
      const acertoData = {
        suitcase_id: suitcaseId,
        seller_id: suitcase.seller_id,
        settlement_date: settlementDate.toISOString(),
        status: 'pendente' as AcertoStatus,
        total_sales: 0,
        commission_amount: 0
      };
      
      const acerto = await AcertoMaletaModel.createAcerto(acertoData);
      console.log("Acerto pendente criado:", acerto.id);
      
      return acerto;
    } catch (error) {
      console.error("Erro ao criar acerto pendente:", error);
      throw error;
    }
  },
  
  /**
   * Finaliza um acerto de maleta processando todos os itens
   * @param acertoId ID do acerto
   * @param suitcaseId ID da maleta
   * @param formData Dados do formulário de acerto
   * @returns Acerto finalizado
   */
  async finalizeSettlement(acertoId: string, suitcaseId: string, formData: SuitcaseSettlementFormData): Promise<Acerto> {
    try {
      console.log("Finalizando acerto:", acertoId, "com dados:", JSON.stringify(formData, null, 2));
      
      // Garantir que temos as datas em formato de string ISO antes de prosseguir
      const settlementDate = formData.settlement_date instanceof Date 
        ? formData.settlement_date.toISOString() 
        : typeof formData.settlement_date === 'string'
          ? formData.settlement_date
          : new Date().toISOString();
      
      const nextSettlementDate = formData.next_settlement_date instanceof Date 
        ? formData.next_settlement_date.toISOString() 
        : typeof formData.next_settlement_date === 'string'
          ? formData.next_settlement_date
          : null;
      
      // Processar os itens (presentes, vendidos)
      // Extrair apenas os IDs dos itens
      const itemsPresentIds = formData.items_present.map(item => 
        typeof item === 'string' ? item : item.id
      );

      const itemsSoldIds = formData.items_sold.map(item => 
        typeof item === 'string' ? item : item.id
      );
      
      console.log(`Processando itens: ${itemsPresentIds.length} presentes, ${itemsSoldIds.length} vendidos`);
      
      // 1. Processar os itens usando uma única chamada para evitar processamento duplicado
      await AcertoMaletaModel.processAcertoItems(
        acertoId,
        suitcaseId,
        itemsPresentIds,
        itemsSoldIds
      );
      
      // 2. Calcular valores totais com base nos itens vendidos
      let totalSales = 0;
      let totalCosts = 0;
      
      // Buscar detalhes dos itens vendidos para calcular o valor total
      if (itemsSoldIds.length > 0) {
        // Buscar detalhes dos itens vendidos
        const { data: vendaRegistros, error: vendaError } = await supabase
          .from('acerto_itens_vendidos')
          .select('price, unit_cost')
          .eq('acerto_id', acertoId);
          
        if (vendaError) {
          console.error("Erro ao buscar registros de venda:", vendaError);
          toast.error("Erro ao buscar detalhes dos itens vendidos, usando valores calculados alternativos");
        } else if (vendaRegistros && vendaRegistros.length > 0) {
          totalSales = vendaRegistros.reduce((sum, item) => sum + (item.price || 0), 0);
          totalCosts = vendaRegistros.reduce((sum, item) => sum + (item.unit_cost || 0), 0);
        }
      }
      
      // 3. Buscar taxa de comissão do vendedor
      // Primeiro, precisamos buscar a maleta para ter o ID do vendedor
      const suitcase = await SuitcaseModel.getSuitcaseById(suitcaseId);
      
      if (!suitcase) {
        throw new Error("Maleta não encontrada");
      }
      
      // Agora sim podemos buscar a taxa de comissão da revendedora
      const { data: resellerData, error: resellerError } = await supabase
        .from("resellers")
        .select("commission_rate")
        .eq("id", suitcase.seller_id)
        .single();
        
      if (resellerError) {
        console.error("Erro ao buscar taxa de comissão da revendedora:", resellerError);
      }
      
      // Usar a taxa de comissão do vendedor se disponível, ou o valor padrão de 0.3 (30%)
      const commissionRate = resellerData?.commission_rate || 0.3;
      const commissionAmount = totalSales * commissionRate;
      
      // Calcular lucro líquido
      const netProfit = totalSales - commissionAmount - totalCosts;
      
      console.log(`Valor total das vendas: ${totalSales}, Comissão (${commissionRate * 100}%): ${commissionAmount}, Custo: ${totalCosts}, Lucro: ${netProfit}`);
      
      // 4. Atualizar acerto com status concluído e valores calculados
      const { data: updatedAcerto, error } = await supabase
        .from('acertos_maleta')
        .update({
          status: 'concluido',
          total_sales: totalSales,
          commission_amount: commissionAmount,
          total_cost: totalCosts,
          net_profit: netProfit,
          next_settlement_date: nextSettlementDate
        })
        .eq('id', acertoId)
        .select()
        .single();
      
      if (error) {
        console.error("Erro ao atualizar acerto:", error);
        throw error;
      }
      
      // 5. Atualizar data do próximo acerto na maleta
      if (nextSettlementDate) {
        await SuitcaseModel.updateSuitcase(suitcaseId, {
          next_settlement_date: nextSettlementDate
        });
      }
      
      console.log("Acerto finalizado com sucesso:", acertoId);
      return updatedAcerto;
    } catch (error) {
      console.error("Erro ao finalizar acerto:", error);
      throw error;
    }
  }
};
