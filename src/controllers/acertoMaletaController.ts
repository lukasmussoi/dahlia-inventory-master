
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

      // Aplicar filtros se fornecidos
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
      
      // Buscar itens vendidos neste acerto
      const { data: itemsVendidos, error: itemsError } = await supabase
        .from('acerto_itens_vendidos')
        .select(`
          *,
          product:inventory(id, name, sku, price, photo_url:inventory_photos(photo_url))
        `)
        .eq('acerto_id', id);
      
      if (itemsError) throw itemsError;
      
      // Para cada produto, processar o formato da foto
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
      
      // Para cada acerto, buscar os itens vendidos
      const acertosCompletos = await Promise.all(
        (acertos || []).map(async (acerto) => {
          // Buscar itens vendidos para este acerto
          const { data: itemsVendidos, error: itemsError } = await supabase
            .from('acerto_itens_vendidos')
            .select(`
              *,
              product:inventory(id, name, sku, price, photo_url:inventory_photos(photo_url))
            `)
            .eq('acerto_id', acerto.id);
          
          if (itemsError) throw itemsError;
          
          // Para cada produto, processar o formato da foto
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
      // Buscar a maleta e revendedora para obter detalhes
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
      
      // Buscar itens que não estão marcados como presentes (considerados como vendidos)
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
      
      // Taxa de comissão da revendedora
      const commissionRate = suitcase.seller?.commission_rate || 0.3; // 30% padrão se não especificado
      const commissionAmount = totalSales * commissionRate;
      
      // Verificar se já existe um acerto pendente para esta maleta
      const { data: existingAcerto, error: existingError } = await supabase
        .from('acertos_maleta')
        .select('id')
        .eq('suitcase_id', data.suitcase_id)
        .eq('status', 'pendente');
      
      if (existingError) {
        console.error("Erro ao verificar acerto existente:", existingError);
      }
      
      let acertoId: string;
      
      // Se já existe um acerto pendente, atualizar; caso contrário, criar um novo
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
        // Criar um novo acerto
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
      
      // Para cada item vendido, criar um registro em acerto_itens_vendidos
      if (soldItems.length > 0) {
        // Converter status dos itens para "sold"
        await Promise.all(soldItems.map(async (item) => {
          // Buscar informações de venda do item, se existirem
          const { data: saleInfo, error: saleError } = await supabase
            .from('suitcase_item_sales')
            .select('*')
            .eq('suitcase_item_id', item.id);
          
          if (saleError) {
            console.error(`Erro ao buscar informações de venda para o item ${item.id}:`, saleError);
          }
          
          // Atualizar status do item para "sold"
          const { error: updateError } = await supabase
            .from('suitcase_items')
            .update({ status: 'sold' })
            .eq('id', item.id);
          
          if (updateError) {
            console.error(`Erro ao atualizar status do item ${item.id}:`, updateError);
          }
          
          // Extrair informações de pagamento e cliente da venda, se existirem
          const customerName = saleInfo && saleInfo.length > 0 ? saleInfo[0].customer_name : null;
          const paymentMethod = saleInfo && saleInfo.length > 0 ? saleInfo[0].payment_method : null;
          
          // Registrar o item vendido no acerto
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
      
      // Atualizar a data do próximo acerto na maleta
      if (data.next_settlement_date) {
        await supabase
          .from('suitcases')
          .update({ 
            next_settlement_date: new Date(data.next_settlement_date).toISOString() 
          })
          .eq('id', data.suitcase_id);
      }
      
      // Recuperar o acerto completo com todos os dados
      return await this.getAcertoById(acertoId);
    } catch (error) {
      console.error("Erro ao criar acerto:", error);
      throw error;
    }
  },
  
  // Excluir um acerto
  async deleteAcerto(acertoId: string): Promise<boolean> {
    try {
      // Verificar se o usuário é administrador
      const { data: isAdmin } = await supabase.rpc('is_admin');
      
      if (!isAdmin) {
        toast.error("Apenas administradores podem excluir acertos");
        return false;
      }
      
      // Buscar o acerto para obter informações antes de excluir
      const acerto = await this.getAcertoById(acertoId);
      
      if (!acerto) {
        toast.error("Acerto não encontrado");
        return false;
      }
      
      // Se o acerto estiver concluído, reverter o status dos itens para in_possession
      if (acerto.status === 'concluido' && acerto.items_vendidos && acerto.items_vendidos.length > 0) {
        // Extrair IDs dos itens vendidos
        const suitcaseItemIds = acerto.items_vendidos.map(item => item.suitcase_item_id);
        
        // Atualizar status dos itens de volta para in_possession
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
      
      // Excluir o acerto usando o modelo
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
      
      // Buscar dados completos do acerto
      const acerto = await this.getAcertoById(acertoId);
      if (!acerto) {
        console.error("Erro: Acerto não encontrado");
        throw new Error("Acerto não encontrado");
      }
      
      console.log(`Dados do acerto recuperados: ${acerto.id}, itens: ${acerto.items_vendidos?.length || 0}`);
      
      // Obter informações da promotora, se disponível
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
      
      // Criar um documento PDF
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      try {
        // Configurações de fontes e estilos
        const titleFontSize = 16;
        const subtitleFontSize = 12;
        const normalFontSize = 10;
        const smallFontSize = 8;
        
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const contentWidth = pageWidth - 2 * margin;
        
        console.log(`Dimensões do PDF: ${pageWidth}x${pageHeight}mm, margens: ${margin}mm`);
        
        // Cabeçalho
        doc.setFontSize(titleFontSize);
        doc.setFont('helvetica', 'bold');
        doc.text("RECIBO DE ACERTO DE MALETA", pageWidth / 2, margin, { align: 'center' });
        
        // Informações gerais
        doc.setFontSize(subtitleFontSize);
        doc.text("INFORMAÇÕES DO ACERTO", margin, margin + 10);
        
        // Adicionar linha
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, margin + 12, pageWidth - margin, margin + 12);
        
        // Detalhes do acerto
        doc.setFontSize(normalFontSize);
        doc.setFont('helvetica', 'normal');
        
        let y = margin + 20;
        const lineHeight = 7;
        
        // Informações da maleta e revendedora
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
        
        // Resumo financeiro
        doc.setFontSize(subtitleFontSize);
        doc.setFont('helvetica', 'bold');
        doc.text("RESUMO FINANCEIRO", margin, y);
        y += lineHeight;
        
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, y, pageWidth - margin, y);
        y += lineHeight;
        
        doc.setFontSize(normalFontSize);
        doc.setFont('helvetica', 'normal');
        
        // Formatação de valores monetários
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
        
        // Listagem de itens vendidos
        if (acerto.items_vendidos && acerto.items_vendidos.length > 0) {
          doc.setFontSize(subtitleFontSize);
          doc.setFont('helvetica', 'bold');
          doc.text(`ITENS VENDIDOS (${acerto.items_vendidos.length})`, margin, y);
          y += lineHeight;
          
          doc.setDrawColor(200, 200, 200);
          doc.line(margin, y, pageWidth - margin, y);
          y += lineHeight;
          
          // Cabeçalhos da tabela
          doc.setFontSize(smallFontSize);
          doc.setFont('helvetica', 'bold');
          
          // Definir colunas da tabela
          const col1Width = contentWidth * 0.15; // SKU
          const col2Width = contentWidth * 0.45; // Produto
          const col3Width = contentWidth * 0.2; // Cliente
          const col4Width = contentWidth * 0.2; // Preço
          
          doc.text("SKU", margin, y);
          doc.text("Produto", margin + col1Width, y);
          doc.text("Cliente", margin + col1Width + col2Width, y);
          doc.text("Preço", pageWidth - margin, y, { align: 'right' });
          y += lineHeight;
          
          // Linha separadora dos cabeçalhos
          doc.setDrawColor(200, 200, 200);
          doc.line(margin, y - 2, pageWidth - margin, y - 2);
          
          // Listar itens
          doc.setFontSize(smallFontSize);
          doc.setFont('helvetica', 'normal');
          
          // Calcular quantos itens cabem por página
          const itemsPerPage = Math.floor((pageHeight - y - margin) / (lineHeight * 2)); // Espaço reduzido
          let itemsOnCurrentPage = 0;
          
          for (let i = 0; i < acerto.items_vendidos.length; i++) {
            const item = acerto.items_vendidos[i];
            
            // Verificar se precisa de uma nova página
            if (itemsOnCurrentPage >= itemsPerPage) {
              doc.addPage();
              y = margin;
              itemsOnCurrentPage = 0;
              
              // Adicionar cabeçalhos na nova página
              doc.setFontSize(smallFontSize);
              doc.setFont('helvetica', 'bold');
              
              doc.text("SKU", margin, y);
              doc.text("Produto", margin + col1Width, y);
              doc.text("Cliente", margin + col1Width + col2Width, y);
              doc.text("Preço", pageWidth - margin, y, { align: 'right' });
              y += lineHeight;
              
              // Linha separadora dos cabeçalhos
              doc.setDrawColor(200, 200, 200);
              doc.line(margin, y - 2, pageWidth - margin, y - 2);
              
              doc.setFontSize(smallFontSize);
              doc.setFont('helvetica', 'normal');
            }
            
            // Obter URL da imagem, se disponível
            let photoUrl = undefined;
            if (item.product && item.product.photo_url) {
              if (typeof item.product.photo_url === 'string') {
                photoUrl = item.product.photo_url;
              } else if (Array.isArray(item.product.photo_url) && item.product.photo_url.length > 0) {
                photoUrl = getProductPhotoUrl(item.product.photo_url);
              }
            }
            
            // Informações do item - simplificado sem imagens para evitar problemas
            doc.setFontSize(smallFontSize);
            doc.text(item.product?.sku || "-", margin, y);
            doc.text(item.product?.name || "Produto não encontrado", margin + col1Width, y);
            doc.text(item.customer_name || "-", margin + col1Width + col2Width, y);
            doc.text(formatCurrency(item.price), pageWidth - margin, y, { align: 'right' });
            
            // Avançar Y para o próximo item
            y += lineHeight;
            itemsOnCurrentPage++;
            
            // Linha separadora entre itens
            if (i < acerto.items_vendidos.length - 1) {
              doc.setDrawColor(240, 240, 240);
              doc.line(margin, y - 1, pageWidth - margin, y - 1);
            }
          }
        } else {
          // Se não houver itens vendidos
          doc.setFontSize(normalFontSize);
          doc.setFont('helvetica', 'italic');
          doc.text("Nenhum item vendido neste acerto.", margin, y);
          y += lineHeight * 2;
        }
        
        // Adicionar espaço para assinaturas
        y += lineHeight * 3;
        
        if (y + lineHeight * 6 > pageHeight) {
          doc.addPage();
          y = margin;
        }
        
        doc.setFontSize(normalFontSize);
        
        // Linhas para assinaturas
        const signatureWidth = contentWidth / 2 - 10;
        
        doc.line(margin, y + lineHeight, margin + signatureWidth, y + lineHeight);
        doc.line(margin + contentWidth - signatureWidth, y + lineHeight, pageWidth - margin, y + lineHeight);
        
        // Texto sob as linhas de assinatura
        doc.setFontSize(smallFontSize);
        doc.text("Revendedora", margin + signatureWidth / 2, y + lineHeight + 5, { align: 'center' });
        doc.text("Empresa", margin + contentWidth - signatureWidth / 2, y + lineHeight + 5, { align: 'center' });
        
        // Campo de observações
        y += lineHeight * 5;
        
        doc.setFontSize(subtitleFontSize);
        doc.setFont('helvetica', 'bold');
        doc.text("OBSERVAÇÕES:", margin, y);
        y += lineHeight;
        
        // Linhas para observações
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, y, pageWidth - margin, y);
        y += lineHeight;
        doc.line(margin, y, pageWidth - margin, y);
        y += lineHeight;
        doc.line(margin, y, pageWidth - margin, y);
        
        // Rodapé
        y = pageHeight - margin;
        doc.setFontSize(smallFontSize);
        doc.setFont('helvetica', 'normal');
        doc.text("Dalia Manager - Recibo de Acerto de Maleta", pageWidth / 2, y, { align: 'center' });
        
        console.log("PDF gerado com sucesso, gerando URI...");
      } catch (renderError) {
        console.error("Erro durante a renderização do PDF:", renderError);
      }
      
      // Gerar o PDF como Data URL - MODIFICAÇÃO AQUI
      try {
        // Usar toDataURL em vez de output('datauristring')
        const blob = doc.output('blob');
        const reader = new FileReader();
        
        // Criar uma Promise para esperar a conclusão do FileReader
        const pdfDataUri = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        
        // Verificar se o dataURI foi gerado corretamente
        if (!pdfDataUri.startsWith('data:application/pdf;base64,')) {
          console.error("Erro no formato do URI do PDF");
          throw new Error("Formato inválido do URI do PDF");
        }
        
        // Atualizar o recibo no acerto
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
      // Buscar acertos dos últimos 90 dias para esta revendedora
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
      
      // Buscar quantas vezes este item específico foi vendido nestes acertos
      const acertoIds = acertos.map(a => a.id);
      
      const { data: vendas, error: vendasError } = await supabase
        .from('acerto_itens_vendidos')
        .select('id')
        .eq('inventory_id', inventoryId)
        .in('acerto_id', acertoIds);
      
      if (vendasError) throw vendasError;
      
      const count = vendas ? vendas.length : 0;
      
      // Determinar frequência com base na quantidade de vendas
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
      // Buscar acertos dos últimos 180 dias para esta revendedora
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
      
      // Buscar itens vendidos nesses acertos
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
      
      // Contar ocorrências de cada item
      const itemCounts: Record<string, { count: number; product: any }> = {};
      
      vendas.forEach(venda => {
        const inventoryId = venda.inventory_id;
        
        if (!itemCounts[inventoryId]) {
          // Para cada produto, processar o formato da foto
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
      
      // Converter para array e ordenar por contagem
      const popularItems = Object.entries(itemCounts).map(([inventoryId, data]) => ({
        inventory_id: inventoryId,
        count: data.count,
        product: data.product
      }));
      
      // Ordenar por contagem (do maior para o menor) e limitar ao número solicitado
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
