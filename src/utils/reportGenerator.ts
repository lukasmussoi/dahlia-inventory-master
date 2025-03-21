
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { SuitcaseItem, Suitcase, Acerto } from "@/types/suitcase";
import { formatCurrency } from "@/utils/formatters";
import { getProductPhotoUrl } from "@/utils/photoUtils";

/**
 * Gera um relatório PDF do abastecimento da maleta
 * @param suitcase Dados da maleta
 * @param items Itens da maleta
 * @returns URL do arquivo PDF gerado
 */
export const generateSuitcaseReport = (suitcase: Suitcase, items: SuitcaseItem[]): string => {
  try {
    const doc = new jsPDF();
    
    // Cabeçalho do relatório
    doc.setFontSize(18);
    doc.text("Relatório de Abastecimento de Maleta", 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Código da Maleta: ${suitcase.code}`, 14, 32);
    doc.text(`Revendedora: ${suitcase.seller?.name || "Não informado"}`, 14, 40);
    
    if (suitcase.seller?.address) {
      const address = typeof suitcase.seller.address === 'string' 
        ? suitcase.seller.address 
        : `${suitcase.city || ""}, ${suitcase.neighborhood || ""}`;
      doc.text(`Endereço: ${address}`, 14, 48);
    }
    
    const formattedDate = new Date().toLocaleDateString('pt-BR');
    doc.text(`Data do Abastecimento: ${formattedDate}`, 14, 56);
    
    if (suitcase.next_settlement_date) {
      const nextSettlementDate = new Date(suitcase.next_settlement_date).toLocaleDateString('pt-BR');
      doc.text(`Data do Próximo Acerto: ${nextSettlementDate}`, 14, 64);
    }
    
    // Tabela de itens
    const tableData = items.map(item => [
      item.product?.name || "Produto sem nome",
      item.product?.sku || "Sem SKU",
      formatCurrency(item.product?.price || 0),
      item.quantity || 1
    ]);
    
    autoTable(doc, {
      head: [["Produto", "SKU", "Preço", "Qtd"]],
      body: tableData,
      startY: 72,
      theme: 'striped',
      headStyles: { fillColor: [233, 30, 99] }
    });
    
    // Resumo final
    const totalItems = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const totalValue = items.reduce((sum, item) => sum + ((item.product?.price || 0) * (item.quantity || 1)), 0);
    
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.text(`Total de Itens: ${totalItems}`, 14, finalY);
    doc.text(`Valor Total da Maleta: ${formatCurrency(totalValue)}`, 14, finalY + 8);
    
    // Espaço para assinatura
    doc.text("Assinatura da Revendedora:", 14, finalY + 25);
    doc.line(14, finalY + 40, 100, finalY + 40); // Linha para assinatura
    
    doc.text("Confirmo o recebimento de todos os itens listados neste relatório.", 14, finalY + 45);
    
    // Rodapé
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(
        `Página ${i} de ${pageCount} - Gerado em ${new Date().toLocaleString('pt-BR')}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }
    
    // Gerar URL do arquivo
    const pdfBlob = doc.output("blob");
    return URL.createObjectURL(pdfBlob);
  } catch (error) {
    console.error("Erro ao gerar relatório da maleta:", error);
    throw new Error("Erro ao gerar relatório da maleta");
  }
};

/**
 * Gera um recibo PDF do acerto da maleta
 * @param acerto Dados do acerto
 * @returns URL do arquivo PDF gerado
 */
export const generateAcertoReceipt = (acerto: Acerto): string => {
  try {
    const doc = new jsPDF();
    
    // Cabeçalho do recibo
    doc.setFontSize(18);
    doc.text("Recibo de Acerto de Maleta", 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Código da Maleta: ${acerto.suitcase?.code || "Não informado"}`, 14, 32);
    doc.text(`Revendedora: ${acerto.seller?.name || "Não informado"}`, 14, 40);
    
    const formattedDate = new Date(acerto.settlement_date).toLocaleDateString('pt-BR');
    doc.text(`Data do Acerto: ${formattedDate}`, 14, 48);
    
    // Tabela de itens vendidos
    if (acerto.items_vendidos && acerto.items_vendidos.length > 0) {
      const tableData = acerto.items_vendidos.map(item => [
        item.product?.name || "Produto sem nome",
        item.product?.sku || "Sem SKU",
        formatCurrency(item.price || 0),
        formatCurrency(item.commission_value || 0),
        formatCurrency(item.net_profit || 0)
      ]);
      
      autoTable(doc, {
        head: [["Produto", "SKU", "Preço", "Comissão", "Lucro"]],
        body: tableData,
        startY: 56,
        theme: 'striped',
        headStyles: { fillColor: [233, 30, 99] }
      });
      
      // Resumo final
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      
      doc.text(`Total em Vendas: ${formatCurrency(acerto.total_sales || 0)}`, 14, finalY);
      doc.text(`Comissão da Revendedora (${(acerto.seller?.commission_rate || 0.3) * 100}%): ${formatCurrency(acerto.commission_amount || 0)}`, 14, finalY + 8);
      doc.text(`Lucro Líquido: ${formatCurrency(acerto.net_profit || 0)}`, 14, finalY + 16);
      
      // Espaço para assinatura
      doc.text("Assinatura da Revendedora:", 14, finalY + 35);
      doc.line(14, finalY + 45, 100, finalY + 45); // Linha para assinatura
      
      doc.text("Confirmo o recebimento da comissão e devolução dos itens restantes.", 14, finalY + 52);
      
      // Rodapé
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(
          `Página ${i} de ${pageCount} - Gerado em ${new Date().toLocaleString('pt-BR')}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
      }
    } else {
      doc.text("Nenhum item vendido neste acerto.", 14, 56);
    }
    
    // Gerar URL do arquivo
    const pdfBlob = doc.output("blob");
    return URL.createObjectURL(pdfBlob);
  } catch (error) {
    console.error("Erro ao gerar recibo do acerto:", error);
    throw new Error("Erro ao gerar recibo do acerto");
  }
};
