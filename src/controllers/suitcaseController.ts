import { SuitcaseModel } from "@/models/suitcaseModel";
import { Acerto, SuitcaseItemStatus, Suitcase, SuitcaseItem } from "@/types/suitcase";
import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getProductPhotoUrl } from "@/utils/photoUtils";
import { openPdfInNewTab } from "@/utils/pdfUtils";

export class SuitcaseController {
  static async getSuitcases(filters?: any) {
    try {
      return await SuitcaseModel.getAllSuitcases(filters);
    } catch (error) {
      console.error("Erro ao buscar maletas:", error);
      throw error;
    }
  }

  static async getSuitcaseById(id: string) {
    try {
      return await SuitcaseModel.getSuitcaseById(id);
    } catch (error) {
      console.error("Erro ao buscar maleta por ID:", error);
      throw error;
    }
  }

  static async getSuitcaseItems(suitcaseId: string) {
    try {
      return await SuitcaseModel.getSuitcaseItems(suitcaseId);
    } catch (error) {
      console.error("Erro ao buscar itens da maleta:", error);
      throw error;
    }
  }

  static async createSuitcase(suitcaseData: any) {
    try {
      return await SuitcaseModel.createSuitcase(suitcaseData);
    } catch (error) {
      console.error("Erro ao criar maleta:", error);
      throw error;
    }
  }

  static async updateSuitcase(id: string, updates: any) {
    try {
      return await SuitcaseModel.updateSuitcase(id, updates);
    } catch (error) {
      console.error("Erro ao atualizar maleta:", error);
      throw error;
    }
  }

  static async deleteSuitcase(id: string) {
    try {
      await SuitcaseModel.deleteSuitcase(id);
    } catch (error) {
      console.error("Erro ao excluir maleta:", error);
      throw error;
    }
  }

  static async addItemToSuitcase(suitcaseId: string, inventoryId: string, quantity: number = 1) {
    try {
      return await SuitcaseModel.addItemToSuitcase({
        suitcase_id: suitcaseId,
        inventory_id: inventoryId,
        quantity: quantity
      });
    } catch (error) {
      console.error("Erro ao adicionar item à maleta:", error);
      throw error;
    }
  }

  static async updateSuitcaseItemStatus(
    itemId: string, 
    status: SuitcaseItemStatus,
    saleInfo?: any
  ) {
    try {
      return await SuitcaseModel.updateSuitcaseItemStatus(itemId, status, saleInfo);
    } catch (error) {
      console.error("Erro ao atualizar status do item da maleta:", error);
      throw error;
    }
  }

  static async getSuitcaseItemSales(itemId: string) {
    try {
      return await SuitcaseModel.getSuitcaseItemSales(itemId);
    } catch (error) {
      console.error("Erro ao buscar vendas do item da maleta:", error);
      throw error;
    }
  }

  static async searchSuitcases(filters: any) {
    try {
      return await SuitcaseModel.searchSuitcases(filters);
    } catch (error) {
      console.error("Erro ao buscar maletas:", error);
      throw error;
    }
  }

  static async generateSuitcaseCode() {
    try {
      return await SuitcaseModel.generateSuitcaseCode();
    } catch (error) {
      console.error("Erro ao gerar código da maleta:", error);
      throw error;
    }
  }

  static async removeSuitcaseItem(itemId: string) {
    try {
      await SuitcaseModel.removeSuitcaseItem(itemId);
    } catch (error) {
      console.error("Erro ao remover item da maleta:", error);
      throw error;
    }
  }

  static async getSuitcaseSummary() {
    try {
      return await SuitcaseModel.getSuitcaseSummary();
    } catch (error) {
      console.error("Erro ao buscar resumo das maletas:", error);
      throw error;
    }
  }

  static async getAllSellers() {
    try {
      return await SuitcaseModel.getAllSellers();
    } catch (error) {
      console.error("Erro ao buscar revendedoras:", error);
      throw error;
    }
  }

  static async getSellerById(sellerId: string) {
    try {
      return await SuitcaseModel.getSellerById(sellerId);
    } catch (error) {
      console.error("Erro ao buscar revendedora por ID:", error);
      throw error;
    }
  }

  static async searchInventoryItems(query: string) {
    try {
      return await SuitcaseModel.searchInventoryItems(query);
    } catch (error) {
      console.error("Erro ao buscar itens do inventário:", error);
      throw error;
    }
  }

