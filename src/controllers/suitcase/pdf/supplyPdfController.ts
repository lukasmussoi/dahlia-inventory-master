
/**
 * Controlador de Geração de PDF para Abastecimento de Maletas
 * @file Este arquivo coordena a geração de PDFs de abastecimento de maletas
 */
import { jsPDF } from "jspdf";
import 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PdfItem {
  inventory_id: string;
  quantity?: number;
  product?: {
    id: string;
    name: string;
    sku: string;
    price: number;
  };
}

export class SupplyPdfController {
  /**
   * Gera um PDF para uma maleta com os itens abastecidos
   * @param suitcaseId ID da maleta
   * @param items Itens abastecidos
   * @param suitcaseInfo Informações da maleta
   * @returns URL do PDF gerado
   */
  static async generateSuitcasePDF(
    suitcaseId: string, 
    items: PdfItem[], 
    suitcaseInfo: any
  ): Promise<string> {
    try {
      // Criar novo documento PDF
      const doc = new jsPDF();
      
      // Adicionar cabeçalho
      doc.setFontSize(20);
      doc.text("Comprovante de Abastecimento de Maleta", 105, 20, { align: "center" });
      
      doc.setFontSize(12);
      doc.text(`Data: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 20, 30);
      doc.text(`Código da Maleta: ${suitcaseInfo?.code || 'N/A'}`, 20, 40);
      
      if (suitcaseInfo?.seller?.name) {
        doc.text(`Revendedora: ${suitcaseInfo.seller.name}`, 20, 50);
      }
      
      // Listar itens abastecidos
      const tableColumn = ["Item", "SKU", "Preço", "Quantidade"];
      const tableRows: any[] = [];
      
      // Preparar linhas da tabela
      items.forEach(item => {
        if (!item.product) return;
        
        const productName = item.product.name || 'Item sem nome';
        const sku = item.product.sku || 'Sem SKU';
        const price = item.product.price 
          ? `R$ ${item.product.price.toFixed(2)}`.replace('.', ',') 
          : 'N/A';
        const quantity = item.quantity || 1;
        
        tableRows.push([productName, sku, price, quantity]);
      });
      
      // Adicionar tabela ao PDF
      (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 60,
        theme: 'striped',
        headStyles: { fillColor: [233, 30, 99], textColor: 255 },
        margin: { top: 20 }
      });
      
      // Adicionar informações finais
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.text(`Total de Itens: ${items.length}`, 20, finalY);
      
      // Campos para assinaturas
      doc.text('Assinatura da Revendedora:', 20, finalY + 30);
      doc.line(20, finalY + 35, 100, finalY + 35);
      
      doc.text('Assinatura da Administração:', 120, finalY + 30);
      doc.line(120, finalY + 35, 190, finalY + 35);
      
      // Gerar o PDF como blob URL
      const pdfOutput = doc.output('datauristring');
      return pdfOutput;
    } catch (error) {
      console.error("Erro ao gerar PDF da maleta:", error);
      return '';
    }
  }
}
