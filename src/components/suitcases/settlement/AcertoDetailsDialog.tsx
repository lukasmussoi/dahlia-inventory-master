
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Acerto, AcertoItem } from "@/types/suitcase";
import { AcertoMaletaController } from "@/controllers/acertoMaletaController";
import { Printer, ShoppingBag, AlertCircle, CheckCircle2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

interface AcertoDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  acerto: Acerto | null;
  onRefresh?: () => void;
}

export function AcertoDetailsDialog({ open, onOpenChange, acerto, onRefresh }: AcertoDetailsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [acertoDetails, setAcertoDetails] = useState<Acerto | null>(null);
  
  // Carregar detalhes completos do acerto quando o diálogo for aberto
  useEffect(() => {
    if (open && acerto) {
      loadAcertoDetails(acerto.id);
    } else {
      setAcertoDetails(null);
    }
  }, [open, acerto]);
  
  const loadAcertoDetails = async (acertoId: string) => {
    try {
      setLoading(true);
      const details = await AcertoMaletaController.getAcertoById(acertoId);
      setAcertoDetails(details);
    } catch (error) {
      console.error("Erro ao carregar detalhes do acerto:", error);
      toast.error("Erro ao carregar detalhes do acerto");
    } finally {
      setLoading(false);
    }
  };
  
  // Imprimir recibo
  const handlePrintReceipt = async () => {
    if (!acerto) return;
    
    try {
      const pdfUrl = await AcertoMaletaController.generateReceiptPDF(acerto.id);
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error("Erro ao gerar PDF do acerto:", error);
      toast.error("Erro ao gerar recibo em PDF");
    }
  };
  
  // Concluir acerto pendente
  const handleCompleteAcerto = async () => {
    if (!acerto) return;
    
    try {
      setLoading(true);
      await AcertoMaletaController.updateAcertoStatus(acerto.id, 'concluido');
      
      if (onRefresh) {
        onRefresh();
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao concluir acerto:", error);
      toast.error("Erro ao concluir acerto");
    } finally {
      setLoading(false);
    }
  };
  
  // Formatar status
  const formatStatus = (status: string) => {
    switch (status) {
      case 'pendente': return { text: 'Pendente', className: 'bg-yellow-100 text-yellow-800' };
      case 'concluido': return { text: 'Concluído', className: 'bg-green-100 text-green-800' };
      default: return { text: status, className: 'bg-gray-100 text-gray-800' };
    }
  };
  
  // Formatar data
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };
  
  // Verificar se há uma próxima data de acerto definida
  const hasNextSettlementDate = acertoDetails?.next_settlement_date != null;
  
  if (!acertoDetails && !loading) {
    return null;
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Acerto</DialogTitle>
          <DialogDescription>
            {acertoDetails ? (
              <div className="flex flex-col gap-1 mt-2">
                <p><span className="font-semibold">Maleta:</span> {acertoDetails.suitcase?.code}</p>
                <p><span className="font-semibold">Revendedora:</span> {acertoDetails.seller?.name}</p>
                <p><span className="font-semibold">Data do Acerto:</span> {formatDate(acertoDetails.settlement_date)}</p>
                <div className="mt-1">
                  {formatStatus(acertoDetails.status).text === "Pendente" ? (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <AlertCircle className="h-3.5 w-3.5 mr-1" />
                      Pendente
                    </Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Concluído
                    </Badge>
                  )}
                </div>
              </div>
            ) : (
              <p>Carregando informações do acerto...</p>
            )}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
          </div>
        ) : acertoDetails ? (
          <Tabs defaultValue="summary">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="summary">Resumo</TabsTrigger>
              <TabsTrigger value="items">Itens Vendidos</TabsTrigger>
              <TabsTrigger value="suggestions">Sugestões</TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary">
              <Card>
                <CardHeader>
                  <CardTitle>Resumo do Acerto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Dados financeiros */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <h3 className="font-medium mb-3 text-slate-800">Dados Financeiros</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Total de Vendas:</span>
                          <span className="font-semibold">
                            {AcertoMaletaController.formatCurrency(acertoDetails.total_sales)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Comissão:</span>
                          <span className="font-semibold">
                            {AcertoMaletaController.formatCurrency(acertoDetails.commission_amount)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Taxa de Comissão:</span>
                          <span className="font-semibold">
                            {((acertoDetails.commission_amount / acertoDetails.total_sales) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <h3 className="font-medium mb-3 text-slate-800">Datas</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Data do Acerto:</span>
                          <span className="font-semibold">
                            {formatDate(acertoDetails.settlement_date)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Próximo Acerto:</span>
                          <span className="font-semibold">
                            {formatDate(acertoDetails.next_settlement_date)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Criado em:</span>
                          <span className="font-semibold">
                            {formatDate(acertoDetails.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Contagem de itens */}
                  <div className="bg-slate-50 p-4 rounded-lg mt-4">
                    <h3 className="font-medium mb-3 text-slate-800">Itens</h3>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total de Itens Vendidos:</span>
                      <span className="font-semibold">
                        {acertoDetails.items_vendidos?.length || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="items">
              <Card>
                <CardHeader>
                  <CardTitle>Itens Vendidos</CardTitle>
                </CardHeader>
                <CardContent>
                  {acertoDetails.items_vendidos && acertoDetails.items_vendidos.length > 0 ? (
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produto</TableHead>
                            <TableHead>Código</TableHead>
                            <TableHead className="text-right">Preço</TableHead>
                            <TableHead>Data da Venda</TableHead>
                            <TableHead>Cliente</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {acertoDetails.items_vendidos.map((item: AcertoItem) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  {item.product?.photo_url ? (
                                    <img 
                                      src={item.product.photo_url} 
                                      alt={item.product.name}
                                      className="h-10 w-10 rounded object-cover"
                                    />
                                  ) : (
                                    <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center">
                                      <ShoppingBag className="h-5 w-5 text-slate-400" />
                                    </div>
                                  )}
                                  <span>{item.product?.name || "Produto sem nome"}</span>
                                </div>
                              </TableCell>
                              <TableCell>{item.product?.sku || "-"}</TableCell>
                              <TableCell className="text-right">
                                {AcertoMaletaController.formatCurrency(item.price)}
                              </TableCell>
                              <TableCell>{formatDate(item.sale_date)}</TableCell>
                              <TableCell>{item.customer_name || "-"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingBag className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                      <h3 className="text-lg font-medium">Nenhum item vendido</h3>
                      <p className="mt-1">
                        Não foram registradas vendas neste acerto.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="suggestions">
              <Card>
                <CardHeader>
                  <CardTitle>Sugestões de Reabastecimento</CardTitle>
                </CardHeader>
                <CardContent>
                  {acertoDetails.restock_suggestions ? (
                    <div className="space-y-6">
                      {/* Alta demanda */}
                      <div>
                        <h3 className="text-base font-semibold mb-3 flex items-center">
                          <Badge className="bg-green-100 text-green-800 mr-2">Alta Prioridade</Badge>
                          Itens com Alta Demanda
                        </h3>
                        
                        {acertoDetails.restock_suggestions.highDemand && 
                         acertoDetails.restock_suggestions.highDemand.length > 0 ? (
                          <ul className="space-y-2">
                            {acertoDetails.restock_suggestions.highDemand.map((item: any) => (
                              <li key={item.id} className="bg-green-50 p-3 rounded-lg border border-green-100">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-sm text-slate-500">Código: {item.sku}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium text-green-700">
                                      {item.count} vendas nos últimos 90 dias
                                    </p>
                                    <p className="text-sm text-slate-500">
                                      Última venda: {formatDate(item.lastSold)}
                                    </p>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-slate-500 italic py-2">
                            Nenhum item com alta demanda encontrado.
                          </p>
                        )}
                      </div>
                      
                      {/* Média demanda */}
                      <div>
                        <h3 className="text-base font-semibold mb-3 flex items-center">
                          <Badge className="bg-yellow-100 text-yellow-800 mr-2">Média Prioridade</Badge>
                          Itens com Demanda Média
                        </h3>
                        
                        {acertoDetails.restock_suggestions.mediumDemand && 
                         acertoDetails.restock_suggestions.mediumDemand.length > 0 ? (
                          <ul className="space-y-2">
                            {acertoDetails.restock_suggestions.mediumDemand.map((item: any) => (
                              <li key={item.id} className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-sm text-slate-500">Código: {item.sku}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium text-yellow-700">
                                      {item.count} vendas nos últimos 90 dias
                                    </p>
                                    <p className="text-sm text-slate-500">
                                      Última venda: {formatDate(item.lastSold)}
                                    </p>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-slate-500 italic py-2">
                            Nenhum item com demanda média encontrado.
                          </p>
                        )}
                      </div>
                      
                      {/* Baixa demanda */}
                      <div>
                        <h3 className="text-base font-semibold mb-3 flex items-center">
                          <Badge className="bg-blue-100 text-blue-800 mr-2">Baixa Prioridade</Badge>
                          Itens com Baixa Demanda
                        </h3>
                        
                        {acertoDetails.restock_suggestions.lowDemand && 
                         acertoDetails.restock_suggestions.lowDemand.length > 0 ? (
                          <ul className="space-y-2">
                            {acertoDetails.restock_suggestions.lowDemand.map((item: any) => (
                              <li key={item.id} className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-sm text-slate-500">Código: {item.sku}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium text-blue-700">
                                      {item.count} venda nos últimos 90 dias
                                    </p>
                                    <p className="text-sm text-slate-500">
                                      Última venda: {formatDate(item.lastSold)}
                                    </p>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-slate-500 italic py-2">
                            Nenhum item com baixa demanda encontrado.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <AlertCircle className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                      <h3 className="text-lg font-medium">Nenhuma sugestão disponível</h3>
                      <p className="mt-1">
                        Não foi possível gerar sugestões de reabastecimento.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : null}
        
        <DialogFooter className="flex justify-between mt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
          
          <div className="flex gap-2">
            {acertoDetails && acertoDetails.status === 'pendente' && (
              <Button
                onClick={handleCompleteAcerto}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Marcar como Concluído
              </Button>
            )}
            
            <Button
              onClick={handlePrintReceipt}
              disabled={loading}
              className="bg-pink-500 hover:bg-pink-600"
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir Recibo
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
