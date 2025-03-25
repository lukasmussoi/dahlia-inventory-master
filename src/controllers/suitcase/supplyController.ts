/**
 * Controlador de Abastecimento de Maletas
 * @file Este arquivo controla as operações de abastecimento de maletas
 * @relacionamento Utiliza o ItemOperationsModel e BaseSuitcaseModel para manipular dados
 */
import { supabase } from "@/integrations/supabase/client";
import { SuitcaseItemModel } from "@/models/suitcase/item";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { openPdfInNewTab } from "@/utils/pdfUtils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getProductPhotoUrl } from "@/utils/photoUtils";

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

export class SuitcaseSupplyController {
  /**
   * Busca itens do inventário com base em um termo de pesquisa
   * @param searchTerm Termo para busca
   * @returns Lista de itens do inventário que correspondem à busca
   */
  static async searchInventoryItems(searchTerm: string) {
    try {
      if (!searchTerm || searchTerm.length < 2) return [];

      const { data, error } = await supabase
        .from('inventory')
        .select(`
          id,
          name,
          sku,
          quantity,
          price,
          inventory_photos(photo_url)
        `)
        .or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`)
        .eq('archived', false)
        .gt('quantity', 0)
        .order('name')
        .limit(20);

      if (error) throw error;

      return data.map(item => ({
        ...item,
        photo_url: item.inventory_photos && item.inventory_photos.length > 0
          ? item.inventory_photos[0].photo_url
          : null
      }));
    } catch (error) {
      console.error("Erro ao buscar itens do inventário:", error);
      throw error;
    }
  }

  /**
   * Abastece uma maleta com itens selecionados
   * @param suitcaseId ID da maleta
   * @param items Itens para abastecer a maleta
   * @returns Se a operação foi bem-sucedida
   */
  static async supplySuitcase(suitcaseId: string, items: SupplyItem[]) {
    try {
      if (!suitcaseId) throw new Error("ID da maleta é necessário");
      if (!items || items.length === 0) throw new Error("Nenhum item selecionado para abastecimento");

      const addedItems = [];

      // Adicionar cada item à maleta
      for (const item of items) {
        if (!item.inventory_id) continue;
        
        // Verificar se o item está disponível
        const availability = await SuitcaseItemModel.checkItemAvailability(item.inventory_id);
        
        if (!availability.available) {
          console.warn(`Item ${item.inventory_id} não disponível para abastecimento: ${JSON.stringify(availability)}`);
          continue;
        }
        
        // Verificar se a quantidade solicitada está disponível
        const quantity = item.quantity || 1;
        if (availability.quantity < quantity) {
          console.warn(`Quantidade solicitada (${quantity}) excede disponível (${availability.quantity}) para item ${item.inventory_id}`);
          continue;
        }
        
        // Para cada unidade, adicionar como um item separado
        for (let i = 0; i < quantity; i++) {
          try {
            // Adicionar item à maleta (um por vez)
            const addedItem = await SuitcaseItemModel.addItemToSuitcase({
              suitcase_id: suitcaseId,
              inventory_id: item.inventory_id,
              quantity: 1, // Sempre adicionar com quantidade 1
              status: 'in_possession'
            });
            
            // Adicionar à lista de itens adicionados
            addedItems.push({
              ...addedItem,
              product: item.product
            });
          } catch (error) {
            console.error(`Erro ao adicionar unidade ${i+1} do item ${item.inventory_id} à maleta:`, error);
          }
        }
      }

      return addedItems;
    } catch (error) {
      console.error("Erro ao abastecer maleta:", error);
      throw error;
    }
  }

  /**
   * Gera um PDF de comprovante de abastecimento
   * @param suitcaseId ID da maleta
   * @param items Itens adicionados à maleta
   * @returns URL do PDF gerado
   */
  static async generateSupplyPDF(suitcaseId: string, items: SupplyItem[], suitcaseInfo: any): Promise<string> {
    try {
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
      const pageHeight = doc.internal.pageSize.getHeight();

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
      if (suitcase.seller?.phone) {
        doc.text(`Telefone: ${suitcase.seller.phone}`, 14, 51);
      }

      // Adicionar cidade/bairro
      const locationText = `${suitcase.city || 'Cidade não especificada'}${suitcase.neighborhood ? ', ' + suitcase.neighborhood : ''}`;
      doc.text(`Localização: ${locationText}`, 14, suitcase.seller?.phone ? 59 : 51);
      
      const currentDate = format(new Date(), "dd/MM/yyyy", { locale: ptBR });
      doc.text(`Data do abastecimento: ${currentDate}`, 14, suitcase.seller?.phone ? 67 : 59);
      
      const nextSettlementDate = suitcase.next_settlement_date 
        ? format(new Date(suitcase.next_settlement_date), "dd/MM/yyyy", { locale: ptBR })
        : 'Não definida';
      doc.text(`Data do próximo acerto: ${nextSettlementDate}`, 14, suitcase.seller?.phone ? 75 : 67);

      // Tabela de itens com imagens
      const startY = suitcase.seller?.phone ? 85 : 75;
      const tableData = await this.generateTableData(groupedItems);
      
      autoTable(doc, {
        startY: startY,
        head: [['Produto', 'Código', 'Qtd', 'Preço', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [233, 30, 99], textColor: 255 },
        margin: { top: startY },
        columnStyles: {
          0: { cellWidth: 80 }, // Produto com imagem
          1: { cellWidth: 25 }, // Código
          2: { cellWidth: 15 }, // Quantidade
          3: { cellWidth: 25 }, // Preço
          4: { cellWidth: 25 }  // Total
        },
        didDrawCell: (data) => {
          // Se for a primeira coluna e não for cabeçalho
          if (data.column.index === 0 && data.row.index > 0 && data.row.raw) {
            // Verificar se há uma imagem para desenhar
            const imageData = data.row.raw[5]; // A sexta coluna contém a URL da imagem
            if (imageData && typeof imageData === 'string') {
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

                // Ajustar o texto para não sobrepor a imagem com null-safe checks
                if (data.cell.text && Array.isArray(data.cell.text) && data.cell.text.length > 0) {
                  const firstText = data.cell.text[0];
                  
                  // Adicionar verificações extras de segurança
                  if (firstText && typeof firstText === 'object' && 'x' in firstText) {
                    // Use optional chaining and nullish coalescing to safely modify x
                    (firstText as any).x = ((firstText as any).x ?? 0) + imgWidth + 4;
                  }
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
      doc.text(`Valor total: R$ ${totalValue.toFixed(2)}`, 14, finalY + 8);

      // Espaço para assinatura
      const signatureY = finalY + 30;
      doc.line(14, signatureY, 196, signatureY);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Assinatura da revendedora confirmando o recebimento das peças acima", pageWidth / 2, signatureY + 5, { align: "center" });

      // Converter para Base64
      const pdfBase64 = doc.output('datauristring');
      return pdfBase64;
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
          const blob = await response.blob();
          base64Image = await this.blobToBase64(blob);
        } catch (error) {
          console.error(`Erro ao converter imagem para Base64: ${error}`);
        }
      }
      
      tableData.push([
        product.name || 'Sem nome',
        product.sku || 'N/A',
        quantity.toString(),
        `R$ ${price.toFixed(2)}`,
        `R$ ${total.toFixed(2)}`,
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

  /**
   * Conta o número de itens em uma maleta
   * @param suitcaseId ID da maleta
   * @returns Número de itens
   */
  static async countSuitcaseItems(suitcaseId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('suitcase_items')
        .select('*', { count: 'exact', head: true })
        .eq('suitcase_id', suitcaseId)
        .eq('status', 'in_possession');

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error("Erro ao contar itens da maleta:", error);
      return 0;
    }
  }

  /**
   * Busca dados de contagem de itens para várias maletas
   * @param suitcaseIds IDs das maletas
   * @returns Objeto com contagem de itens por ID de maleta
   */
  static async getSuitcasesItemCounts(suitcaseIds: string[]): Promise<Record<string, number>> {
    try {
      if (!suitcaseIds.length) return {};

      const { data, error } = await supabase
        .from('suitcase_items')
        .select('suitcase_id')
        .in('suitcase_id', suitcaseIds)
        .eq('status', 'in_possession');

      if (error) throw error;

      // Contar itens por maleta
      const counts: Record<string, number> = {};
      suitcaseIds.forEach(id => counts[id] = 0);
      
      data.forEach(item => {
        if (counts[item.suitcase_id] !== undefined) {
          counts[item.suitcase_id]++;
        }
      });

      return counts;
    } catch (error) {
      console.error("Erro ao buscar contagem de itens das maletas:", error);
      return {};
    }
  }
}
