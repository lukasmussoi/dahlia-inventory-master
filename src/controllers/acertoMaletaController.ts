import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Acerto, AcertoItem, SuitcaseSettlementFormData, PhotoUrl } from "@/types/suitcase";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { SuitcaseController } from "./suitcaseController";
import { getProductPhotoUrl } from "@/utils/photoUtils";
import { AcertoMaletaModel } from "@/models/acertoMaletaModel";
import { SuitcaseModel } from "@/models/suitcaseModel";

export const acertoMaletaController = {
  async getAllAcertos(filters?: any) {
    try {
      let query = supabase
        .from('acertos_maleta')
        .select(`
          *,
          suitcase:suitcases(*),
          seller:resellers(*)
        `)
        .order('settlement_date', { ascending: false });

      if (filters) {
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        if (filters.seller_id) {
          query = query.eq('seller_id', filters.seller_id);
        }
        if (filters.dateFrom) {
          query = query.gte('settlement_date', filters.dateFrom);
        }
        if (filters.dateTo) {
          query = query.lte('settlement_date', filters.dateTo);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Erro ao buscar acertos:", error);
      throw new Error("Erro ao buscar acertos");
    }
  },

  async getAcertoById(id: string) {
    try {
      const { data, error } = await supabase
        .from('acertos_maleta')
        .select(`
          *,
          suitcase:suitcases(*, seller:resellers(*)),
          seller:resellers(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      const { data: itemsVendidos, error: itemsError } = await supabase
        .from('acerto_itens_vendidos')
        .select(`
          *,
          product:inventory(id, name, sku, price, photo_url:inventory_photos(photo_url))
        `)
        .eq('acerto_id', id);
      
      if (itemsError) throw itemsError;
      
      const itemsVendidosProcessados = itemsVendidos?.map(item => {
        let product = item.product;
        if (product && Array.isArray(product.photo_url) && product.photo_url.length > 0) {
          product = {
            ...product,
            photo_url: product.photo_url
          };
        }
        return {
          ...item,
          product
        };
      });
      
      return {
        ...data,
        items_vendidos: itemsVendidosProcessados || []
      };
    } catch (error) {
      console.error("Erro ao buscar detalhes do acerto:", error);
      throw new Error("Erro ao buscar detalhes do acerto");
    }
  },

  async getAcertosBySuitcase(suitcaseId: string) {
    try {
      const { data: acertos, error } = await supabase
        .from('acertos_maleta')
        .select(`
          *,
          suitcase:suitcases(*, seller:resellers(*)),
          seller:resellers(*)
        `)
        .eq('suitcase_id', suitcaseId)
        .order('settlement_date', { ascending: false });

      if (error) throw error;
      
      const acertosCompletos = await Promise.all(
        (acertos || []).map(async (acerto) => {
          const { data: itemsVendidos, error: itemsError } = await supabase
            .from('acerto_itens_vendidos')
            .select(`
              *,
              product:inventory(id, name, sku, price, photo_url:inventory_photos(photo_url))
            `)
            .eq('acerto_id', acerto.id);
          
          if (itemsError) throw itemsError;
          
          const itemsVendidosProcessados = itemsVendidos?.map(item => {
            let product = item.product;
            if (product && Array.isArray(product.photo_url) && product.photo_url.length > 0) {
              product = {
                ...product,
                photo_url: product.photo_url
              };
            }
            return {
              ...item,
              product
            };
          });
          
          return {
            ...acerto,
            items_vendidos: itemsVendidosProcessados || []
          };
        })
      );
      
      return acertosCompletos;
    } catch (error) {
      console.error("Erro ao buscar acertos da maleta:", error);
      throw new Error("Erro ao buscar acertos da maleta");
    }
  },

  async createAcerto(data: SuitcaseSettlementFormData): Promise<Acerto> {
    try {
      const { data: suitcase, error: suitcaseError } = await supabase
        .from('suitcases')
        .select(`
          *,
          seller:resellers(id, name, commission_rate)
        `)
        .eq('id', data.suitcase_id)
        .single();
      
      if (suitcaseError) {
        console.error("Erro ao buscar maleta:", suitcaseError);
        throw new Error("Erro ao buscar maleta para acerto");
      }
      
      const { data: suitcaseItems, error: itemsError } = await supabase
        .from('suitcase_items')
        .select(`
          *,
          product:inventory(id, name, sku, price)
        `)
        .eq('suitcase_id', data.suitcase_id)
        .eq('status', 'in_possession')
        .not('id', 'in', `(${data.items_present.join(',')})`);
      
      if (itemsError && data.items_present.length > 0) {
        console.error("Erro ao buscar itens da maleta:", itemsError);
        throw new Error("Erro ao buscar itens da maleta para acerto");
      }
      
      const soldItems = suitcaseItems || [];
      const totalSales = soldItems.reduce((sum, item) => {
        return sum + (item.product?.price || 0);
      }, 0);
      
      const commissionRate = suitcase.seller?.commission_rate || 0.3;
      const commissionAmount = totalSales * commissionRate;
      
      const { data: existingAcerto, error: existingError } = await supabase
        .from('acertos_maleta')
        .select('id')
        .eq('suitcase_id', data.suitcase_id)
        .eq('status', 'pendente');
      
      if (existingError) {
        console.error("Erro ao verificar acerto existente:", existingError);
      }
      
      let acertoId: string;
      
      if (existingAcerto && existingAcerto.length > 0) {
        const { data: updatedAcerto, error: updateError } = await supabase
          .from('acertos_maleta')
          .update({
            settlement_date: new Date(data.settlement_date).toISOString(),
            next_settlement_date: data.next_settlement_date ? new Date(data.next_settlement_date).toISOString() : null,
            total_sales: totalSales,
            commission_amount: commissionAmount,
            status: 'concluido'
          })
          .eq('id', existingAcerto[0].id)
          .select()
          .single();
        
        if (updateError) {
          console.error("Erro ao atualizar acerto:", updateError);
          throw new Error("Erro ao atualizar acerto existente");
        }
        
        acertoId = existingAcerto[0].id;
      } else {
        const { data: newAcerto, error: createError } = await supabase
          .from('acertos_maleta')
          .insert({
            suitcase_id: data.suitcase_id,
            seller_id: data.seller_id,
            settlement_date: new Date(data.settlement_date).toISOString(),
            next_settlement_date: data.next_settlement_date ? new Date(data.next_settlement_date).toISOString() : null,
            total_sales: totalSales,
            commission_amount: commissionAmount,
            status: 'concluido'
          })
          .select()
          .single();
        
        if (createError) {
          console.error("Erro ao criar acerto:", createError);
          throw new Error("Erro ao criar acerto");
        }
        
        acertoId = newAcerto.id;
      }
      
      if (soldItems.length > 0) {
        await Promise.all(soldItems.map(async (item) => {
          const { data: saleInfo, error: saleError } = await supabase
            .from('suitcase_item_sales')
            .select('*')
            .eq('suitcase_item_id', item.id);
          
          if (saleError) {
            console.error(`Erro ao buscar informações de venda para o item ${item.id}:`, saleError);
          }
          
          const { error: updateError } = await supabase
            .from('suitcase_items')
            .update({ status: 'sold' })
            .eq('id', item.id);
          
          if (updateError) {
            console.error(`Erro ao atualizar status do item ${item.id}:`, updateError);
          }
          
          const customerName = saleInfo && saleInfo.length > 0 ? saleInfo[0].customer_name : null;
          const paymentMethod = saleInfo && saleInfo.length > 0 ? saleInfo[0].payment_method : null;
          
          const { error: acertoItemError } = await supabase
            .from('acerto_itens_vendidos')
            .insert({
              acerto_id: acertoId,
              suitcase_item_id: item.id,
              inventory_id: item.inventory_id,
              price: item.product?.price || 0,
              sale_date: new Date().toISOString(),
              customer_name: customerName,
              payment_method: paymentMethod
            });
          
          if (acertoItemError) {
            console.error(`Erro ao registrar item vendido ${item.id} no acerto:`, acertoItemError);
          }
        }));
      }
      
      if (data.next_settlement_date) {
        await supabase
          .from('suitcases')
          .update({ 
            next_settlement_date: new Date(data.next_settlement_date).toISOString() 
          })
          .eq('id', data.suitcase_id);
      }
      
      return await this.getAcertoById(acertoId);
    } catch (error) {
      console.error("Erro ao criar acerto:", error);
      throw error;
    }
  },

  async deleteAcerto(acertoId: string): Promise<boolean> {
    try {
      const { data: isAdmin } = await supabase.rpc('is_admin');
      
      if (!isAdmin) {
        toast.error("Apenas administradores podem excluir acertos");
        return false;
      }
      
      const acerto = await this.getAcertoById(acertoId);
      
      if (!acerto) {
        toast.error("Acerto não encontrado");
        return false;
      }
      
      if (acerto.status === 'concluido' && acerto.items_vendidos && acerto.items_vendidos.length > 0) {
        const suitcaseItemIds = acerto.items_vendidos.map(item => item.suitcase_item_id);
        
        if (suitcaseItemIds.length > 0) {
          const { error: updateError } = await supabase
            .from('suitcase_items')
            .update({ status: 'in_possession' })
            .in('id', suitcaseItemIds);
          
          if (updateError) {
            console.error("Erro ao atualizar status dos itens:", updateError);
            throw new Error("Erro ao restaurar status dos itens da maleta");
          }
        }
      }
      
      await AcertoMaletaModel.deleteAcerto(acertoId);
      
      return true;
    } catch (error: any) {
      console.error("Erro ao excluir acerto:", error);
      throw new Error(error.message || "Erro ao excluir acerto");
    }
  },

  async updateAcertoStatus(acertoId: string, newStatus: 'pendente' | 'concluido'): Promise<Acerto> {
    try {
      const { data, error } = await supabase
        .from('acertos_maleta')
        .update({ status: newStatus })
        .eq('id', acertoId)
        .select()
        .single();
      
      if (error) {
        console.error("Erro ao atualizar status do acerto:", error);
        throw new Error("Erro ao atualizar status do acerto");
      }
      
      return await this.getAcertoById(acertoId);
    } catch (error) {
      console.error("Erro ao atualizar status do acerto:", error);
      throw error;
    }
  },

  async generateReceiptPDF(acertoId: string): Promise<string> {
    try {
      console.log(`Iniciando geração de PDF para acerto ${acertoId}`);
      
      const acerto = await this.getAcertoById(acertoId);
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
      
      const promotora = null;
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
      
      const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
      };
      
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
  },

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  },

  async getItemSalesFrequency(inventoryId: string, resellerId: string) {
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const { data: acertos, error: acertosError } = await supabase
        .from('acertos_maleta')
        .select('id')
        .eq('seller_id', resellerId)
        .gte('settlement_date', ninetyDaysAgo.toISOString());
      
      if (acertosError) throw acertosError;
      
      if (!acertos || acertos.length === 0) {
        return { count: 0, frequency: "baixa" };
      }
      
      const acertoIds = acertos.map(a => a.id);
      
      const { data: vendas, error: vendasError } = await supabase
        .from('acerto_itens_vendidos')
        .select('id')
        .eq('inventory_id', inventoryId)
        .in('acerto_id', acertoIds);
      
      if (vendasError) throw vendasError;
      
      const count = vendas ? vendas.length : 0;
      
      let frequency = "baixa";
      if (count > 5) {
        frequency = "alta";
      } else if (count > 2) {
        frequency = "média";
      }
      
      return { count, frequency };
    } catch (error) {
      console.error("Erro ao verificar frequência de vendas do item:", error);
      throw error;
    }
  },

  async getPopularItems(resellerId: string, limit = 5) {
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);
      
      const { data: acertos, error: acertosError } = await supabase
        .from('acertos_maleta')
        .select('id')
        .eq('seller_id', resellerId)
        .gte('settlement_date', sixMonthsAgo.toISOString());
      
      if (acertosError) throw acertosError;
      
      if (!acertos || acertos.length === 0) {
        return [];
      }
      
      const acertoIds = acertos.map(a => a.id);
      
      const { data: vendas, error: vendasError } = await supabase
        .from('acerto_itens_vendidos')
        .select(`
          inventory_id,
          product:inventory(id, name, sku, price, photo_url:inventory_photos(photo_url))
        `)
        .in('acerto_id', acertoIds);
      
      if (vendasError) throw vendasError;
      
      if (!vendas || vendas.length === 0) {
        return [];
      }
      
      const itemCounts: Record<string, { count: number; product: any }> = {};
      
      vendas.forEach(venda => {
        const inventoryId = venda.inventory_id;
        
        if (!itemCounts[inventoryId]) {
          let product = venda.product;
          if (product && Array.isArray(product.photo_url) && product.photo_url.length > 0) {
            product = {
              ...product,
              photo_url: product.photo_url
            };
          }
          
          itemCounts[inventoryId] = { 
            count: 1,
            product
          };
        } else {
          itemCounts[inventoryId].count += 1;
        }
      });
      
      const popularItems = Object.entries(itemCounts).map(([inventoryId, data]) => ({
        inventory_id: inventoryId,
        count: data.count,
        product: data.product
      }));
      
      return popularItems
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    } catch (error) {
      console.error("Erro ao buscar itens populares:", error);
      throw error;
    }
  }
};

export const AcertoMaletaController = acertoMaletaController;
