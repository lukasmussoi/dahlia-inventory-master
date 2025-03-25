
/**
 * Controlador de Relatórios de Acerto
 * @file Este arquivo contém operações para gerar relatórios e documentos de acertos.
 * @relacionamento Utiliza jsPDF para gerar documentos e AcertoDetailsController para buscar dados.
 */
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { AcertoDetailsController } from "./acertoDetailsController";
import { AcertoFormattingUtils } from "./acertoFormattingUtils";

export class AcertoReportController {
  /**
   * Gera um PDF de recibo para um acerto
   * @param acertoId ID do acerto
   * @returns URL do PDF em formato base64
   */
  static async generateReceiptPDF(acertoId: string): Promise<string> {
    try {
      console.log(`Iniciando geração de PDF para acerto ${acertoId}`);
      
      const acerto = await AcertoDetailsController.getAcertoById(acertoId);
      if (!acerto) {
        console.error("Erro: Acerto não encontrado");
        throw new Error("Acerto não encontrado");
      }
      
      console.log(`Dados do acerto recuperados: ${acerto.id}, itens: ${acerto.items_vendidos?.length || 0}`);
      console.log('Detalhes do acerto:', JSON.stringify({
        maleta: acerto.suitcase?.code,
        revendedora: acerto.seller?.name,
        valor_total: acerto.total_sales,
        data: acerto.settlement_date
      }));
      
      // Buscar informações da promotora, se existir
      let promotora = null;
      if (acerto.seller) {
        const { data: promoterData, error: promoterError } = await supabase
          .from('promoters')
          .select('*')
          .eq('id', acerto.seller.id)
          .maybeSingle();
        
        if (!promoterError && promoterData) {
          promotora = promoterData;
        }
      }
      
      console.log("Criando documento PDF...");
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const titleFontSize = 16;
      const subtitleFontSize = 12;
      const normalFontSize = 10;
      const smallFontSize = 8;
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      
      console.log(`Dimensões do PDF: ${pageWidth}x${pageHeight}mm, margens: ${margin}mm`);
      
      doc.setFontSize(titleFontSize);
      doc.setFont('helvetica', 'bold');
      doc.text("RECIBO DE ACERTO DE MALETA", pageWidth / 2, margin, { align: 'center' });
      
      doc.setFontSize(subtitleFontSize);
      doc.text("INFORMAÇÕES DO ACERTO", margin, margin + 10);
      
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, margin + 12, pageWidth - margin, margin + 12);
      
      doc.setFontSize(normalFontSize);
      doc.setFont('helvetica', 'normal');
      
      let y = margin + 20;
      const lineHeight = 7;
      
      doc.text(`Maleta: ${acerto.suitcase?.code || 'N/A'}`, margin, y);
      doc.text(`Data do Acerto: ${format(new Date(acerto.settlement_date), 'dd/MM/yyyy')}`, pageWidth - margin, y, { align: 'right' });
      y += lineHeight;
      
      doc.text(`Revendedora: ${acerto.seller?.name || 'N/A'}`, margin, y);
      if (promotora) {
        doc.text(`Promotora: ${promotora.name || 'N/A'}`, pageWidth - margin, y, { align: 'right' });
      }
      y += lineHeight;

      const suitcaseCity = acerto.suitcase?.city || '';
      const suitcaseNeighborhood = acerto.suitcase?.neighborhood || '';
      
      if (suitcaseCity || suitcaseNeighborhood) {
        doc.text(`Cidade: ${suitcaseCity}${suitcaseNeighborhood ? `, ${suitcaseNeighborhood}` : ''}`, margin, y);
        y += lineHeight;
      }
      
      if (acerto.next_settlement_date) {
        doc.text(`Próximo Acerto: ${format(new Date(acerto.next_settlement_date), 'dd/MM/yyyy')}`, margin, y);
        y += lineHeight;
      }
      
      y += lineHeight;
      
      doc.setFontSize(subtitleFontSize);
      doc.setFont('helvetica', 'bold');
      doc.text("RESUMO FINANCEIRO", margin, y);
      y += lineHeight;
      
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageWidth - margin, y);
      y += lineHeight;
      
      doc.setFontSize(normalFontSize);
      doc.setFont('helvetica', 'normal');
      
      const formatCurrency = AcertoFormattingUtils.formatCurrency;
      
      doc.text(`Total em Vendas:`, margin, y);
      doc.text(`${formatCurrency(acerto.total_sales)}`, pageWidth - margin, y, { align: 'right' });
      y += lineHeight;
      
      const commissionRate = acerto.seller?.commission_rate || 0.3;
      doc.text(`Comissão (${(commissionRate * 100).toFixed(0)}%):`, margin, y);
      doc.text(`${formatCurrency(acerto.commission_amount)}`, pageWidth - margin, y, { align: 'right' });
      y += lineHeight * 2;
      
      if (acerto.items_vendidos && acerto.items_vendidos.length > 0) {
        doc.setFontSize(subtitleFontSize);
        doc.setFont('helvetica', 'bold');
        doc.text(`ITENS VENDIDOS (${acerto.items_vendidos.length})`, margin, y);
        y += lineHeight;
        
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, y, pageWidth - margin, y);
        y += lineHeight;
        
        const col1Width = contentWidth * 0.15;
        const col2Width = contentWidth * 0.45;
        const col3Width = contentWidth * 0.2;
        const col4Width = contentWidth * 0.2;
        
