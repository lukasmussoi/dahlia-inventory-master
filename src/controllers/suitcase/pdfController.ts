
/**
 * Controlador para Geração de PDFs relacionados a Maletas
 * @file Este arquivo gerencia a geração de PDFs para maletas
 */
import { supabase } from "@/integrations/supabase/client";
import { Suitcase, SuitcaseItem } from "@/types/suitcase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatMoney } from "@/utils/formatUtils";
import { getProductPhotoUrl } from "@/utils/photoUtils";

export const PdfController = {
  async generateSuitcasePDF(suitcaseId: string, suitcase: Suitcase, items: SuitcaseItem[] | any[]): Promise<string> {
    try {
      console.log("Gerando PDF para maleta:", suitcaseId);
      
      // Criar novo documento PDF
      const doc = new jsPDF();
      
      // Adicionar cabeçalho
      doc.setFontSize(20);
      doc.text("Relatório de Maleta", 105, 20, { align: "center" });
      
      // Adicionar informações da maleta
      doc.setFontSize(12);
      doc.text(`Código: ${suitcase.code || suitcaseId.substring(0, 8)}`, 20, 40);
      if (suitcase.seller) {
        doc.text(`Revendedora: ${suitcase.seller.name}`, 20, 50);
      }
      if (suitcase.city) {
        doc.text(`Cidade: ${suitcase.city}`, 20, 60);
      }
      
      // Preparar dados para a tabela
      const tableData = items.map((item) => {
        const photo = item.product?.photo_url 
          ? (typeof item.product.photo_url === 'string' 
              ? item.product.photo_url 
              : item.product.photo_url[0]?.photo_url || '')
          : '';
              
        return [
          item.product?.sku || 'N/A',
          item.product?.name || 'Item sem nome',
          item.quantity || 1,
          formatMoney(item.product?.price || 0),
          formatMoney((item.product?.price || 0) * (item.quantity || 1))
        ];
      });
      
      // Adicionar tabela de itens
      autoTable(doc, {
        head: [['Código', 'Produto', 'Quantidade', 'Valor Unit.', 'Valor Total']],
        body: tableData,
        startY: 70,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [233, 30, 99] }
      });
      
      // Adicionar valor total
      const totalValue = items.reduce((total, item) => {
        return total + ((item.product?.price || 0) * (item.quantity || 1));
      }, 0);
      
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.text(`Valor Total: ${formatMoney(totalValue)}`, 20, finalY);
      
      // Adicionar data de emissão
      const dataEmissao = new Date().toLocaleDateString('pt-BR');
      doc.text(`Data de Emissão: ${dataEmissao}`, 20, finalY + 10);
      
      // Salvar PDF no armazenamento do navegador temporariamente
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      return pdfUrl;
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      throw error;
    }
  },
  
  // Alias para manter compatibilidade
  generateSupplyPDF: function(suitcaseId: string, suitcase: Suitcase, items: any[]): Promise<string> {
    return this.generateSuitcasePDF(suitcaseId, suitcase, items);
  }
};

export default PdfController;
