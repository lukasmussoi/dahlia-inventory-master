import { SuitcaseSettlementFormData } from "@/types/suitcase";
import { supabase } from "@/integrations/supabase/client";
import { SuitcaseController } from "./suitcaseController";
import { SuitcaseModel } from "@/models/suitcaseModel";
import { generateAcertoReceipt } from "@/utils/reportGenerator";

export const acertoMaletaController = {
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  },

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  },

  async getItemSalesFrequency(inventoryId: string, sellerId: string): Promise<{ count: number; frequency: string }> {
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const ninetyDaysAgoISO = ninetyDaysAgo.toISOString();

      const { data, error } = await supabase
        .rpc('count_item_sales', {
          inventory_id_param: inventoryId,
          seller_id_param: sellerId,
          date_threshold: ninetyDaysAgoISO
        });
      
      if (error) {
        console.error("Erro ao buscar frequência de vendas:", error);
        return { count: 0, frequency: "baixa" };
      }
      
      const safeCount = data as number || 0;
      let frequency = "baixa";
      
      if (safeCount > 5) {
        frequency = "alta";
      } else if (safeCount > 1) {
        frequency = "média";
      }

      return { count: safeCount, frequency };
    } catch (error) {
      console.error("Erro ao buscar frequência de vendas:", error);
      return { count: 0, frequency: "baixa" };
    }
  },

  async getAcertoById(id: string) {
    try {
      const { data: acertoHeader, error: acertoError } = await supabase
        .from('acertos_maleta')
        .select(`
          *,
          suitcase:suitcase_id (
            id,
            code
          ),
          seller:seller_id (
            id,
            name,
            commission_rate,
            address
          )
        `)
        .eq('id', id)
        .single();

      if (acertoError) {
        console.error("Erro ao buscar acerto:", acertoError);
        throw new Error("Erro ao buscar acerto");
      }

      const { data: itensVendidos, error: itensError } = await supabase
        .from('acerto_itens_vendidos')
        .select(`
          id,
          suitcase_item_id,
          inventory_id,
          price,
          sale_date,
          customer_name,
          payment_method,
          commission_value,
          commission_rate,
          net_profit,
          unit_cost,
          product:inventory_id (
            id,
            name,
            sku,
            photos:inventory_photos(photo_url)
          )
        `)
        .eq('acerto_id', id);

      if (itensError) {
        console.error("Erro ao buscar itens vendidos:", itensError);
        throw new Error("Erro ao buscar itens vendidos");
      }

      return {
        ...acertoHeader,
        items_vendidos: itensVendidos || []
      };
    } catch (error) {
      console.error("Erro ao buscar acerto:", error);
      throw new Error("Erro ao buscar acerto");
    }
  },

  async createAcerto(formData: SuitcaseSettlementFormData): Promise<string> {
    try {
      if (!formData.suitcase_id) {
        throw new Error("ID da maleta é obrigatório");
      }

      if (!formData.seller_id) {
        throw new Error("ID da revendedora é obrigatório");
      }

      if (!formData.settlement_date) {
        throw new Error("Data do acerto é obrigatória");
      }

      const items = await SuitcaseController.getSuitcaseItems(formData.suitcase_id);
      
      const soldItemIds = items
        .filter(item => !formData.items_present.includes(item.id))
        .map(item => ({
          suitcase_item_id: item.id,
          inventory_id: item.inventory_id,
          price: item.product?.price || 0
        }));

      let totalSales = 0;
      let totalCommission = 0;
      let totalCost = 0;
      let totalProfit = 0;

      const acertoItemsToInsert = [];

      for (const soldItem of soldItemIds) {
        const item = items.find(i => i.id === soldItem.suitcase_item_id);
        if (item) {
          const seller = await supabase
            .from('resellers')
            .select('commission_rate')
            .eq('id', formData.seller_id)
            .maybeSingle();
          
          const commissionRate = seller.data?.commission_rate || 0.3;
          const commissionValue = soldItem.price * commissionRate;
          const unitCost = item?.product?.unit_cost || 0;
          const netProfit = soldItem.price - commissionValue - unitCost;

          totalSales += soldItem.price;
          totalCommission += commissionValue;
          totalCost += unitCost;
          totalProfit += netProfit;

          acertoItemsToInsert.push({
            acerto_id: '',
            suitcase_item_id: soldItem.suitcase_item_id,
            inventory_id: soldItem.inventory_id,
            seller_id: formData.seller_id,
            price: soldItem.price,
            sale_date: formData.settlement_date.toISOString(),
            commission_value: commissionValue,
            commission_rate: commissionRate,
            unit_cost: unitCost,
            net_profit: netProfit,
            customer_name: formData.customer_name || ''
          });
        }
      }

      const { data: newAcerto, error } = await supabase
        .from('acertos_maleta')
        .insert({
          suitcase_id: formData.suitcase_id,
          seller_id: formData.seller_id,
          settlement_date: formData.settlement_date.toISOString(),
          next_settlement_date: formData.next_settlement_date ? formData.next_settlement_date.toISOString() : null,
          total_sales: totalSales,
          commission_amount: totalCommission,
          total_cost: totalCost,
          net_profit: totalProfit,
          status: 'concluido'
        })
        .select()
        .single();

      if (error) throw error;

      const acertoId = newAcerto.id;

      if (acertoItemsToInsert.length > 0) {
        for (const item of acertoItemsToInsert) {
          item.acerto_id = acertoId;
        }

        const { error: itemsError } = await supabase
          .from('acerto_itens_vendidos')
          .insert(acertoItemsToInsert);

        if (itemsError) throw itemsError;
      }
      
      await this.emptyMaletaAfterAcerto(formData.suitcase_id);
      
      const acertoCompleto = await this.getAcertoById(acertoId);
      if (acertoCompleto) {
        try {
          const receiptUrl = generateAcertoReceipt(acertoCompleto);
          await this.storeReceiptUrl(acertoId, receiptUrl);
        } catch (error) {
          console.error("Erro ao gerar recibo PDF:", error);
        }
      }
      
      return acertoId;
    } catch (error: any) {
      console.error("Erro ao criar acerto:", error);
      throw new Error(error.message || "Erro ao criar acerto da maleta");
    }
  },
  
  async emptyMaletaAfterAcerto(suitcaseId: string): Promise<void> {
    try {
      console.log(`Esvaziando maleta ${suitcaseId} após acerto...`);
      
      const items = await SuitcaseController.getSuitcaseItems(suitcaseId);
      const itemsInPossession = items.filter(item => item.status === 'in_possession');
      
      console.log(`Encontrados ${itemsInPossession.length} itens para devolver ao estoque`);
      
      for (const item of itemsInPossession) {
        try {
          await SuitcaseModel.returnItemToInventory(item.id);
          console.log(`Item ${item.id} devolvido ao estoque com sucesso`);
        } catch (error) {
          console.error(`Erro ao devolver item ${item.id} ao estoque:`, error);
        }
      }
      
      await SuitcaseController.updateSuitcase(suitcaseId, { 
        status: 'in_use',
        is_empty: true
      });
      
      console.log(`Maleta ${suitcaseId} esvaziada com sucesso após acerto`);
    } catch (error) {
      console.error("Erro ao esvaziar maleta após acerto:", error);
      throw error;
    }
  },

  async storeReceiptUrl(acertoId: string, receiptUrl: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('acertos_maleta')
        .update({ receipt_url: receiptUrl })
        .eq('id', acertoId);
      
      if (error) throw error;
    } catch (error) {
      console.error("Erro ao armazenar URL do recibo:", error);
      throw new Error("Erro ao armazenar URL do recibo");
    }
  },

  async getAllAcertos() {
    try {
      const { data, error } = await supabase
        .from('acertos_maleta')
        .select(`
          *,
          suitcase:suitcase_id (
            id,
            code
          ),
          seller:seller_id (
            id,
            name,
            commission_rate,
            address
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Erro ao buscar acertos:", error);
      throw new Error("Erro ao buscar acertos");
    }
  },

  async getAcertosBySuitcase(suitcaseId: string) {
    try {
      const { data, error } = await supabase
        .from('acertos_maleta')
        .select(`
          *,
          seller:seller_id (
            id,
            name,
            commission_rate
          )
        `)
        .eq('suitcase_id', suitcaseId)
        .order('settlement_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Erro ao buscar acertos da maleta ${suitcaseId}:`, error);
      throw new Error("Erro ao buscar acertos da maleta");
    }
  },

  async generateReceiptPDF(acertoId: string): Promise<string> {
    try {
      const acerto = await this.getAcertoById(acertoId);
      if (!acerto) {
        throw new Error("Acerto não encontrado");
      }
      
      const receiptUrl = generateAcertoReceipt(acerto);
      
      await this.storeReceiptUrl(acertoId, receiptUrl);
      
      console.log(`PDF do acerto ${acertoId} gerado com sucesso`);
      return receiptUrl;
    } catch (error) {
      console.error("Erro ao gerar PDF do acerto:", error);
      throw new Error("Erro ao gerar PDF do acerto");
    }
  }
};

export const AcertoMaletaController = acertoMaletaController;
