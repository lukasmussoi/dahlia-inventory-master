import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Função para formatar a data no padrão brasileiro
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

// Função para formatar a data e hora no padrão brasileiro
function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

// Função para formatar valores monetários no padrão brasileiro
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'in_use': 'Em Uso',
    'returned': 'Devolvida',
    'in_replenishment': 'Em Reposição',
    'in_possession': 'Em Posse',
    'sold': 'Vendido',
    'reserved': 'Reservado',
    'available': 'Disponível',
    'lost': 'Perdido'
  };
  
  return statusMap[status] || status;
}

export function generateAcertoReceipt(acerto: any): string {
  try {
    const doc = new jsPDF('portrait', 'pt', 'a4');
    
    // Definir estilos
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    
    // Adicionar título
    doc.text('Recibo de Acerto de Maleta', 40, 40);
    
    // Adicionar informações do acerto
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Código da Maleta: ${acerto.suitcase?.code || 'N/A'}`, 40, 70);
    doc.text(`Revendedora: ${acerto.seller?.name || 'N/A'}`, 40, 90);
    doc.text(`Data do Acerto: ${formatDate(acerto.settlement_date)}`, 40, 110);
    doc.text(`Próximo Acerto: ${formatDate(acerto.next_settlement_date)}`, 40, 130);
    
    // Adicionar tabela de itens vendidos
    const tableColumn = ["SKU", "Produto", "Preço", "Comissão"];
    const tableRows: any[] = [];
    
    acerto.items_vendidos.forEach(item => {
      const productData = [
        item.product?.sku || 'N/A',
        item.product?.name || 'N/A',
        formatCurrency(item.price),
        formatCurrency(item.commission_value || 0)
      ];
      tableRows.push(productData);
    });
    
    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 160,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [220, 50, 117] }
    });
    
    // Adicionar totais
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total de Vendas: ${formatCurrency(acerto.total_sales)}`, 40, finalY);
    doc.text(`Comissão Total: ${formatCurrency(acerto.commission_amount)}`, 40, finalY + 20);
    
    // Adicionar espaço para assinatura
    const signatureY = finalY + 60;
    
    // Linha para assinatura do destinatário
    doc.line(40, signatureY, 280, signatureY);
    doc.text("Assinatura do(a) Revendedor(a)", 40, signatureY + 15);
    
    // Linha para assinatura da empresa
    doc.line(320, signatureY, 560, signatureY);
    doc.text("Assinatura da Empresa", 320, signatureY + 15);
    
    // Informações adicionais
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("*Este documento serve como comprovante de acerto dos itens relacionados.", 40, signatureY + 50);
    
    // Rodapé
    const pageCount = doc.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Recibo gerado em ${formatDateTime(new Date().toISOString())}`,
        40, 
        doc.internal.pageSize.height - 20
      );
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.width - 80, 
        doc.internal.pageSize.height - 20
      );
    }
    
    // Salvar o PDF
    const pdfOutput = doc.output('datauristring');
    return pdfOutput;
  } catch (error) {
    console.error("Erro ao gerar recibo:", error);
    throw new Error("Erro ao gerar recibo de acerto");
  }
}

export function generateSuitcaseReport(suitcase: any, items: any[]): string {
  try {
    const doc = new jsPDF('portrait', 'pt', 'a4');
    
    // Definir estilos
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    
    // Adicionar título
    doc.text('Relatório de Maleta', 40, 40);
    
    // Adicionar informações da maleta
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Código: ${suitcase.code || 'N/A'}`, 40, 70);
    doc.text(`Revendedora: ${suitcase.seller?.name || 'N/A'}`, 40, 90);
    doc.text(`Status: ${formatStatus(suitcase.status)}`, 40, 110);
    doc.text(`Data: ${formatDate(new Date().toISOString())}`, 40, 130);
    
    if (suitcase.next_settlement_date) {
      doc.text(`Próximo Acerto: ${formatDate(suitcase.next_settlement_date)}`, 40, 150);
    }
    
    // Adicionar tabela de itens
    const tableColumn = ["SKU", "Produto", "Preço", "Quantidade"];
    const tableRows: any[] = [];
    
    items.forEach(item => {
      const productData = [
        item.product?.sku || 'N/A',
        item.product?.name || 'N/A',
        formatCurrency(item.product?.price || 0),
        item.quantity || 1
      ];
      tableRows.push(productData);
    });
    
    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 180,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [220, 50, 117] }
    });
    
    // Adicionar espaço para assinatura
    const finalY = (doc as any).lastAutoTable.finalY + 50;
    
    // Linha para assinatura do destinatário
    doc.line(40, finalY, 280, finalY);
    doc.text("Assinatura do(a) Revendedor(a)", 40, finalY + 15);
    
    // Linha para assinatura da empresa
    doc.line(320, finalY, 560, finalY);
    doc.text("Assinatura da Empresa", 320, finalY + 15);
    
    // Texto de confirmação
    doc.setFontSize(10);
    doc.text("Confirmo que recebi todas as peças listadas neste relatório.", 40, finalY + 40);
    doc.text(`Data: ${formatDate(new Date().toISOString())}`, 40, finalY + 60);
    
    // Informações adicionais
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("*Este documento serve como comprovante de entrega dos itens relacionados.", 40, finalY + 90);
    
    // Rodapé
    const pageCount = doc.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Relatório gerado em ${formatDateTime(new Date().toISOString())}`,
        40, 
        doc.internal.pageSize.height - 20
      );
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.width - 80, 
        doc.internal.pageSize.height - 20
      );
    }
    
    // Salvar o PDF
    const pdfOutput = doc.output('datauristring');
    return pdfOutput;
  } catch (error) {
    console.error("Erro ao gerar relatório:", error);
    throw new Error("Erro ao gerar relatório da maleta");
  }
}