  static async getItemSuitcaseInfo(inventoryId: string) {
    try {
      return await SuitcaseModel.getItemSuitcaseInfo(inventoryId);
    } catch (error) {
      console.error(
        "Erro ao obter informações de qual maleta o item está:",
        error
      );
      throw error;
    }
  }

  static async updateSuitcaseItemQuantity(itemId: string, quantity: number) {
    try {
      return await SuitcaseModel.updateSuitcaseItemQuantity(itemId, quantity);
    } catch (error) {
      console.error("Erro ao atualizar quantidade do item da maleta:", error);
      throw error;
    }
  }

  static async returnItemToInventory(itemId: string) {
    try {
      await SuitcaseModel.returnItemToInventory(itemId);
    } catch (error) {
      console.error("Erro ao retornar item ao inventário:", error);
      throw error;
    }
  }

  static async getPromoterForReseller(resellerId: string): Promise<any | null> {
    try {
      const promotoras = [
        {
          id: "1",
          name: "Maria Silva",
          phone: "(11) 99999-9999",
          reseller_id: "79a3269f-9e6f-4b97-b990-30984dd9f1ca",
        },
        {
          id: "2",
          name: "João Santos",
          phone: "(21) 88888-8888",
          reseller_id: "2",
        },
      ];

      const promotora = promotoras.find(
        (p) => p.reseller_id === resellerId
      );

      return promotora || null;
    } catch (error) {
      console.error("Erro ao buscar promotora da revendedora:", error);
      return null;
    }
  }

  static async updateSaleInfo(itemId: string, field: string, value: string) {
    try {
      const sales = await SuitcaseModel.getSuitcaseItemSales(itemId);

      if (!sales || sales.length === 0) {
        const newSale = {
          customer_name: "",
          payment_method: "",
        };

        newSale[field] = value;

        await SuitcaseModel.updateSuitcaseItemStatus(itemId, "sold", newSale);
      } else {
        const saleId = sales[0].id;

        const update = {};
        update[field] = value;

        console.warn(
          "Função de atualizar venda existente não implementada. Apenas a primeira venda está sendo atualizada."
        );
      }
    } catch (error) {
      console.error("Erro ao atualizar informações de venda:", error);
      throw error;
    }
  }

  static async createPendingSettlement(suitcaseId: string, settlementDate: Date) {
    try {
      const acertoPendente = {
        suitcase_id: suitcaseId,
        settlement_date: settlementDate.toISOString(),
        status: "pendente",
        total_sales: 0,
        commission_amount: 0,
      };

      console.log("Acerto pendente criado:", acertoPendente);
    } catch (error) {
      console.error("Erro ao criar acerto pendente:", error);
      throw error;
    }
  }

  static async generateSuitcasePDF(
    suitcaseId: string,
    items: SuitcaseItem[],
    promoterInfo: any
  ): Promise<string> {
    try {
      const suitcase = await this.getSuitcaseById(suitcaseId);
      
      if (!suitcase) {
        throw new Error("Maleta não encontrada");
      }
      
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });
      
