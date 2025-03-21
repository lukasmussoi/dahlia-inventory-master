
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CreditCard, 
  Download, 
  Package2, 
  Printer, 
  User, 
  FileText, 
  ExternalLink, 
  Coins, 
  ArrowRightLeft 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRef, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { useReactToPrint } from "react-to-print";
import { AcertoMaletaController } from "@/controllers/acertoMaletaController";
import { Acerto, AcertoItem } from "@/types/suitcase";
import { formatPhotoUrl } from "@/utils/photoUtils";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useQuery } from "@tanstack/react-query";

// Define um tipo estendido para o jsPDF com a propriedade lastAutoTable
interface ExtendedJsPDF extends jsPDF {
  lastAutoTable?: {
    finalY?: number;
  };
}

interface AcertoDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  acertoId: string | null;
}

export function AcertoDetailsDialog({ 
  open, 
  onOpenChange, 
  acertoId 
}: AcertoDetailsDialogProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const { data: acerto, isLoading } = useQuery({
    queryKey: ['acerto', acertoId],
    queryFn: async () => {
      if (!acertoId) return null;
      const data = await AcertoMaletaController.getAcertoById(acertoId);
      // Vamos converter o resultado para o tipo Acerto para satisfazer o TypeScript
      return data as unknown as Acerto;
    },
    enabled: !!acertoId && open,
  });

  const handlePrint = useReactToPrint({
    content: () => reportRef.current,
    documentTitle: `Acerto_${acerto?.id || 'desconhecido'}`,
    onBeforeGetContent: () => {
      if (reportRef.current) {
        const printElement = reportRef.current;
        printElement.style.maxWidth = '100%';
      }
      return Promise.resolve();
    },
    onAfterPrint: () => {
      if (reportRef.current) {
        const printElement = reportRef.current;
        printElement.style.maxWidth = ''; // Reset
      }
    },
  });

  const handleExportPDF = async () => {
    try {
      if (!acerto) return;
      
      setIsGeneratingPdf(true);
      
      // Criar documento PDF
      const doc = new jsPDF('p', 'mm', 'a4') as ExtendedJsPDF;
      
      // Cabeçalho
      doc.setFontSize(16);
      doc.text("Recibo de Acerto de Maleta", 105, 15, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text("Data do Acerto: " + format(new Date(acerto.settlement_date), "dd/MM/yyyy", { locale: ptBR }), 105, 22, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text("Dados da Maleta", 14, 30);
      
      // Informações da maleta
      const maletaData = [
        ["Código da Maleta:", acerto.suitcase?.code || "N/A"],
        ["Revendedora:", acerto.seller?.name || "N/A"],
        ["Total em Vendas:", AcertoMaletaController.formatCurrency(acerto.total_sales)],
        ["Comissão:", AcertoMaletaController.formatCurrency(acerto.commission_amount)],
        ["Valor Líquido:", AcertoMaletaController.formatCurrency(acerto.total_sales - acerto.commission_amount)]
      ];
      
      autoTable(doc, {
        startY: 35,
        head: [],
        body: maletaData,
        theme: 'plain',
        styles: {
          cellPadding: 2,
          fontSize: 10
        },
        columnStyles: {
          0: { cellWidth: 40, fontStyle: 'bold' },
          1: { cellWidth: 80 }
        }
      });
      
      // Cabeçalho da tabela de itens
      doc.setFontSize(12);
      doc.text("Itens Vendidos", 14, doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 10 : 75);
      
      // Table de itens vendidos
      const itemsBody = acerto.items_vendidos?.map(item => [
        item.product?.sku || "N/A",
        item.product?.name || "N/A",
        AcertoMaletaController.formatCurrency(item.price),
        item.customer_name || "N/A"
      ]) || [];
      
      autoTable(doc, {
        startY: doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 15 : 80,
        head: [["Código", "Item", "Valor", "Cliente"]],
        body: itemsBody,
        theme: 'striped',
        headStyles: {
          fillColor: [220, 220, 220],
          textColor: [0, 0, 0],
          fontStyle: 'bold'
        },
        styles: {
          cellPadding: 3,
          fontSize: 9
        }
      });
      
      // Rodapé
      const finalY = doc.lastAutoTable?.finalY || 100;
      doc.setFontSize(10);
      doc.text("Acerto realizado em " + format(new Date(acerto.settlement_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }), 105, finalY + 20, { align: 'center' });
      
      // Assinaturas
      doc.line(30, finalY + 35, 90, finalY + 35); // Linha para assinatura da revendedora
      doc.line(120, finalY + 35, 180, finalY + 35); // Linha para assinatura da empresa
      
      doc.text("Assinatura da Revendedora", 60, finalY + 40, { align: 'center' });
      doc.text("Assinatura da Empresa", 150, finalY + 40, { align: 'center' });
      
      // Salvar o PDF
      doc.save(`Acerto_${acerto.id}_${acerto.suitcase?.code || "maleta"}.pdf`);
      
      setIsGeneratingPdf(false);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      setIsGeneratingPdf(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };
  
  const formatPaymentMethod = (method?: string) => {
    if (!method) return "Não informado";
    
    const methods: Record<string, string> = {
      'cash': 'Dinheiro',
      'credit': 'Cartão de Crédito',
      'debit': 'Cartão de Débito',
      'pix': 'PIX'
    };
    
    return methods[method] || method;
  };

  if (!acerto && !isLoading) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto p-0">
        <div className="p-6 pb-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-pink-500" />
              <h2 className="text-xl font-semibold">
                Detalhes do Acerto {acerto?.suitcase?.code ? `- Maleta ${acerto.suitcase.code}` : ''}
              </h2>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={() => onOpenChange(false)}
            >
              &times;
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
            </div>
          ) : acerto ? (
            <>
              <div className="flex flex-col gap-6 print:block" ref={reportRef}>
                {/* Cabeçalho do relatório para impressão */}
                <div className="hidden print:block">
                  <h1 className="text-center text-2xl font-bold mb-2">Recibo de Acerto de Maleta</h1>
                  <p className="text-center text-sm mb-4">
                    Data do Acerto: {formatDate(acerto.settlement_date)}
                  </p>
                </div>
                
                {/* Resumo do acerto */}
                <div className="print:mb-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Clock className="h-4 w-4 text-pink-500" />
                          Resumo do Acerto
                        </CardTitle>
                        <Badge 
                          variant={acerto.status === 'concluido' ? 'default' : 'outline'}
                          className={acerto.status === 'concluido' 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200 border-green-300' 
                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300'}
                        >
                          {acerto.status === 'concluido' ? 'Concluído' : 'Pendente'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Maleta</p>
                          <p className="font-medium">{acerto.suitcase?.code || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Revendedora</p>
                          <p className="font-medium">{acerto.seller?.name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Data do Acerto</p>
                          <p className="font-medium flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                            {formatDate(acerto.settlement_date)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Próximo Acerto</p>
                          <p className="font-medium flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                            {formatDate(acerto.next_settlement_date)}
                          </p>
                        </div>
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-3 rounded-md">
                          <p className="text-sm text-muted-foreground">Total em Vendas</p>
                          <p className="text-xl font-bold">{AcertoMaletaController.formatCurrency(acerto.total_sales)}</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-md">
                          <p className="text-sm text-green-600">Comissão da Revendedora</p>
                          <p className="text-xl font-bold text-green-600">{AcertoMaletaController.formatCurrency(acerto.commission_amount)}</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-md">
                          <p className="text-sm text-blue-600">Valor Líquido</p>
                          <p className="text-xl font-bold text-blue-600">{AcertoMaletaController.formatCurrency(acerto.total_sales - acerto.commission_amount)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Lista de itens vendidos */}
                <div className="print:mb-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Package2 className="h-4 w-4 text-pink-500" />
                        Itens Vendidos
                        <span className="text-sm font-normal text-muted-foreground ml-2">
                          {acerto.items_vendidos?.length || 0} item(ns)
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {acerto.items_vendidos && acerto.items_vendidos.length > 0 ? (
                        <div className="space-y-3">
                          {acerto.items_vendidos.map((item: any) => {
                            const photoUrl = item.product?.photos && item.product.photos.length > 0 
                              ? formatPhotoUrl(item.product.photos[0]?.photo_url) 
                              : null;
                            
                            return (
                              <div key={item.id} className="border rounded-md p-3">
                                <div className="flex">
                                  <div className="w-16 h-16 bg-gray-100 rounded-md mr-3 flex-shrink-0 print:hidden">
                                    {photoUrl ? (
                                      <img src={photoUrl} alt={item.product?.name} className="w-full h-full object-cover rounded-md" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <Package2 className="h-8 w-8" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex justify-between">
                                      <div>
                                        <h4 className="font-medium">{item.product?.name}</h4>
                                        <p className="text-sm text-muted-foreground">
                                          Código: {item.product?.sku}
                                        </p>
                                        <p className="font-medium text-pink-600">
                                          {AcertoMaletaController.formatCurrency(item.price)}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-xs text-muted-foreground">
                                          Vendido em: {formatDate(item.sale_date)}
                                        </p>
                                        {item.customer_name && (
                                          <p className="text-xs flex items-center justify-end gap-1 mt-1">
                                            <User className="h-3 w-3" />
                                            {item.customer_name}
                                          </p>
                                        )}
                                        {item.payment_method && (
                                          <p className="text-xs flex items-center justify-end gap-1">
                                            <CreditCard className="h-3 w-3" />
                                            {formatPaymentMethod(item.payment_method)}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {acerto.seller?.commission_rate && (
                                      <div className="grid grid-cols-3 gap-2 mt-2 text-xs border-t pt-2">
                                        <div>
                                          <span className="text-muted-foreground">Comissão:</span>
                                          <p className="font-medium text-green-600">
                                            {AcertoMaletaController.formatCurrency(item.commission_value || (item.price * acerto.seller.commission_rate))}
                                          </p>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Custo:</span>
                                          <p className="font-medium">
                                            {AcertoMaletaController.formatCurrency(item.unit_cost || 0)}
                                          </p>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Lucro líquido:</span>
                                          <p className="font-medium text-blue-600">
                                            {AcertoMaletaController.formatCurrency(item.net_profit || (item.price - (item.price * (acerto.seller.commission_rate || 0)) - (item.unit_cost || 0)))}
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          Nenhum item vendido registrado neste acerto.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                {/* Assinaturas para impressão */}
                <div className="hidden print:block mt-12">
                  <div className="grid grid-cols-2 gap-12">
                    <div className="text-center">
                      <div className="border-t border-gray-300 pt-2 mt-12 mx-8"></div>
                      <p>Assinatura da Revendedora</p>
                    </div>
                    <div className="text-center">
                      <div className="border-t border-gray-300 pt-2 mt-12 mx-8"></div>
                      <p>Assinatura da Empresa</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handlePrint}
                  className="gap-1"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExportPDF}
                  disabled={isGeneratingPdf}
                  className="gap-1"
                >
                  <Download className="h-4 w-4" />
                  {isGeneratingPdf ? 'Gerando PDF...' : 'Exportar PDF'}
                </Button>
                {acerto.receipt_url && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(acerto.receipt_url, '_blank')}
                    className="gap-1"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Recibo Online
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-gray-300" />
              <h3 className="mt-2 text-lg font-medium">Nenhum dado encontrado</h3>
              <p className="text-sm text-muted-foreground">
                Não foi possível carregar os detalhes deste acerto.
              </p>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
