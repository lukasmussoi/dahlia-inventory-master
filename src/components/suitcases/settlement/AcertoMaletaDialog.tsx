import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Check, X, BarcodeIcon, ShoppingBag, FileText, Printer } from "lucide-react";
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
import { SuitcaseModel } from "@/models/suitcaseModel";
import { openPdfInNewTab } from "@/utils/pdfUtils";
import { supabase } from "@/integrations/supabase/client";
import { SuitcaseItemModel } from "@/models/suitcase/suitcaseItemModel";
import { AcertoMaletaModel } from "@/models/acertoMaletaModel";
import { SellerModel } from "@/models/suitcase/sellerModel";

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
  const [commissionRate, setCommissionRate] = useState<number>(0.3);

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
      
      if (suitcase.seller_id) {
        const rate = await SellerModel.getSellerCommissionRate(suitcase.seller_id);
        setCommissionRate(rate);
        console.log("Taxa de comissão carregada:", rate);
      }
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

  const handleToggleSold = async (item: any, sold: boolean) => {
    if (sold) {
      setScannedItemsIds(prev => prev.filter(id => id !== item.id));
    } else {
      setScannedItemsIds(prev => [...prev, item.id]);
    }
  };

  const returnVerifiedItemsToInventory = async () => {
    for (const itemId of scannedItemsIds) {
      try {
        await SuitcaseModel.returnItemToInventory(itemId);
      } catch (error) {
        console.error(`Erro ao devolver item ${itemId} ao estoque:`, error);
      }
    }
  };

  const markUnverifiedItemsAsSold = async () => {
    const unverifiedItemIds = suitcaseItems
      .filter(item => !scannedItemsIds.includes(item.id))
      .map(item => item.id);
    
    for (const itemId of unverifiedItemIds) {
      try {
        await SuitcaseController.updateSuitcaseItemStatus(itemId, 'sold');
      } catch (error) {
        console.error(`Erro ao marcar item ${itemId} como vendido:`, error);
      }
    }
  };

  const generateReceiptPDF = async (acertoId: string) => {
    try {
      setGeneratingPdf(true);
      console.log("Gerando PDF para acerto ID:", acertoId);
      const pdfDataUrl = await AcertoMaletaController.generateReceiptPDF(acertoId);
      console.log("PDF gerado com sucesso");
      setPdfUrl(pdfDataUrl);
      return pdfDataUrl;
    } catch (error) {
      console.error("Erro ao gerar PDF do recibo:", error);
      toast.error("Não foi possível gerar o PDF do recibo");
      return null;
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleFinishSettlement = async () => {
    if (!suitcase) return;
    
    try {
      setIsSubmitting(true);
      
      const itemsPresentIds = suitcaseItems
        .filter(item => scannedItemsIds.includes(item.id))
        .map(item => item.id);
      
      const itemsSoldIds = suitcaseItems
        .filter(item => !scannedItemsIds.includes(item.id))
        .map(item => item.id);
      
      const formData: SuitcaseSettlementFormData = {
        suitcase_id: suitcase.id,
        seller_id: suitcase.seller_id,
        settlement_date: settlementDate,
        next_settlement_date: nextSettlementDate,
        items_present: itemsPresentIds,
        items_sold: itemsSoldIds
      };
      
      console.log("Iniciando acerto com dados:", formData);
      console.log(`Itens vendidos: ${itemsSoldIds.length}, Itens verificados: ${itemsPresentIds.length}`);
      
      const { data: pendingAcerto, error: createError } = await supabase
        .from('acertos_maleta')
        .insert({
          suitcase_id: suitcase.id,
          seller_id: suitcase.seller_id,
          settlement_date: settlementDate.toISOString(),
          next_settlement_date: nextSettlementDate ? nextSettlementDate.toISOString() : null,
          status: 'pendente',
          total_sales: 0,
          commission_amount: 0
        })
        .select()
        .single();
      
      if (createError) {
        console.error("Erro ao criar acerto pendente:", createError);
        throw new Error("Erro ao criar acerto pendente");
      }
      
      if (!pendingAcerto) {
        throw new Error("Não foi possível criar o acerto");
      }
      
      const acertoId = pendingAcerto.id;
      
      await AcertoMaletaModel.processAcertoItems(
        acertoId,
        suitcase.id,
        itemsPresentIds,
        itemsSoldIds
      );
      
      let totalSales = 0;
      
      if (itemsSoldIds.length > 0) {
        const { data: soldItems, error } = await supabase
          .from('inventory')
          .select('price')
          .in('id', itemsSoldIds.map(id => {
            const item = suitcaseItems.find(i => i.id === id);
            return item ? item.inventory_id : null;
          }).filter(Boolean));
        
        if (error) {
          console.error("Erro ao buscar detalhes dos itens vendidos:", error);
          toast.warning("Erro ao calcular valor total das vendas, usando valor aproximado");
          totalSales = suitcaseItems
            .filter(item => itemsSoldIds.includes(item.id))
            .reduce((sum, item) => sum + (item.product?.price || 0), 0);
        } else if (soldItems) {
          totalSales = soldItems.reduce((sum, item) => sum + (item.price || 0), 0);
        }
      }
      
      const commissionRate = suitcase.seller?.commission_rate || 0.3;
      const commissionAmount = totalSales * commissionRate;
      const commissionPercentFormatted = (commissionRate * 100).toFixed(0);
      
      const { data: updatedAcerto, error: updateError } = await supabase
        .from('acertos_maleta')
        .update({
          status: 'concluido',
          total_sales: totalSales,
          commission_amount: commissionAmount
        })
        .eq('id', acertoId)
        .select()
        .single();
      
      if (updateError) {
        console.error("Erro ao finalizar acerto:", updateError);
        throw new Error("Erro ao finalizar acerto");
      }
      
      if (nextSettlementDate) {
        await supabase
          .from('suitcases')
          .update({ 
            next_settlement_date: nextSettlementDate.toISOString() 
          })
          .eq('id', suitcase.id);
      }
      
      setCreatedAcertoId(acertoId);
      
      const pdfUrl = await generateReceiptPDF(acertoId);
      
      if (pdfUrl) {
        toast.success("Acerto da maleta realizado com sucesso! PDF gerado.");
      } else {
        toast.warning("Acerto da maleta realizado, mas houve erro ao gerar PDF.");
      }
      
      queryClient.invalidateQueries({ queryKey: ['suitcases'] });
      queryClient.invalidateQueries({ queryKey: ['acertos'] });
      queryClient.invalidateQueries({ queryKey: ['suitcase-items'] });
      
      if (onSuccess) {
        onSuccess();
      }
      
      const { data: remainingItems, error: checkError } = await supabase
        .from('suitcase_items')
        .select('id, status')
        .eq('suitcase_id', suitcase.id);
      
      if (checkError) {
        console.error(`Erro ao verificar itens restantes na maleta ${suitcase.id}:`, checkError);
      } else if (remainingItems && remainingItems.length > 0) {
        console.warn(`VERIFICAÇÃO FINAL: Encontrados ${remainingItems.length} itens ainda na maleta após o acerto. Removendo definitivamente...`);
        
        const soldRemaining = remainingItems.filter(item => item.status === 'sold');
        const otherRemaining = remainingItems.filter(item => item.status !== 'sold');
        
        if (soldRemaining.length > 0) {
          console.log(`${soldRemaining.length} itens vendidos ainda na maleta. Registrando e removendo...`);
          
          for (const item of soldRemaining) {
            const suitcaseItem = await SuitcaseItemModel.getSuitcaseItemById(item.id);
            if (suitcaseItem) {
              const { data: alreadyRegistered } = await supabase
                .from('acerto_itens_vendidos')
                .select('id')
                .eq('suitcase_item_id', item.id)
                .eq('acerto_id', acertoId);
              
              if (!alreadyRegistered || alreadyRegistered.length === 0) {
                await supabase
                  .from('acerto_itens_vendidos')
                  .insert({
                    acerto_id: acertoId,
                    suitcase_item_id: item.id,
                    inventory_id: suitcaseItem.inventory_id,
                    price: suitcaseItem.product?.price || 0,
                    unit_cost: suitcaseItem.product?.unit_cost || 0
                  });
              }
            }
          }
        }
        
        if (otherRemaining.length > 0) {
          console.log(`${otherRemaining.length} outros itens ainda na maleta. Devolvendo ao estoque...`);
          
          for (const item of otherRemaining) {
            try {
              await SuitcaseItemModel.returnItemToInventory(item.id);
            } catch (error) {
              console.error(`Erro ao devolver item ${item.id} ao estoque:`, error);
            }
          }
        }
        
        try {
          const { error: forceDeleteError } = await supabase
            .from('suitcase_items')
            .delete()
            .eq('suitcase_id', suitcase.id);
          
          if (forceDeleteError) {
            console.error(`Erro na remoção final de itens da maleta:`, forceDeleteError);
            toast.warning("Alguns itens podem não ter sido completamente removidos da maleta");
          } else {
            console.log(`Remoção final bem-sucedida: ${remainingItems.length} itens removidos da maleta ${suitcase.id}`);
          }
        } catch (finalError) {
          console.error("Erro na tentativa final de limpar a maleta:", finalError);
        }
      } else {
        console.log(`VERIFICAÇÃO FINAL APROVADA: Maleta ${suitcase.id} está vazia após o acerto. Sucesso total!`);
      }
      
    } catch (error: any) {
      console.error("Erro ao realizar acerto:", error);
      toast.error(error.message || "Erro ao realizar acerto da maleta");
    } finally {
      setIsSubmitting(false);
    }
  };

  const processItemsSold = async (itemIds: string[], acertoId: string): Promise<number> => {
    let totalSales = 0;
    
    if (itemIds.length > 0) {
      const { data: items, error } = await supabase
        .from('suitcase_items')
        .select(`
          id,
          inventory_id,
          product:inventory_id (
            id,
            name,
            price,
            unit_cost
          )
        `)
        .in('id', itemIds);
      
      if (error) {
        console.error("Erro ao buscar itens para acerto:", error);
        throw new Error("Erro ao processar itens vendidos");
      }
      
      if (items) {
        for (const item of items) {
          await supabase
            .from('suitcase_items')
            .update({ status: 'sold' })
            .eq('id', item.id);
          
          await supabase
            .from('acerto_itens_vendidos')
            .insert({
              acerto_id: acertoId,
              suitcase_item_id: item.id,
              inventory_id: item.inventory_id,
              price: item.product?.price || 0,
              unit_cost: item.product?.unit_cost || 0
            });
          
          totalSales += item.product?.price || 0;
        }
      }
    }
    
    return totalSales;
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
      console.log("Abrindo PDF em nova aba:", pdfUrl.substring(0, 50) + "...");
      openPdfInNewTab(pdfUrl);
    } else {
      toast.error("URL do PDF não disponível");
    }
  };

  const totalItems = suitcaseItems.length;
  const scannedItems = scannedItemsIds.length;
  const missingSoldItems = totalItems - scannedItems;
  
  const soldItems = suitcaseItems.filter(item => !scannedItemsIds.includes(item.id));
  const totalSaleValue = soldItems.reduce((sum, item) => sum + (item.product?.price || 0), 0);
  
  const commissionRate = suitcase?.seller?.commission_rate || 0.3;
  const commissionAmount = totalSaleValue * commissionRate;
  const commissionPercentFormatted = (commissionRate * 100).toFixed(0);
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
                  O acerto da maleta foi registrado com sucesso.
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
                      className="w-full md:w-auto bg-blue-600 hover:bg-blue-700" 
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
                        <span className="text-slate-600">Comissão da revendedora ({commissionPercentFormatted}%):</span>
                        <span className="font-semibold text-green-600">
                          {AcertoMaletaController.formatCurrency(commissionAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-sm text-yellow-800 mt-2">
                    <p className="flex items-start">
                      <span className="mr-2">���️</span>
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
                    disabled={loading || isSubmitting || (nextSettlementDate === undefined)}
                    className="bg-pink-500 hover:bg-pink-600"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Finalizar Acerto
                      </>
                    )}
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
