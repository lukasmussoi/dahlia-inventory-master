
/**
 * Controlador de Geração de PDFs
 * @file Este arquivo controla a geração de PDFs relacionados às maletas
 */
import { supabase } from "@/integrations/supabase/client";
import { SupplyPdfController } from "./pdf/supplyPdfController";
import { SuitcaseItem } from "@/types/suitcase";

export class PdfController {
  /**
   * Gera um PDF da maleta com seus itens
   * @param suitcaseId ID da maleta
   * @param items Itens da maleta
   * @param promoterInfo Informações da promotora
   * @returns URL do PDF gerado
   */
  static async generateSuitcasePDF(suitcaseId: string, items: any[], promoterInfo: any): Promise<string> {
    try {
      console.log("Gerando PDF para maleta", suitcaseId, "com", items.length, "itens");
      
      // Buscar dados da maleta se não fornecidos no parâmetro promoterInfo
      let suitcaseInfo = promoterInfo;
      if (!suitcaseInfo || !suitcaseInfo.code) {
        const { data: suitcase, error } = await supabase
          .from('suitcases')
          .select(`
            *,
            seller:resellers(*)
          `)
          .eq('id', suitcaseId)
          .single();
          
        if (error) throw error;
        suitcaseInfo = suitcase;
      }
      
      // Calcular valor total da maleta corretamente, garantindo que estamos trabalhando com um array
      const valorTotal = items.reduce((acumulador: number, item: any) => {
        const itemPrice = item.product?.price || 0;
        const itemQuantity = item.quantity || 1;
        return acumulador + (itemPrice * itemQuantity);
      }, 0);
      
      console.log(`Valor total calculado da maleta: ${valorTotal}`);
      
      // Usar o SupplyPdfController para gerar o PDF no mesmo formato de abastecimento
      return await SupplyPdfController.generateSupplyPDF(suitcaseId, items, suitcaseInfo);
    } catch (error) {
      console.error("Erro ao gerar PDF da maleta:", error);
      throw error;
    }
  }
}