        doc.text("SKU", margin, y);
        doc.text("Produto", margin + col1Width, y);
        doc.text("Cliente", margin + col1Width + col2Width, y);
        doc.text("Preço", pageWidth - margin, y, { align: 'right' });
        y += lineHeight;
        
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, y - 2, pageWidth - margin, y - 2);
        
        doc.setFontSize(smallFontSize);
        doc.setFont('helvetica', 'normal');
        
        const itemsPerPage = Math.floor((pageHeight - y - margin) / (lineHeight * 1.5));
        let itemsOnCurrentPage = 0;
        
        for (let i = 0; i < acerto.items_vendidos.length; i++) {
          const item = acerto.items_vendidos[i];
          
          if (itemsOnCurrentPage >= itemsPerPage || y + lineHeight > pageHeight - margin) {
            doc.addPage();
            y = margin;
            itemsOnCurrentPage = 0;
            
            doc.setFontSize(smallFontSize);
            doc.setFont('helvetica', 'bold');
            
            doc.text("SKU", margin, y);
            doc.text("Produto", margin + col1Width, y);
            doc.text("Cliente", margin + col1Width + col2Width, y);
            doc.text("Preço", pageWidth - margin, y, { align: 'right' });
            y += lineHeight;
            
            doc.setDrawColor(200, 200, 200);
            doc.line(margin, y - 2, pageWidth - margin, y - 2);
            
            doc.setFontSize(smallFontSize);
            doc.setFont('helvetica', 'normal');
          }
          
          const sku = item.product?.sku || "-";
          const prodName = item.product?.name || "Produto não encontrado";
          const custName = item.customer_name || "-";
          const price = formatCurrency(item.price);
          
          try {
            doc.text(sku, margin, y);
            doc.text(prodName, margin + col1Width, y);
            doc.text(custName, margin + col1Width + col2Width, y);
            doc.text(price, pageWidth - margin, y, { align: 'right' });
          } catch (textError) {
            console.error("Erro ao adicionar texto do item:", textError);
          }
          
          y += lineHeight;
          itemsOnCurrentPage++;
          
          if (i < acerto.items_vendidos.length - 1) {
            doc.setDrawColor(240, 240, 240);
            doc.line(margin, y - 1, pageWidth - margin, y - 1);
          }
        }
      } else {
        doc.setFontSize(normalFontSize);
        doc.setFont('helvetica', 'italic');
        doc.text("Nenhum item vendido neste acerto.", margin, y);
        y += lineHeight * 2;
      }
      
      y += lineHeight * 3;
      
      if (y + lineHeight * 6 > pageHeight) {
        doc.addPage();
        y = margin;
      }
      
      doc.setFontSize(normalFontSize);
      
      const signatureWidth = contentWidth / 2 - 10;
      
      try {
        doc.line(margin, y + lineHeight, margin + signatureWidth, y + lineHeight);
        doc.line(margin + contentWidth - signatureWidth, y + lineHeight, pageWidth - margin, y + lineHeight);
        
        doc.setFontSize(smallFontSize);
        doc.text("Revendedora", margin + signatureWidth / 2, y + lineHeight + 5, { align: 'center' });
        doc.text("Empresa", margin + contentWidth - signatureWidth / 2, y + lineHeight + 5, { align: 'center' });
      } catch (signatureError) {
        console.error("Erro ao adicionar linhas de assinatura:", signatureError);
      }
      
      y += lineHeight * 5;
      
      if (y + lineHeight * 6 > pageHeight) {
        doc.addPage();
        y = margin;
      }
      
      doc.setFontSize(subtitleFontSize);
      doc.setFont('helvetica', 'bold');
      doc.text("OBSERVAÇÕES:", margin, y);
      y += lineHeight;
      
      for (let i = 0; i < 3; i++) {
        doc.line(margin, y, pageWidth - margin, y);
        y += lineHeight;
      }
      
      const footerY = pageHeight - margin;
      doc.setFontSize(smallFontSize);
      doc.setFont('helvetica', 'normal');
      doc.text("Dalia Manager - Recibo de Acerto de Maleta", pageWidth / 2, footerY, { align: 'center' });
      
      console.log("Renderização do PDF concluída com sucesso");
      
      try {
        console.log("Gerando string base64 do PDF...");
        const pdfOutput = doc.output('blob');
        
        const pdfDataUri = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          
          reader.onload = () => {
            const result = reader.result as string;
            console.log("PDF base64 gerado:", result.substring(0, 50) + "...");
            resolve(result);
          };
          
          reader.onerror = (e) => {
            console.error("Erro ao ler blob:", e);
            reject(new Error("Falha ao converter PDF para base64"));
          };
          
          reader.readAsDataURL(pdfOutput);
        });
        
        if (!pdfDataUri.startsWith('data:application/pdf;base64,')) {
          console.error("Erro no formato do URI do PDF:", pdfDataUri.substring(0, 30));
          throw new Error("Formato inválido do URI do PDF");
        }
        
        const { error: updateError } = await supabase
          .from('acertos_maleta')
          .update({ receipt_url: pdfDataUri })
          .eq('id', acertoId);
        
        if (updateError) {
          console.error("Erro ao salvar URL do recibo:", updateError);
        }
        
        console.log("URI do PDF gerado e salvo com sucesso");
        return pdfDataUri;
      } catch (uriError) {
        console.error("Erro ao gerar URI do PDF:", uriError);
        throw new Error("Erro ao gerar URI do PDF");
      }
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      throw new Error("Erro ao gerar recibo PDF");
    }
  }
}
