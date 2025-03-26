
/**
 * Controlador de Geração de PDF de Abastecimento
 * @file Este arquivo controla a geração de PDFs de abastecimento de maletas
 * @relacionamento Utiliza o SupplyItemController para processar dados
 */
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getProductPhotoUrl } from "@/utils/photoUtils";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";

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
   * Gera um PDF de comprovante de abastecimento
   * @param suitcaseId ID da maleta
   * @param items Itens adicionados à maleta
   * @returns URL do PDF gerado
   */
  static async generateSupplyPDF(suitcaseId: string, items: SupplyItem[], suitcaseInfo: any): Promise<string> {
    try {
      console.log(`Iniciando geração de PDF de abastecimento para maleta ${suitcaseId}`);
      
      // Buscar informações da maleta se não fornecidas
      let suitcase = suitcaseInfo;
      if (!suitcase) {
        const { data, error } = await supabase
          .from('suitcases')
          .select(`
            *,
            seller:resellers(id, name, phone, commission_rate, address)
          `)
          .eq('id', suitcaseId)
          .single();

        if (error) throw error;
        suitcase = data;
      }

      // Verificar se a maleta existe
      if (!suitcase) {
        throw new Error("Maleta não encontrada");
      }

      // Calcular total de peças e valor
      const totalItems = items.reduce((total, item) => total + (item.quantity || 1), 0);
      const totalValue = items.reduce((total, item) => {
        const price = item.product?.price || 0;
        const quantity = item.quantity || 1;
        return total + (price * quantity);
      }, 0);

      // Agrupar itens idênticos
      const groupedItems = this.groupItems(items);

      // Criar o PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Título
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Comprovante de Abastecimento da Maleta", pageWidth / 2, 20, { align: "center" });

      // Informações da maleta
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Código: ${suitcase.code || `#${suitcase.id.substring(0, 8)}`}`, 14, 35);
      doc.text(`Revendedora: ${suitcase.seller?.name || 'Não especificado'}`, 14, 43);
      
      // Adicionar telefone se disponível
      let currentY = 51;
      if (suitcase.seller?.phone) {
        doc.text(`Telefone: ${suitcase.seller.phone}`, 14, currentY);
        currentY += 8;
      }

      // Adicionar cidade/bairro
      const locationText = `${suitcase.city || 'Cidade não especificada'}${suitcase.neighborhood ? ', ' + suitcase.neighborhood : ''}`;
      doc.text(`Localização: ${locationText}`, 14, currentY);
      currentY += 8;
      
      const currentDate = format(new Date(), "dd/MM/yyyy", { locale: ptBR });
      doc.text(`Data do abastecimento: ${currentDate}`, 14, currentY);
      currentY += 8;
      
      const nextSettlementDate = suitcase.next_settlement_date 
        ? format(new Date(suitcase.next_settlement_date), "dd/MM/yyyy", { locale: ptBR })
        : 'Não definida';
      doc.text(`Data do próximo acerto: ${nextSettlementDate}`, 14, currentY);
      currentY += 10;

      // Tabela de itens com imagens
      const tableData = await this.generateTableData(groupedItems);
      
      autoTable(doc, {
        startY: currentY,
        head: [['Produto', 'Código', 'Qtd', 'Preço', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [233, 30, 99], textColor: 255 },
        margin: { top: currentY },
        columnStyles: {
          0: { cellWidth: 80 }, // Produto com imagem
          1: { cellWidth: 25 }, // Código
          2: { cellWidth: 15 }, // Quantidade
          3: { cellWidth: 25 }, // Preço
          4: { cellWidth: 25 }  // Total
        },
        didDrawCell: (data) => {
          // Se for a primeira coluna e não for cabeçalho
          if (data.column.index === 0 && data.row.index >= 0 && data.row.raw) {
            // Verificar se há uma imagem para desenhar
            const imageData = data.row.raw[5]; // A sexta coluna contém a URL da imagem
            if (imageData && typeof imageData === 'string' && imageData.length > 0) {
              try {
                const imgProps = doc.getImageProperties(imageData);
                
                // Definir tamanho máximo para a imagem (40px como solicitado)
                const maxImgWidth = 12; // 12mm é aproximadamente 40px
                const imgHeight = 10;
                const imgWidth = Math.min(maxImgWidth, (imgProps.width * imgHeight) / imgProps.height);
                
                // Desenhar a imagem no início da célula
                const imgX = data.cell.x + 2;
                const imgY = data.cell.y + 2;
                
                doc.addImage(
                  imageData, 
                  'JPEG', 
                  imgX, 
                  imgY, 
                  imgWidth, 
                  imgHeight
                );

                // Mover o texto para a direita da imagem (com espaçamento)
                const textPadding = imgWidth + 4; // 4mm de espaço entre imagem e texto
                
                // Verificações de segurança para texto
                if (data.cell.text && Array.isArray(data.cell.text) && data.cell.text.length > 0) {
                  // Percorrer todas as linhas de texto na célula
                  data.cell.text.forEach((textLine) => {
                    if (textLine && typeof textLine === 'object') {
                      // Verificar explicitamente se x existe e é um número
                      if ('x' in textLine && typeof textLine.x === 'number') {
                        // Deslocar o texto para a direita da imagem
                        textLine.x = imgX + textPadding;
                      }
                    }
                  });
                }
              } catch (error) {
                console.error("Erro ao adicionar imagem ao PDF:", error);
              }
            }
          }
        }
      });

      // Total
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFont("helvetica", "bold");
      doc.text(`Total de peças: ${totalItems}`, 14, finalY);
      doc.text(`Valor total: ${formatCurrency(totalValue)}`, 14, finalY + 8);

      // Espaço para assinatura
      const signatureY = finalY + 30;
      doc.line(14, signatureY, 196, signatureY);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Assinatura da revendedora confirmando o recebimento das peças acima", pageWidth / 2, signatureY + 5, { align: "center" });

      // Retornar o PDF como URL de Blob
      console.log("Gerando blob do PDF de abastecimento...");
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      console.log("URL do blob do PDF gerada:", blobUrl);
      
      return blobUrl;
    } catch (error) {
      console.error("Erro ao gerar PDF de abastecimento:", error);
      throw error;
    }
  }

  /**
   * Agrupa itens idênticos para o PDF
   */
  private static groupItems(items: SupplyItem[]) {
    const groupedMap = new Map();
    
    items.forEach(item => {
      const key = item.inventory_id;
      if (groupedMap.has(key)) {
        const existing = groupedMap.get(key);
        existing.quantity += item.quantity || 1;
      } else {
        groupedMap.set(key, {
          ...item,
          quantity: item.quantity || 1
        });
      }
    });
    
    return Array.from(groupedMap.values());
  }

  /**
   * Gera os dados da tabela para o PDF
   */
  private static async generateTableData(items: SupplyItem[]) {
    const tableData = [];
    
    for (const item of items) {
      const product = item.product;
      if (!product) continue;
      
      const price = product.price || 0;
      const quantity = item.quantity || 1;
      const total = price * quantity;
      
      // Buscar URL da imagem
      let imageUrl = getProductPhotoUrl(product.photo_url);
      let base64Image = '';
      
      // Converter imagem para Base64 se existir
      if (imageUrl) {
        try {
          const response = await fetch(imageUrl);
          if (!response.ok) {
            console.error(`Erro ao buscar imagem: ${response.status} ${response.statusText}`);
            // Continuar sem a imagem se não conseguir carregar
          } else {
            const blob = await response.blob();
            base64Image = await this.blobToBase64(blob);
          }
        } catch (error) {
          console.error(`Erro ao converter imagem para Base64: ${error}`);
          // Continuar sem a imagem em caso de erro
        }
      }
      
      tableData.push([
        product.name || 'Sem nome',
        product.sku || 'N/A',
        quantity.toString(),
        formatCurrency(price),
        formatCurrency(total),
        base64Image // Esta coluna será usada para a imagem, não será mostrada como texto
      ]);
    }
    
    return tableData;
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
