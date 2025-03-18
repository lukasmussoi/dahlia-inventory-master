
import { AcertoMaletaModel } from "@/models/acertoMaletaModel";
import { SuitcaseController } from "@/controllers/suitcaseController";
import { toast } from "sonner";
import { Acerto, AcertoItem, SuitcaseItem } from "@/types/suitcase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import "jspdf/dist/polyfills.es.js";

export class AcertoMaletaController {
  static async getAllAcertos() {
    try {
      const acertos = await AcertoMaletaModel.getAllAcertos();
      return acertos;
    } catch (error) {
      console.error("Erro ao buscar acertos:", error);
      toast.error("Erro ao buscar acertos");
      throw error;
    }
  }

  static async getAcertoById(id: string) {
    try {
      const acerto = await AcertoMaletaModel.getAcertoById(id);
      if (!acerto) {
        throw new Error(`Acerto com ID ${id} não encontrado`);
      }
      
      // Buscar os itens vendidos
      const itensVendidos = await AcertoMaletaModel.getAcertoItems(id);
      
      return {
        ...acerto,
        items_vendidos: itensVendidos
      };
    } catch (error) {
      console.error(`Erro ao buscar acerto ${id}:`, error);
      toast.error("Erro ao carregar dados do acerto");
      throw error;
    }
  }

  static async createAcerto(data: any) {
    try {
      // 1. Coletar informações da maleta e revendedora
      const suitcase = await SuitcaseController.getSuitcaseById(data.suitcase_id);
      
      if (!suitcase) {
        throw new Error("Maleta não encontrada");
      }
      
      const sellerId = suitcase.seller_id;
      let totalVendas = 0;
      
      // 2. Buscar todos os itens da maleta
      const allSuitcaseItems = await SuitcaseController.getSuitcaseItems(data.suitcase_id);
      
      // 3. Separar itens presentes (escaneados) e vendidos
      const presentItemIds = data.items_present || [];
      const soldItems = allSuitcaseItems.filter(item => !presentItemIds.includes(item.id));
      
      // 4. Calcular total de vendas
      soldItems.forEach(item => {
        if (item.product) {
          totalVendas += item.product.price;
        }
      });
      
      // 5. Calcular comissão
      const comissao = await AcertoMaletaModel.calcularComissao(sellerId, totalVendas);
      
      // 6. Gerar sugestões de reabastecimento
      const sugestoes = await AcertoMaletaModel.generateRestockSuggestions(sellerId);
      
      // 7. Criar o acerto
      const acertoData = {
        suitcase_id: data.suitcase_id,
        seller_id: sellerId,
        settlement_date: data.settlement_date || new Date().toISOString(),
        next_settlement_date: data.next_settlement_date,
        total_sales: totalVendas,
        commission_amount: comissao,
        status: 'pendente',
        restock_suggestions: sugestoes
      };
      
      const novoAcerto = await AcertoMaletaModel.createAcerto(acertoData);
      
      // 8. Registrar itens vendidos
      const itensVendidosData = soldItems.map(item => ({
        acerto_id: novoAcerto.id,
        suitcase_item_id: item.id,
        inventory_id: item.inventory_id,
        price: item.product?.price || 0,
        sale_date: new Date().toISOString()
      }));
      
      if (itensVendidosData.length > 0) {
        await AcertoMaletaModel.addAcertoItems(itensVendidosData);
        
        // 9. Atualizar status dos itens vendidos na maleta
        const soldItemIds = soldItems.map(item => item.id);
        await AcertoMaletaModel.updateSuitcaseItemsToSold(soldItemIds);
      }
      
      // 10. Gerar relatório PDF (se necessário)
      // const receiptUrl = await this.generateReceiptPDF(novoAcerto.id);
      
      toast.success("Acerto da maleta registrado com sucesso!");
      return novoAcerto;
    } catch (error) {
      console.error("Erro ao criar acerto:", error);
      toast.error("Erro ao realizar acerto da maleta");
      throw error;
    }
  }

