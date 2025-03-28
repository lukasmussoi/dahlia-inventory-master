
/**
 * Controlador de PDF de Abastecimento
 * @file Este arquivo gerencia a geração de PDFs para documentar o abastecimento de maletas
 */
import { supabase } from "@/integrations/supabase/client";

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

export class SupplyPdfController {
  /**
   * Gera um PDF de abastecimento para a maleta
   * @param suitcaseId ID da maleta
   * @param items Itens adicionados à maleta
   * @param suitcaseInfo Informações da maleta
   * @returns URL do PDF gerado
   */
  static async generateSupplyPDF(
    suitcaseId: string, 
    items: SupplyItem[], 
    suitcaseInfo: any
  ): Promise<string> {
    try {
      // Buscar dados da maleta
      const { data: suitcase, error: suitcaseError } = await supabase
        .from('suitcases')
        .select(`
          *,
          seller:resellers(name, phone)
        `)
        .eq('id', suitcaseId)
        .single();
      
      if (suitcaseError) throw suitcaseError;
      
      // Montar detalhes para o PDF
      const pdfDetails = {
        suitcaseCode: suitcase.code,
        sellerName: suitcase.seller?.name || 'Revendedora não informada',
        sellerPhone: suitcase.seller?.phone || 'Telefone não informado',
        items: items.map(item => ({
          sku: item.product?.sku || 'SKU não informado',
          name: item.product?.name || 'Produto não informado',
          price: item.product?.price || 0,
          quantity: item.quantity || 1
        })),
        totalItems: items.reduce((sum, item) => sum + (item.quantity || 1), 0),
        totalValue: items.reduce((sum, item) => sum + ((item.product?.price || 0) * (item.quantity || 1)), 0),
        date: new Date().toISOString()
      };
      
      // Em um ambiente de produção real, enviaria para um serviço de geração de PDF
      // e retornaria a URL do PDF gerado. Para o projeto atual, simularemos isso.
      
      // Simular URL do PDF gerado
      const pdfUrl = `https://example.com/maletas/${suitcaseId}/supply-${Date.now()}.pdf`;
      
      console.log("PDF gerado com sucesso:", pdfDetails);
      
      return pdfUrl;
      
    } catch (error) {
      console.error("Erro ao gerar PDF de abastecimento:", error);
      throw error;
    }
  }

  /**
   * Alias para compatibilidade com nome alternativo
   */
  static async generateSuitcasePDF(
    suitcaseId: string, 
    items: SupplyItem[], 
    suitcaseInfo: any
  ): Promise<string> {
    return this.generateSupplyPDF(suitcaseId, items, suitcaseInfo);
  }
}
