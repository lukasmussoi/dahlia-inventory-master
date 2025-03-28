
/**
 * Controlador para Geração de PDF de Abastecimento
 * @file Este arquivo contém funções para geração de PDFs relacionados ao abastecimento de maletas
 */
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { SupplyItem } from "@/types/suitcase";

export class SupplyPdfController {
  /**
   * Gera um PDF de comprovante de abastecimento de maleta
   * @param suitcaseId ID da maleta
   * @param items Itens adicionados à maleta
   * @param suitcaseInfo Informações da maleta para o cabeçalho
   * @returns URL do PDF gerado
   */
  static async generateSupplyPDF(
    suitcaseId: string, 
    items: SupplyItem[], 
    suitcaseInfo: any
  ): Promise<string> {
    try {
      // Verificar se há itens para incluir no PDF
      if (!items || items.length === 0) {
        throw new Error("Nenhum item para incluir no PDF");
      }

      // Criar instância do PDF
      const doc = new jsPDF();
      
      // Adicionar cabeçalho
      doc.setFontSize(18);
      doc.text("Comprovante de Abastecimento de Maleta", 14, 22);
      
      doc.setFontSize(12);
      doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 32);
      doc.text(`Maleta: ${suitcaseInfo?.code || `#${suitcaseId.substring(0, 8)}`}`, 14, 38);
      
      if (suitcaseInfo?.seller?.name) {
        doc.text(`Revendedora: ${suitcaseInfo.seller.name}`, 14, 44);
      }
      
      // Preparar dados para a tabela
      const tableData = items.map((item, index) => [
        index + 1,
        item.product?.sku || 'N/A',
        item.product?.name || 'Item sem nome',
        item.quantity || 1,
        this.formatMoney(item.product?.price || 0),
        this.formatMoney((item.product?.price || 0) * (item.quantity || 1))
      ]);
      
      // Calcular valor total
      const totalValue = items.reduce((sum, item) => {
        return sum + (item.product?.price || 0) * (item.quantity || 1);
      }, 0);
      
      // Adicionar tabela
      (doc as any).autoTable({
        startY: 50,
        head: [['#', 'Código', 'Produto', 'Qtd', 'Valor Unit.', 'Subtotal']],
        body: tableData,
        foot: [['', '', '', 'Total', '', this.formatMoney(totalValue)]],
        theme: 'grid',
        headStyles: { fillColor: [233, 30, 99], textColor: 255 },
        footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      });
      
      // Adicionar informações adicionais
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.text("Observações:", 14, finalY);
      doc.text("- Este documento é um comprovante de abastecimento da maleta.", 14, finalY + 6);
      doc.text("- Os itens listados estão sob responsabilidade da revendedora.", 14, finalY + 12);
      
      // Adicionar área para assinaturas
      doc.text("_______________________________", 30, finalY + 30);
      doc.text("Assinatura da Revendedora", 42, finalY + 36);
      
      doc.text("_______________________________", 120, finalY + 30);
      doc.text("Assinatura do Responsável", 132, finalY + 36);
      
      // Gerar PDF como blob
      const pdfBlob = doc.output('blob');
      
      // Gerar nome para o arquivo
      const fileName = `abastecimento_maleta_${suitcaseInfo?.code || suitcaseId.substring(0, 8)}_${new Date().toISOString().slice(0, 10)}.pdf`;
      
      // Criar um objeto de arquivo para upload
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      
      // Fazer upload para o Supabase Storage
      const { data, error } = await supabase.storage
        .from('documentos')
        .upload(`maletas/abastecimentos/${fileName}`, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) throw error;
      
      // Obter URL pública do arquivo
      const { data: publicUrl } = supabase.storage
        .from('documentos')
        .getPublicUrl(`maletas/abastecimentos/${fileName}`);
      
      return publicUrl.publicUrl;
    } catch (error) {
      console.error("Erro ao gerar PDF de abastecimento:", error);
      throw error;
    }
  }
  
  /**
   * Gera PDF de uma maleta específica
   * @param suitcaseId ID da maleta
   * @param items Itens da maleta
   * @param suitcase Informações da maleta
   * @returns URL do PDF gerado
   */
  static async generateSuitcasePDF(suitcaseId: string, items: any[], suitcase: any): Promise<string> {
    return this.generateSupplyPDF(suitcaseId, items, suitcase);
  }
  
  /**
   * Formata valores monetários
   * @param value Valor a ser formatado
   * @returns String formatada
   */
  private static formatMoney(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }
}