  static async generateReceiptPDF(acertoId: string): Promise<string> {
    try {
      // Buscar dados completos do acerto
      const acerto = await this.getAcertoById(acertoId);
      
      if (!acerto || !acerto.items_vendidos) {
        throw new Error("Dados do acerto incompletos");
      }
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      
      // Título
      doc.setFontSize(18);
      doc.text("RECIBO DE ACERTO DE MALETA", pageWidth / 2, 15, { align: "center" });
      
      // Informações do acerto
      doc.setFontSize(12);
      doc.text(`Código da Maleta: ${acerto.suitcase?.code || 'N/A'}`, 15, 30);
      doc.text(`Revendedora: ${acerto.seller?.name || 'N/A'}`, 15, 40);
      doc.text(`Data do Acerto: ${format(new Date(acerto.settlement_date), "dd/MM/yyyy", { locale: ptBR })}`, 15, 50);
      
      // Tabela de itens vendidos
      doc.setFontSize(10);
      doc.text("Itens Vendidos:", 15, 65);
      
      let yPos = 75;
      doc.text("Código", 15, yPos);
      doc.text("Produto", 45, yPos);
      doc.text("Preço", pageWidth - 40, yPos);
      
      yPos += 5;
      doc.line(15, yPos, pageWidth - 15, yPos);
      
      yPos += 10;
      
      // Listar cada item vendido
      const itemsVendidos = acerto.items_vendidos || [];
      let totalVendas = 0;
      
      itemsVendidos.forEach((item, index) => {
        const preco = typeof item.price === 'number' ? item.price : parseFloat(item.price.toString());
        totalVendas += preco;
        
        doc.text(item.product?.sku || 'N/A', 15, yPos);
        doc.text(item.product?.name || 'Produto sem nome', 45, yPos);
        doc.text(`R$ ${preco.toFixed(2)}`, pageWidth - 40, yPos);
        
        yPos += 10;
        
        // Adicionar nova página se necessário
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
      });
      
      // Linha de separação
      doc.line(15, yPos, pageWidth - 15, yPos);
      yPos += 10;
      
      // Total e comissão
      doc.setFontSize(12);
      doc.text(`Total de Vendas: R$ ${acerto.total_sales.toFixed(2)}`, pageWidth - 80, yPos);
      yPos += 10;
      doc.text(`Comissão (${(acerto.commission_amount / acerto.total_sales * 100).toFixed(0)}%): R$ ${acerto.commission_amount.toFixed(2)}`, pageWidth - 80, yPos);
      
      // Assinaturas
      yPos += 30;
      doc.line(30, yPos, 100, yPos);
      doc.line(pageWidth - 100, yPos, pageWidth - 30, yPos);
      
      yPos += 5;
      doc.text("Promotora", 55, yPos);
      doc.text("Revendedora", pageWidth - 75, yPos);
      
      // Data e hora de geração
      yPos += 30;
      doc.setFontSize(8);
      doc.text(`Documento gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, 15, yPos);
      
      // Sugestões de reabastecimento na próxima página
      doc.addPage();
      
      doc.setFontSize(14);
      doc.text("Sugestões de Reabastecimento", pageWidth / 2, 15, { align: "center" });
      
      yPos = 30;
      
      if (acerto.restock_suggestions) {
        const sugestoes = acerto.restock_suggestions;
        
        // Alta demanda
        if (sugestoes.highDemand && sugestoes.highDemand.length > 0) {
          doc.setFontSize(12);
          doc.text("Itens com Alta Demanda (Prioridade para Reposição):", 15, yPos);
          yPos += 10;
          
          doc.setFontSize(10);
          sugestoes.highDemand.forEach((item: any) => {
            doc.text(`- ${item.name} (${item.sku}) - Vendido ${item.count} vezes nos últimos 90 dias`, 20, yPos);
            yPos += 7;
          });
          
          yPos += 5;
        }
        
        // Média demanda
        if (sugestoes.mediumDemand && sugestoes.mediumDemand.length > 0) {
          doc.setFontSize(12);
          doc.text("Itens com Demanda Média:", 15, yPos);
          yPos += 10;
          
          doc.setFontSize(10);
          sugestoes.mediumDemand.forEach((item: any) => {
            doc.text(`- ${item.name} (${item.sku}) - Vendido ${item.count} vezes nos últimos 90 dias`, 20, yPos);
            yPos += 7;
          });
          
          yPos += 5;
        }
      }
      
      // Salvar como blob e gerar URL
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Atualizar acerto com URL do recibo (em um ambiente real, salvaria no storage)
      await AcertoMaletaModel.storeReceiptUrl(acertoId, pdfUrl);
      
      return pdfUrl;
    } catch (error) {
      console.error("Erro ao gerar PDF do acerto:", error);
      toast.error("Erro ao gerar recibo em PDF");
      throw error;
    }
  }

  static async updateAcertoStatus(acertoId: string, status: 'pendente' | 'concluido') {
    try {
      await AcertoMaletaModel.updateAcerto(acertoId, { status });
      toast.success(`Status do acerto atualizado para ${status}`);
      return true;
    } catch (error) {
      console.error("Erro ao atualizar status do acerto:", error);
      toast.error("Erro ao atualizar status do acerto");
      throw error;
    }
  }

  static async getSellerSalesHistory(sellerId: string) {
    try {
      const history = await AcertoMaletaModel.getSellerSalesHistory(sellerId);
      return history;
    } catch (error) {
      console.error("Erro ao buscar histórico de vendas:", error);
      toast.error("Erro ao buscar histórico de vendas");
      throw error;
    }
  }

  static async getItemSalesFrequency(inventoryId: string, sellerId: string) {
    try {
      const history = await AcertoMaletaModel.getSellerSalesHistory(sellerId);
      
      // Filtrar vendas do item específico
      const itemSales = history.filter(sale => sale.inventory_id === inventoryId);
      
      return {
        count: itemSales.length,
        frequency: itemSales.length > 3 ? "alta" : itemSales.length > 1 ? "média" : itemSales.length > 0 ? "baixa" : "nenhuma"
      };
    } catch (error) {
      console.error("Erro ao buscar frequência de vendas do item:", error);
      return { count: 0, frequency: "desconhecida" };
    }
  }

  static formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }
}

// Criar alias para compatibilidade com código existente
export const acertoMaletaController = AcertoMaletaController;
