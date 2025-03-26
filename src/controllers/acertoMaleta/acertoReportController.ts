
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
        // Preparar dados para a tabela
        tableData = await Promise.all(acerto.items_vendidos.map(async (item) => {
          let photoUrl = null;
          try {
            if (item.product?.photo_url) {
              if (typeof item.product.photo_url === 'string') {
                photoUrl = getProductPhotoUrl(item.product.photo_url);
              } else if (Array.isArray(item.product.photo_url) && item.product.photo_url.length > 0) {
                const firstPhoto = item.product.photo_url[0];
                if (firstPhoto && typeof firstPhoto === 'object' && 'photo_url' in firstPhoto) {
                  photoUrl = getProductPhotoUrl(firstPhoto.photo_url);
                }
              }
            }
          } catch (error) {
            console.error("Erro ao processar URL da foto:", error);
          }
          
          let base64Image = '';
          if (photoUrl) {
            try {
              const response = await fetch(photoUrl);
              if (response.ok) {
                const blob = await response.blob();
                base64Image = await this.blobToBase64(blob);
              }
            } catch (error) {
              console.error("Erro ao carregar imagem:", error);
            }
          }
          
          return [
            item.product?.name || 'Produto sem nome',
            item.product?.sku || 'N/A',
            formatCurrency(item.price || 0),
            base64Image // Esta coluna será usada para a imagem, não será mostrada como texto
          ];
        }));
        
        // Adicionar cabeçalho "Itens Vendidos"
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Itens Vendidos", 14, currentY);
        currentY += 5;
        
        // Gerar tabela de itens vendidos
        autoTable(doc, {
          head: [['Produto', 'Código', 'Preço', '']],
          body: tableData,
          startY: currentY,
          theme: 'striped',
          headStyles: { fillColor: [233, 30, 99], textColor: 255 },
          columnStyles: {
            0: { cellWidth: 80 }, // Nome do produto com imagem
            1: { cellWidth: 40 }, // Código
            2: { cellWidth: 30 }  // Preço
          },
          didDrawCell: (data) => {
            // Se for a primeira coluna e não for cabeçalho
            if (data.column.index === 0 && data.row.index >= 0 && data.row.raw) {
              // Verificar se há uma imagem para desenhar
              const imageData = data.row.raw[3]; // A quarta coluna contém a URL da imagem
              if (imageData && typeof imageData === 'string' && imageData.length > 0) {
                try {
                  const imgProps = doc.getImageProperties(imageData);
                  const imgHeight = 10;
                  const imgWidth = (imgProps.width * imgHeight) / imgProps.height;
                  
                  // Desenhar a imagem na célula
                  doc.addImage(
                    imageData, 
                    'JPEG', 
                    data.cell.x + 2, 
                    data.cell.y + 2, 
                    imgWidth, 
                    imgHeight
                  );
                  
                  // Ajustar o posicionamento do texto para dar espaço à imagem
                  if (data.cell.text && Array.isArray(data.cell.text) && data.cell.text.length > 0) {
                    const firstText = data.cell.text[0];
                    
                    if (firstText && typeof firstText === 'object') {
                      const textObject = firstText as { x?: number };
                      
                      if (textObject && textObject.x !== undefined && typeof textObject.x === 'number') {
                        textObject.x = textObject.x + imgWidth + 4;
                      }
                    }
                  }
                } catch (error) {
                  console.error("Erro ao adicionar imagem ao PDF:", error);
                }
              }
            }
          }
        });
        
        currentY = (doc as any).lastAutoTable.finalY + 10;
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
  
  /**
   * Converte um Blob para Base64
   */
  private static blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
