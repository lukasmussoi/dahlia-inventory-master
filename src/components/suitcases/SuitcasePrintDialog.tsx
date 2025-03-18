
import { useRef } from "react";
import { Suitcase, SuitcaseItem } from "@/types/suitcase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Printer, Package, Download } from "lucide-react";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

interface SuitcasePrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suitcase: Suitcase | null;
  suitcaseItems: SuitcaseItem[];
  promoterInfo: any;
}

export function SuitcasePrintDialog({
  open,
  onOpenChange,
  suitcase,
  suitcaseItems,
  promoterInfo,
}: SuitcasePrintDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // Função para gerar PDF diretamente
  const handleGeneratePDF = async () => {
    if (!suitcase) return;
    
    try {
      // Criar o documento PDF
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });
      
      // Configurações de estilo
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      const lineHeight = 7;
      let y = margin;
      
      // Adicionar título principal
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(`Relatório da Maleta: ${suitcase.code}`, margin, y);
      y += lineHeight * 2;
      
      // Adicionar data de impressão
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Data de impressão: ${format(new Date(), "dd/MM/yyyy", { locale: ptBR })}`, margin, y);
      y += lineHeight * 1.5;
      
      // Seção de informações
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Informações da Maleta", margin, y);
      y += lineHeight;
      
      // Dados da revendedora e promotora
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Revendedora: ${suitcase.seller?.name || "—"}`, margin, y);
      y += lineHeight;
      doc.text(`Telefone da Revendedora: ${suitcase.seller?.phone || "—"}`, margin, y);
      y += lineHeight;
      doc.text(`Promotora: ${promoterInfo?.name || "—"}`, margin, y);
      y += lineHeight;
      doc.text(`Telefone da Promotora: ${promoterInfo?.phone || "—"}`, margin, y);
      y += lineHeight;
      doc.text(`Localização: ${suitcase.city || "—"}, ${suitcase.neighborhood || "—"}`, margin, y);
      y += lineHeight;
      doc.text(`Status: ${
        suitcase.status === "in_use"
          ? "Em uso"
          : suitcase.status === "returned"
          ? "Devolvida"
          : suitcase.status === "in_replenishment"
          ? "Em reposição"
          : suitcase.status
      }`, margin, y);
      y += lineHeight;
      doc.text(`Data de criação: ${formatDate(suitcase.created_at)}`, margin, y);
      y += lineHeight;
      doc.text(`Próximo acerto: ${suitcase.next_settlement_date ? formatDate(suitcase.next_settlement_date) : "Não definida"}`, margin, y);
      y += lineHeight * 2;
      
      // Seção de itens
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Itens da Maleta", margin, y);
      y += lineHeight * 1.5;
      
      if (suitcaseItems.length === 0) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text("Nenhum item encontrado na maleta", margin, y);
        y += lineHeight;
      } else {
        // Tabela de itens
        const itemsPerPage = 10;
        let itemCount = 0;
        
        for (const item of suitcaseItems) {
          // Verificar se precisa adicionar nova página
          if (itemCount > 0 && itemCount % itemsPerPage === 0) {
            doc.addPage();
            y = margin;
            
            // Cabeçalho na nova página
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text(`Relatório da Maleta: ${suitcase.code} (continuação)`, margin, y);
            y += lineHeight * 2;
          }
          
          // Item da maleta
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text(`${item.product?.name || "Produto sem nome"}`, margin, y);
          y += lineHeight;
          
          doc.setFont("helvetica", "normal");
          doc.text(`Código: ${item.product?.sku || "—"}`, margin, y);
          y += lineHeight;
          
          doc.text(`Preço: ${formatPrice(item.product?.price || 0)}`, margin, y);
          y += lineHeight;
          
          doc.text(`Status: ${
            item.status === 'in_possession' ? 'Em posse' :
            item.status === 'sold' ? 'Vendido' :
            item.status === 'returned' ? 'Devolvido' :
            'Perdido'
          }`, margin, y);
          y += lineHeight * 1.5;
          
          itemCount++;
        }
      }
      
      // Adicionar linha para totais
      doc.setLineWidth(0.5);
      doc.line(margin, y, margin + contentWidth, y);
      y += lineHeight;
      
      // Total de itens e valor
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Total de peças: ${suitcaseItems.length}`, margin, y);
      
      const totalValue = suitcaseItems.reduce((total, item) => {
        return total + (item.product?.price || 0);
      }, 0);
      
      doc.text(`Valor total: ${formatPrice(totalValue)}`, pageWidth - margin - 40, y);
      y += lineHeight * 2;
      
      // Espaços para assinatura
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Assinatura Revendedora:`, margin, y);
      doc.text(`Assinatura Promotora:`, pageWidth / 2 + 10, y);
      y += lineHeight;
      
      // Linhas para assinatura
      doc.line(margin, y + 10, margin + 60, y + 10);
      doc.line(pageWidth / 2 + 10, y + 10, pageWidth / 2 + 70, y + 10);
      y += lineHeight + 10;
      
      // Nomes abaixo das linhas
      doc.setFontSize(8);
      doc.text(`${suitcase.seller?.name || "Revendedora"}`, margin, y);
      doc.text(`${promoterInfo?.name || "Promotora"}`, pageWidth / 2 + 10, y);
      
      // Gerar PDF e abrir em nova janela
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      
      toast.success("PDF gerado com sucesso");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF");
    }
  };

  // Formatador de data
  const formatDate = (date: string) => {
    if (!date) return "Não definida";
    return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  // Formatar preço
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(price);
  };

  if (!suitcase) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Relatório da Maleta: {suitcase.code}
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef} className="print-container p-4">
          <div className="mb-6 border-b pb-4">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">Maleta: {suitcase.code}</h1>
              <div className="text-right">
                <p className="text-sm">Data de impressão:</p>
                <p className="font-medium">{format(new Date(), "dd/MM/yyyy", { locale: ptBR })}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm text-gray-500">Revendedora</p>
                <p className="font-medium">{suitcase.seller?.name || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Promotora</p>
                <p className="font-medium">{promoterInfo?.name || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Telefone da Revendedora</p>
                <p className="font-medium">{suitcase.seller?.phone || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Telefone da Promotora</p>
                <p className="font-medium">{promoterInfo?.phone || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Localização</p>
                <p className="font-medium">{suitcase.city || "—"}, {suitcase.neighborhood || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium">
                  {suitcase.status === "in_use"
                    ? "Em uso"
                    : suitcase.status === "returned"
                    ? "Devolvida"
                    : suitcase.status === "in_replenishment"
                    ? "Em reposição"
                    : suitcase.status}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Data de criação</p>
                <p className="font-medium">{formatDate(suitcase.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Próximo acerto</p>
                <p className="font-medium">
                  {suitcase.next_settlement_date ? formatDate(suitcase.next_settlement_date) : "Não definida"}
                </p>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-4">Itens da Maleta</h2>
          
          {suitcaseItems.length === 0 ? (
            <div className="text-center py-8 border rounded-md">
              <Package className="h-12 w-12 mx-auto text-gray-300" />
              <p className="mt-2 text-muted-foreground">Nenhum item encontrado na maleta</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {suitcaseItems.map((item) => (
                <div key={item.id} className="border rounded-md p-3">
                  <div className="flex">
                    <div className="w-16 h-16 bg-gray-100 rounded-md mr-3 flex-shrink-0 item-image">
                      {item.product?.photo_url ? (
                        <img src={item.product.photo_url} alt={item.product?.name} className="w-full h-full object-cover rounded-md" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div>
                          <h4 className="font-medium">{item.product?.name}</h4>
                          <p className="text-sm text-gray-600">
                            Código: {item.product?.sku}
                          </p>
                          <p className="font-medium">
                            {formatPrice(item.product?.price || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            Status: {
                              item.status === 'in_possession' ? 'Em posse' :
                              item.status === 'sold' ? 'Vendido' :
                              item.status === 'returned' ? 'Devolvido' :
                              'Perdido'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-6 border-t pt-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-lg font-medium">Total de peças: {suitcaseItems.length}</p>
              </div>
              <div className="text-right">
                <p className="text-sm">Valor total da maleta:</p>
                <p className="text-xl font-bold">
                  {formatPrice(suitcaseItems.reduce((total, item) => {
                    return total + (item.product?.price || 0);
                  }, 0))}
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-4 border-t">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm mb-2">Assinatura Revendedora:</p>
                <div className="border-b border-black h-8 mt-8"></div>
                <p className="text-center mt-2">{suitcase.seller?.name}</p>
              </div>
              <div>
                <p className="text-sm mb-2">Assinatura Promotora:</p>
                <div className="border-b border-black h-8 mt-8"></div>
                <p className="text-center mt-2">{promoterInfo?.name}</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="no-print">
          <Button
            type="button"
            variant="outline"
            className="mr-2"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
          <Button 
            onClick={handleGeneratePDF}
            className="gap-2 bg-pink-500 hover:bg-pink-600"
          >
            <Download className="h-4 w-4" />
            Gerar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
