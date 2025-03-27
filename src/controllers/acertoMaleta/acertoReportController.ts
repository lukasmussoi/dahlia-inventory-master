
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
import { PromoterModel } from "@/models/promoterModel";
import { supabase } from "@/integrations/supabase/client";

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
      
      // Buscar informações da promotora se houver reseller_id
      let promoterInfo = null;
      if (acerto.seller?.id) {
        try {
          // Buscar informações da promotora associada à revendedora
          const { data, error } = await supabase
            .from('resellers')
            .select('promoter_id')
            .eq('id', acerto.seller.id)
            .single();
          
          if (!error && data?.promoter_id) {
            const { data: promoter, error: promoterError } = await supabase
              .from('promoters')
              .select('*')
              .eq('id', data.promoter_id)
              .single();
              
            if (!promoterError && promoter) {
              promoterInfo = {
                name: promoter.name,
                phone: promoter.phone || 'Não informado'
              };
            }
          }
        } catch (err) {
          console.error("Erro ao buscar informações da promotora:", err);
          // Continuar sem as informações da promotora
        }
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
      
      let currentY = 30;
      
      doc.text(`Código da Maleta: ${acerto.suitcase?.code || 'N/A'}`, 14, currentY);
      currentY += 5;
      
      doc.text(`Revendedora: ${acerto.seller?.name || 'N/A'}`, 14, currentY);
      currentY += 5;
      
      // Adicionar informações da promotora
      if (promoterInfo) {
        doc.text(`Promotora: ${promoterInfo.name}`, 14, currentY);
        currentY += 5;
        
        doc.text(`Telefone da Promotora: ${promoterInfo.phone}`, 14, currentY);
        currentY += 5;
      }
      
      doc.text(`Data do Acerto: ${acertoDate}`, 14, currentY);
      currentY += 5;
      
      doc.text(`Próximo Acerto: ${nextAcertoDate}`, 14, currentY);
      currentY += 10;
      
      // Tabela de itens vendidos
      if (acerto.items_vendidos && acerto.items_vendidos.length > 0) {
        // Limitar a quantidade de itens por página para evitar PDFs enormes
        const maxItemsPerPage = 20;
        const limitedItems = acerto.items_vendidos.slice(0, maxItemsPerPage);
        
        if (acerto.items_vendidos.length > maxItemsPerPage) {
          console.warn(`Limitando a exibição para ${maxItemsPerPage} de ${acerto.items_vendidos.length} itens vendidos para evitar PDFs muito grandes`);
        }
        
        // Adicionar cabeçalho "Itens Vendidos"
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Itens Vendidos", 14, currentY);
        currentY += 5;
        
        // Calcular o total de vendas corretamente somando todos os itens vendidos
        const totalSales = acerto.items_vendidos.reduce((total, item) => total + (item.price || 0), 0);
        
        // Preparar dados para a tabela
        const itemsData = limitedItems.map((item, index) => {
          return [
            '', // Célula para a imagem que será preenchida no willDrawCell
            item.product?.name || 'Produto sem nome',
            item.product?.sku || 'N/A',
            formatCurrency(item.price || 0)
          ];
        });
        
        // Preparar imagens dos produtos antes de renderizar a tabela
        // Armazenar as URLs das imagens para cada item
        const productImages = await Promise.all(
          limitedItems.map(async (item, index) => {
            const imageUrl = item.product?.photo_url ? getProductPhotoUrl(item.product.photo_url) : '';
            if (!imageUrl) return null;
            
            try {
              const response = await fetch(imageUrl);
              if (!response.ok) return null;
              
              const blob = await response.blob();
              return { 
                index, 
                imageData: await new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.readAsDataURL(blob);
                })
              };
            } catch (error) {
              console.error(`Erro ao carregar imagem: ${error}`);
              return null;
            }
          })
        );
        
        // Filtrar imagens nulas e criar um mapa para acesso rápido
        const imageMap = new Map();
        productImages.forEach(item => {
          if (item) {
            imageMap.set(item.index, item.imageData);
          }
        });
        
        // Gerar tabela de itens vendidos com as imagens
        autoTable(doc, {
          head: [['Foto', 'Produto', 'Código', 'Preço']],
          body: itemsData,
          startY: currentY,
          theme: 'striped',
          headStyles: { fillColor: [233, 30, 99], textColor: 255 },
          columnStyles: {
            0: { cellWidth: 20 },  // Foto
            1: { cellWidth: 70 },  // Nome do produto
            2: { cellWidth: 40 },  // Código
            3: { cellWidth: 40 }   // Preço
          },
          didDrawCell: (data) => {
            // Se for a coluna da foto (índice 0) e não for cabeçalho
            if (data.column.index === 0 && data.section === 'body') {
              const rowIndex = data.row.index;
              const imageData = imageMap.get(rowIndex);
              
              if (imageData) {
                try {
                  // Obter as propriedades da imagem
                  const imgProps = (doc as any).getImageProperties(imageData);
                  
                  // Calcular dimensões mantendo proporção e respeitando o limite de 50px
                  const maxSize = 50;
                  let imgWidth, imgHeight;
                  
                  if (imgProps.width >= imgProps.height) {
                    // Imagem mais larga
                    imgWidth = Math.min(maxSize, imgProps.width);
                    imgHeight = (imgProps.height * imgWidth) / imgProps.width;
                  } else {
                    // Imagem mais alta
                    imgHeight = Math.min(maxSize, imgProps.height);
                    imgWidth = (imgProps.width * imgHeight) / imgProps.height;
                  }
                  
                  // Calcular posição para centralizar na célula
                  const cellX = data.cell.x;
                  const cellY = data.cell.y;
                  const cellWidth = data.cell.width;
                  const cellHeight = data.cell.height;
                  
                  const posX = cellX + (cellWidth - imgWidth) / 2;
                  const posY = cellY + (cellHeight - imgHeight) / 2;
                  
                  // Adicionar a imagem ao PDF
                  doc.addImage(
                    imageData,
                    'PNG',  // Formato da imagem
                    posX,   // Posição X
                    posY,   // Posição Y
                    imgWidth,  // Largura
                    imgHeight  // Altura
                  );
                } catch (err) {
                  console.error("Erro ao desenhar imagem:", err);
                }
              }
            }
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
        
        // Resumo financeiro
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Resumo Financeiro", 14, currentY);
        currentY += 8;
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        
        const commissionRate = acerto.seller?.commission_rate 
          ? `${(acerto.seller.commission_rate * 100).toFixed(0)}%` 
          : '30%';
        
        const commissionAmount = totalSales * (acerto.seller?.commission_rate || 0.3);
        
        doc.text(`Total de Vendas: ${formatCurrency(totalSales)}`, 14, currentY);
        currentY += 5;
        
        doc.text(`Comissão (${commissionRate}): ${formatCurrency(commissionAmount)}`, 14, currentY);
        currentY += 5;
      } else {
        doc.text("Nenhum item vendido neste acerto.", 14, currentY);
        currentY += 10;
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
