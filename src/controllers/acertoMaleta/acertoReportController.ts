
/**
 * Controlador de Relatórios de Acerto
 * @file Este arquivo contém funções para gerar relatórios e PDF de acertos
 * @relacionamento Utiliza o AcertoDetailsController para obter dados dos acertos
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AcertoDetailsController } from "./acertoDetailsController";
import { formatCurrency } from "@/lib/utils";
import { getProductPhotoUrl } from "@/utils/photoUtils";

export class AcertoReportController {
  /**
   * Gera um PDF com recibo de acerto da maleta
   * @param acertoId ID do acerto
   * @returns URL do PDF gerado
   */
  static async generateReceiptPDF(acertoId: string): Promise<string> {
    try {
      console.log(`Gerando PDF do recibo para acerto ${acertoId}`);
      
      // Buscar detalhes completos do acerto
      const acerto = await AcertoDetailsController.getAcertoById(acertoId);
      
      if (!acerto) {
        throw new Error("Acerto não encontrado");
      }
      
      // Criar o documento PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Título
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Recibo de Acerto de Maleta", pageWidth / 2, 20, { align: "center" });
      
      // Informações do acerto
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      const acertoDate = acerto.settlement_date 
        ? format(new Date(acerto.settlement_date), "dd/MM/yyyy", { locale: ptBR })
        : "N/A";
      
      const nextAcertoDate = acerto.next_settlement_date 
        ? format(new Date(acerto.next_settlement_date), "dd/MM/yyyy", { locale: ptBR })
        : "N/A";
      
      doc.text(`Código da Maleta: ${acerto.suitcase?.code || 'N/A'}`, 14, 30);
      doc.text(`Revendedora: ${acerto.seller?.name || 'N/A'}`, 14, 35);
      doc.text(`Data do Acerto: ${acertoDate}`, 14, 40);
      doc.text(`Próximo Acerto: ${nextAcertoDate}`, 14, 45);
      
      // Tabela de itens vendidos
      let tableData: any = [];
      let currentY = 55;
      
      if (acerto.items_vendidos && acerto.items_vendidos.length > 0) {
        // Limitar a quantidade de itens por página para evitar PDFs enormes
        const maxItemsPerPage = 20;
        const limitedItems = acerto.items_vendidos.slice(0, maxItemsPerPage);
        
        if (acerto.items_vendidos.length > maxItemsPerPage) {
          console.warn(`Limitando a exibição para ${maxItemsPerPage} de ${acerto.items_vendidos.length} itens vendidos para evitar PDFs muito grandes`);
        }
        
        // Preparar dados para a tabela
        tableData = await Promise.all(limitedItems.map(async (item) => {
          // Simplificação: Não carregar imagens para o PDF para evitar problemas
          // Apenas usar texto com as informações dos produtos
          return [
            item.product?.name || 'Produto sem nome',
            item.product?.sku || 'N/A',
            formatCurrency(item.price || 0)
          ];
        }));
        
        // Adicionar cabeçalho "Itens Vendidos"
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Itens Vendidos", 14, currentY);
        currentY += 5;
        
        // Gerar tabela de itens vendidos sem imagens
        autoTable(doc, {
          head: [['Produto', 'Código', 'Preço']],
          body: tableData,
          startY: currentY,
          theme: 'striped',
          headStyles: { fillColor: [233, 30, 99], textColor: 255 },
          columnStyles: {
            0: { cellWidth: 90 }, // Nome do produto
            1: { cellWidth: 50 }, // Código
            2: { cellWidth: 40 }  // Preço
          }
        });
        
        currentY = (doc as any).lastAutoTable.finalY + 10;
        
        // Se tivermos muitos itens, adicionar nota sobre itens não exibidos
        if (acerto.items_vendidos.length > maxItemsPerPage) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(8);
          doc.text(`* Exibindo ${maxItemsPerPage} de ${acerto.items_vendidos.length} itens vendidos.`, 14, currentY);
          currentY += 5;
        }
      } else {
        doc.text("Nenhum item vendido neste acerto.", 14, currentY);
        currentY += 10;
      }
      
      // Resumo financeiro
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Resumo Financeiro", 14, currentY);
      currentY += 8;
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Total de Vendas: ${formatCurrency(acerto.total_sales || 0)}`, 14, currentY);
      currentY += 5;
      
      const commissionRate = acerto.seller?.commission_rate 
        ? `${(acerto.seller.commission_rate * 100).toFixed(0)}%` 
        : '30%';
      
      doc.text(`Comissão (${commissionRate}): ${formatCurrency(acerto.commission_amount || 0)}`, 14, currentY);
      currentY += 5;
      
      if (acerto.total_cost !== undefined && acerto.total_cost !== null) {
        doc.text(`Custo Total: ${formatCurrency(acerto.total_cost)}`, 14, currentY);
        currentY += 5;
      }
      
      if (acerto.net_profit !== undefined && acerto.net_profit !== null) {
        doc.text(`Lucro Líquido: ${formatCurrency(acerto.net_profit)}`, 14, currentY);
        currentY += 5;
      }
      
      // Assinaturas
      currentY += 20;
      doc.line(20, currentY, 90, currentY);
      doc.line(120, currentY, 190, currentY);
      currentY += 5;
      
      doc.setFontSize(8);
      doc.text("Assinatura da Revendedora", 55, currentY, { align: "center" });
      doc.text("Assinatura da Empresa", 155, currentY, { align: "center" });
      
      // Rodapé
      const currentDate = format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR });
      doc.setFontSize(8);
      doc.text(`Gerado em: ${currentDate}`, pageWidth - 15, doc.internal.pageSize.getHeight() - 10, { align: "right" });
      
      // Gerar PDF como URL de Blob
      console.log("Gerando URL do blob do PDF...");
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      
      console.log("URL do blob gerada:", blobUrl);
      return blobUrl;
    } catch (error) {
      console.error("Erro ao gerar PDF do recibo de acerto:", error);
      throw new Error("Falha ao gerar PDF de recibo");
    }
  }
}