      const margin = 20;
      let yPos = margin;
      
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(`Maleta: ${suitcase.code}`, margin, yPos);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Data de impressão:`, 150, yPos - 5);
      doc.text(`${format(new Date(), "dd/MM/yyyy", { locale: ptBR })}`, 150, yPos);
      
      yPos += 15;
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Revendedora", margin, yPos);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(suitcase.seller?.name || "—", margin, yPos + 7);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Promotora", 110, yPos);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(promoterInfo?.name || "—", 110, yPos + 7);
      
      yPos += 15;
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Telefone da Revendedora", margin, yPos);
      
      doc.setFont("helvetica", "normal");
      doc.text(suitcase.seller?.phone || "—", margin, yPos + 7);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Telefone da Promotora", 110, yPos);
      
      doc.setFont("helvetica", "normal");
      doc.text(promoterInfo?.phone || "—", 110, yPos + 7);
      
      yPos += 15;
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Localização", margin, yPos);
      
      doc.setFont("helvetica", "normal");
      doc.text(`${suitcase.city || "—"}, ${suitcase.neighborhood || "—"}`, margin, yPos + 7);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Status", 110, yPos);
      
      doc.setFont("helvetica", "normal");
      doc.text(
        suitcase.status === "in_use"
          ? "Em uso"
          : suitcase.status === "returned"
          ? "Devolvida"
          : suitcase.status === "in_replenishment"
          ? "Em reposição"
          : suitcase.status || "—", 
        110, 
        yPos + 7
      );
      
      yPos += 15;
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Data de criação", margin, yPos);
      
      doc.setFont("helvetica", "normal");
      doc.text(
        suitcase.created_at 
          ? format(new Date(suitcase.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
          : "—", 
        margin, 
        yPos + 7
      );
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Próximo acerto", 110, yPos);
      
      doc.setFont("helvetica", "normal");
      doc.text(
        suitcase.next_settlement_date
          ? format(new Date(suitcase.next_settlement_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
          : "Não definida",
        110,
        yPos + 7
      );
      
      yPos += 20;
      
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, yPos - 5, 190, yPos - 5);
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Itens da Maleta", margin, yPos);
      
      yPos += 10;
      
      if (!items || items.length === 0) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text("Nenhum item encontrado na maleta", margin, yPos);
        yPos += 10;
      } else {
        for (const item of items) {
          const itemStartY = yPos;
          
          if (yPos > 250) {
            doc.addPage();
            yPos = margin;
          }
          
          doc.setDrawColor(220, 220, 220);
          doc.setFillColor(250, 250, 250);
          doc.roundedRect(margin, yPos, 170, 25, 2, 2, 'FD');
          
          if (item.product?.photo_url) {
            try {
              const imgUrl = getProductPhotoUrl(item.product.photo_url);
              if (imgUrl) {
                const img = await this.loadImageAsBase64(imgUrl);
                if (img) {
                  doc.addImage(img, 'JPEG', margin + 2, yPos + 2, 20, 20);
                }
              }
            } catch (error) {
              console.error("Erro ao carregar imagem:", error);
            }
          }
          
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text(item.product?.name || "Item sem nome", margin + 25, yPos + 5);
          
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.text(`Código: ${item.product?.sku || "—"}`, margin + 25, yPos + 10);
          
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text(
            this.formatPrice(item.product?.price || 0),
            margin + 25,
            yPos + 15
          );
          
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.text(
            `Status: ${
              item.status === 'in_possession' ? 'Em posse' :
              item.status === 'sold' ? 'Vendido' :
              item.status === 'returned' ? 'Devolvido' :
              'Perdido'
            }`,
            margin + 120,
            yPos + 10
          );
          
          yPos += 30;
        }
      }
      
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, yPos - 5, 190, yPos - 5);
      
      yPos += 5;
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`Total de peças: ${items.length}`, margin, yPos);
      
      const totalValue = items.reduce((total, item) => {
        return total + (item.product?.price || 0);
      }, 0);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Valor total da maleta:", 130, yPos);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(this.formatPrice(totalValue), 130, yPos + 7);
      
      yPos += 30;
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      doc.text("Assinatura Revendedora:", margin, yPos);
      doc.line(margin, yPos + 15, margin + 70, yPos + 15);
      doc.text(suitcase.seller?.name || "", margin + 20, yPos + 20);
      
      doc.text("Assinatura Promotora:", 110, yPos);
      doc.line(110, yPos + 15, 110 + 70, yPos + 15);
      doc.text(promoterInfo?.name || "", 110 + 20, yPos + 20);
      
      return doc.output('datauristring');
    } catch (error) {
      console.error("Erro ao gerar PDF da maleta:", error);
      throw new Error("Não foi possível gerar o PDF da maleta");
    }
  }
  
  private static async loadImageAsBase64(url: string): Promise<string | null> {
    try {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              reject(new Error("Não foi possível criar o contexto 2D"));
              return;
            }
            
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL("image/jpeg");
            resolve(dataURL);
          } catch (error) {
            console.error("Erro ao processar imagem:", error);
            reject(error);
          }
        };
        img.onerror = () => {
          console.error("Erro ao carregar imagem:", url);
          resolve(null);
        };
        img.src = url;
      });
    } catch (error) {
      console.error("Erro ao carregar imagem como Base64:", error);
      return null;
    }
  }
  
  private static formatPrice(price: number): string {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(price);
  }
}
