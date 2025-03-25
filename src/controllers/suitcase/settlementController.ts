
/**
 * Controlador de Acertos de Maleta
 * @file Este arquivo controla as operações relacionadas aos acertos de maleta,
 * delegando as operações às camadas de modelo correspondentes
 */
import { SuitcaseModel } from "@/models/suitcaseModel";
import { AcertoMaletaModel } from "@/models/acertoMaletaModel";
import { Acerto, SuitcaseSettlementFormData } from "@/types/suitcase";

export const SettlementController = {
  /**
   * Busca o histórico de acertos de uma maleta
   * @param suitcaseId ID da maleta
   * @returns Lista de acertos da maleta
   */
  async getHistoricoAcertos(suitcaseId: string): Promise<Acerto[]> {
    try {
      console.log("Buscando histórico de acertos para a maleta:", suitcaseId);
      
      // Buscar acertos da maleta a partir do modelo
      const { data: acertos, error } = await SuitcaseModel.supabase
        .from('acertos_maleta')
        .select(`
          *,
          suitcase:suitcases(code),
          seller:resellers(name)
        `)
        .eq('suitcase_id', suitcaseId)
        .order('settlement_date', { ascending: false });
        
      if (error) throw error;
      
      console.log(`Histórico de acertos buscado para a maleta: ${suitcaseId}`);
      return acertos || [];
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
        status: "pendente",
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
      console.log("Finalizando acerto:", acertoId);
      
      // 1. Processar os itens (presentes, vendidos)
      await AcertoMaletaModel.processAcertoItems(
        acertoId,
        suitcaseId,
        formData.items_present,
        formData.items_sold
      );
      
      // 2. Calcular valores totais
      let totalSales = 0;
      formData.items_sold.forEach(item => {
        totalSales += item.price;
      });
      
      // 3. Buscar taxa de comissão do vendedor
      const suitcase = await SuitcaseModel.getSuitcaseById(suitcaseId);
      const commissionRate = suitcase?.seller?.commission_rate || 0.3;
      const commissionAmount = totalSales * commissionRate;
      
      // 4. Atualizar acerto com status concluído e valores calculados
      const { data: updatedAcerto, error } = await SuitcaseModel.supabase
        .from('acertos_maleta')
        .update({
          status: 'concluido',
          total_sales: totalSales,
          commission_amount: commissionAmount,
          next_settlement_date: formData.next_settlement_date ? new Date(formData.next_settlement_date).toISOString() : null
        })
        .eq('id', acertoId)
        .select()
        .single();
      
      if (error) {
        console.error("Erro ao atualizar acerto:", error);
        throw error;
      }
      
      // 5. Atualizar data do próximo acerto na maleta
      if (formData.next_settlement_date) {
        await SuitcaseModel.updateSuitcase(suitcaseId, {
          next_settlement_date: new Date(formData.next_settlement_date).toISOString()
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
