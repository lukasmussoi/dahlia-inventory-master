import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Check, X, BarcodeIcon, ShoppingBag, FileText, Printer, Package } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { SuitcaseItem, Suitcase } from "@/types/suitcase";
import { SuitcaseController } from "@/controllers/suitcaseController";
import { AcertoMaletaController } from "@/controllers/acertoMaletaController";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { SuitcaseSettlementFormData } from "@/types/suitcase";
import { getProductPhotoUrl } from "@/utils/photoUtils";
import { useQueryClient } from "@tanstack/react-query";

interface AcertoMaletaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suitcase: Suitcase | null;
  onSuccess?: () => void;
}

export function AcertoMaletaDialog({ open, onOpenChange, suitcase, onSuccess }: AcertoMaletaDialogProps) {
  const queryClient = useQueryClient();
  const [suitcaseItems, setSuitcaseItems] = useState<SuitcaseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannedItemsIds, setScannedItemsIds] = useState<string[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [settlementDate, setSettlementDate] = useState<Date>(new Date());
  const [nextSettlementDate, setNextSettlementDate] = useState<Date | undefined>(undefined);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [createdAcertoId, setCreatedAcertoId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && suitcase) {
      loadSuitcaseItems();
    } else {
      setSuitcaseItems([]);
      setScannedItemsIds([]);
      setBarcodeInput("");
      setSettlementDate(new Date());
      setNextSettlementDate(undefined);
      setPdfUrl(null);
      setCreatedAcertoId(null);
    }
  }, [open, suitcase]);

  const loadSuitcaseItems = async () => {
    if (!suitcase) return;
    
    try {
      setLoading(true);
      const items = await SuitcaseController.getSuitcaseItems(suitcase.id);
      const activeItems = items.filter(item => item.status === 'in_possession');
      setSuitcaseItems(activeItems);
    } catch (error) {
      console.error("Erro ao carregar itens da maleta:", error);
      toast.error("Erro ao carregar itens da maleta");
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScanned = (barcode: string) => {
    const matchedItem = suitcaseItems.find(item => 
      item.product?.sku === barcode || 
      item.inventory_id === barcode
    );

    if (matchedItem) {
      if (!scannedItemsIds.includes(matchedItem.id)) {
        setScannedItemsIds(prev => [...prev, matchedItem.id]);
        toast.success(`Item "${matchedItem.product?.name}" verificado com sucesso!`);
      } else {
        toast.info("Este item já foi escaneado.");
      }
    } else {
      toast.error("Item não encontrado nesta maleta.");
    }

    setBarcodeInput("");
  };

  const handleBarcodeInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBarcodeScanned(barcodeInput);
    }
  };

  const startScanning = () => {
    setScanning(true);
    setTimeout(() => {
      document.getElementById('barcode-input')?.focus();
    }, 100);
  };

  const stopScanning = () => {
    setScanning(false);
    setBarcodeInput("");
  };

  const checkItemManually = (itemId: string) => {
    if (scannedItemsIds.includes(itemId)) {
      setScannedItemsIds(prev => prev.filter(id => id !== itemId));
    } else {
      setScannedItemsIds(prev => [...prev, itemId]);
    }
  };

  const handleFinishSettlement = async () => {
    if (!suitcase) return;
    
    try {
      setIsSubmitting(true);
      
      const formData: SuitcaseSettlementFormData = {
        suitcase_id: suitcase.id,
        seller_id: suitcase.seller_id,
        settlement_date: settlementDate,
        next_settlement_date: nextSettlementDate,
        items_present: scannedItemsIds,
        items_sold: [] // Array vazio para items_sold, serão detectados pelo backend
      };
      
      const result = await AcertoMaletaController.createAcerto(formData);
      
      toast.success("Acerto da maleta realizado com sucesso! Todos os itens restantes foram devolvidos ao estoque.");
      
      queryClient.invalidateQueries({ queryKey: ['suitcases'] });
      queryClient.invalidateQueries({ queryKey: ['acertos'] });
      
      setCreatedAcertoId(result);
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error: any) {
      console.error("Erro ao realizar acerto:", error);
      toast.error(error.message || "Erro ao realizar acerto da maleta");
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkAllItems = () => {
    const allItemIds = suitcaseItems.map(item => item.id);
    setScannedItemsIds(allItemIds);
    toast.success("Todos os itens verificados");
  };

  const clearAllChecked = () => {
    setScannedItemsIds([]);
    toast.info("Verificação de itens limpa");
  };

  const handlePrintReceipt = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  const totalItems = suitcaseItems.length;
  const scannedItems = scannedItemsIds.length;
  const missingSoldItems = totalItems - scannedItems;
  
  const soldItems = suitcaseItems.filter(item => !scannedItemsIds.includes(item.id));
  const totalSaleValue = soldItems.reduce((sum, item) => sum + (item.product?.price || 0), 0);
  
  const commissionRate = suitcase?.seller?.commission_rate || 0.3;
  const commissionAmount = totalSaleValue * commissionRate;
  const solvedPieces = soldItems.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Acerto da Maleta</DialogTitle>
          <DialogDescription>
            {suitcase ? (
              <div className="flex flex-col gap-1 mt-2">
                <p><span className="font-semibold">Maleta:</span> {suitcase.code}</p>
                <p><span className="font-semibold">Revendedora:</span> {suitcase.seller?.name}</p>
                <p><span className="font-semibold">Cidade:</span> {suitcase.city}, {suitcase.neighborhood}</p>
              </div>
            ) : (
              <p>Carregando informações da maleta...</p>
            )}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
          </div>
        ) : createdAcertoId ? (
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-green-600">Acerto Concluído com Sucesso!</CardTitle>
                <CardDescription className="text-center">
                  O acerto da maleta foi registrado com sucesso e todos os itens restantes foram devolvidos ao estoque.
                  A maleta agora está vazia e pronta para uma nova reposição.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Total de Itens:</span>
                    <span className="font-semibold">{totalItems}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Itens Vendidos:</span>
                    <span className="font-semibold">{missingSoldItems}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Total em Vendas:</span>
                    <span className="font-semibold">{AcertoMaletaController.formatCurrency(totalSaleValue)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Data do Acerto:</span>
                    <span className="font-semibold">{format(settlementDate, "dd/MM/yyyy", { locale: ptBR })}</span>
                  </div>
                </div>

                {generatingPdf ? (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500"></div>
                    <p>Gerando recibo em PDF...</p>
                  </div>
                ) : pdfUrl ? (
                  <div className="flex justify-center">
                    <Button 
                      className="w-full md:w-auto" 
                      onClick={handlePrintReceipt}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Visualizar/Imprimir Recibo
                    </Button>
                  </div>
                ) : null}
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Fechar
                </Button>
              </CardFooter>
            </Card>
          </div>
        ) : (
          <Tabs defaultValue="items">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="items">Verificação de Itens</TabsTrigger>
              <TabsTrigger value="settlement">Detalhes do Acerto</TabsTrigger>
            </TabsList>
            
            <TabsContent value="items">
              <Card>
                <CardHeader>
                  <CardTitle>Verificação de Itens na Maleta</CardTitle>
                  <CardDescription>
                    Escaneie os itens presentes na maleta ou marque-os manualmente. Os itens não verificados
                    serão considerados como vendidos no acerto.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                    <div className="bg-slate-100 p-3 rounded-lg">
                      <p className="text-sm text-slate-600">Total de Itens</p>
                      <p className="text-lg font-bold">{totalItems}</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-lg">
                      <p className="text-sm text-green-600">Itens Verificados</p>
                      <p className="text-lg font-bold">{scannedItems}</p>
                    </div>
                    <div className="bg-pink-100 p-3 rounded-lg">
                      <p className="text-sm text-pink-600">Itens Vendidos</p>
                      <p className="text-lg font-bold">{missingSoldItems}</p>
                    </div>
                  </div>
                  
                  {scanning ? (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium text-blue-700 flex items-center">
                          <BarcodeIcon className="h-4 w-4 mr-2" />
                          Modo Escaneamento
                        </h3>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={stopScanning}
                          className="text-blue-700"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Parar
                        </Button>
                      </div>
                      <p className="text-sm text-blue-600 mb-3">
                        Escaneie o código de barras ou insira o código do produto manualmente
                      </p>
                      <Input
                        id="barcode-input"
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        onKeyDown={handleBarcodeInputKeyDown}
                        placeholder="Código do produto ou código de barras"
                        className="bg-white"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className="flex space-x-2">
                      <Button 
                        onClick={startScanning} 
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <BarcodeIcon className="h-4 w-4 mr-2" />
                        Iniciar Escaneamento
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={checkAllItems}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Verificar Todos
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={clearAllChecked}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Limpar
                      </Button>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <h3 className="font-medium mb-2">Itens na Maleta</h3>
                    
                    {suitcaseItems.length === 0 ? (
                      <p className="text-slate-500 italic">Nenhum item encontrado nesta maleta</p>
                    ) : (
                      <div className="border rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Item
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Código
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Preço
                              </th>
                              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {suitcaseItems.map((item) => {
                              const isChecked = scannedItemsIds.includes(item.id);
                              return (
                                <tr 
                                  key={item.id}
                                  className={cn(
                                    "hover:bg-gray-50 cursor-pointer",
                                    isChecked ? "bg-green-50" : ""
                                  )}
                                  onClick={() => checkItemManually(item.id)}
                                >
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="flex-shrink-0 h-10 w-10">
                                        {item.product?.photo_url ? (
                                          <img
                                            src={getProductPhotoUrl(item.product?.photo_url)} 
                                            alt={item.product?.name || "Produto"} 
                                            className="w-full h-full object-cover rounded-md" 
                                          />
                                        ) : (
                                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                            <ShoppingBag className="h-5 w-5 text-gray-500" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">
                                          {item.product?.name || "Produto sem nome"}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{item.product?.sku || "-"}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                      {item.product ? AcertoMaletaController.formatCurrency(item.product.price) : "-"}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right">
                                    {isChecked ? (
                                      <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                                        <Check className="h-3 w-3 mr-1" />
                                        Presente
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-pink-100 text-pink-800 hover:bg-pink-200">
                                        Vendido
                                      </Badge>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="settlement">
              <Card>
                <CardHeader>
                  <CardTitle>Detalhes do Acerto</CardTitle>
                  <CardDescription>
                    Configure as datas e revise os detalhes do acerto antes de finalizar.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="settlement-date">Data do Acerto</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="settlement-date"
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {settlementDate ? format(settlementDate, "PPP", { locale: ptBR }) : "Selecione uma data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={settlementDate}
                            onSelect={(date) => date && setSettlementDate(date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="next-settlement-date">Próxima Data de Acerto</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="next-settlement-date"
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {nextSettlementDate 
                              ? format(nextSettlementDate, "PPP", { locale: ptBR }) 
                              : "Selecione uma data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={nextSettlementDate}
                            onSelect={setNextSettlementDate}
                            initialFocus
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-lg mt-4 border border-slate-200">
                    <h3 className="font-medium mb-3">Resumo do Acerto</h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Total de itens na maleta:</span>
                        <span className="font-medium">{totalItems}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Itens verificados (presentes):</span>
                        <span className="font-medium">{scannedItems}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Itens vendidos (não verificados):</span>
                        <span className="font-medium text-pink-600">{missingSoldItems}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Peças vendidas:</span>
                        <span className="font-medium text-pink-600">{solvedPieces}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Valor total das vendas:</span>
                        <span className="font-semibold">
                          {AcertoMaletaController.formatCurrency(totalSaleValue)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2 mt-2">
                        <span className="text-slate-600">Comissão da revendedora ({(commissionRate * 100).toFixed(0)}%):</span>
                        <span className="font-semibold text-green-600">
                          {AcertoMaletaController.formatCurrency(commissionAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-sm text-yellow-800 mt-2">
                    <p className="flex items-start">
                      <span className="mr-2">⚠️</span>
                      <span>
                        Os itens não verificados serão marcados como <strong>vendidos</strong>. 
                        Certifique-se de verificar todos os itens presentes na maleta antes de finalizar o acerto.
                      </span>
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => onOpenChange(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleFinishSettlement}
                    disabled={loading || (nextSettlementDate === undefined)}
                    className="bg-pink-500 hover:bg-pink-600"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Finalizar Acerto
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
