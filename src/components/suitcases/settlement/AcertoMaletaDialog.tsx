import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SuitcaseController } from "@/controllers/suitcaseController";
import { Acerto, Suitcase, SuitcaseItem } from "@/types/suitcase";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { SuitcaseInventoryScanner } from "@/components/suitcases/SuitcaseInventoryScanner";
import { AcertoMaletaController } from "@/controllers/acertoMaletaController";
import { Printer, CheckCircle, XCircle, PackageCheck } from "lucide-react";
import { PopoverContent, Popover, PopoverTrigger } from "@/components/ui/popover";
import { openPdfInNewTab } from "@/utils/pdfUtils"; // Importar a nova função
import { Input } from "@/components/ui/input";

interface AcertoMaletaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  maleta: Suitcase | null;
  onAcertoComplete?: (acerto: Acerto) => void;
}

export function AcertoMaletaDialog({
  isOpen,
  onClose,
  maleta,
  onAcertoComplete
}: AcertoMaletaDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [nextSettlementDate, setNextSettlementDate] = useState<Date | undefined>(undefined);
  const [scannedItems, setScannedItems] = useState<SuitcaseItem[]>([]);
  const [unscannedItems, setUnscannedItems] = useState<SuitcaseItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [acertoCompleto, setAcertoCompleto] = useState<boolean>(false);
  const [acerto, setAcerto] = useState<Acerto | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [customerNames, setCustomerNames] = useState<{ [itemId: string]: string }>({});
  const [paymentMethods, setPaymentMethods] = useState<{ [itemId: string]: string }>({});

  useEffect(() => {
    if (maleta) {
      loadSuitcaseItems(maleta.id);
    }
  }, [maleta]);

  const loadSuitcaseItems = async (suitcaseId: string) => {
    try {
      setIsProcessing(true);
      const items = await SuitcaseController.getSuitcaseItems(suitcaseId);
      setScannedItems(items);
      setIsProcessing(false);
    } catch (error) {
      console.error("Erro ao carregar itens da maleta:", error);
      toast.error("Erro ao carregar itens da maleta");
      setIsProcessing(false);
    }
  };

  const handleItemScan = (item: SuitcaseItem) => {
    if (scannedItems.find((si) => si.id === item.id)) {
      toast.error("Item já escaneado");
      return;
    }
    setScannedItems((prevItems) => [...prevItems, item]);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const handleNextSettlementDateSelect = (date: Date | undefined) => {
    setNextSettlementDate(date);
  };

  const handleRemoveItem = (itemId: string) => {
    setScannedItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
    setUnscannedItems((prevUnscanned) => prevUnscanned.filter(item => item.id !== itemId));
  };

  const handleMarkAsSold = (item: SuitcaseItem) => {
    setUnscannedItems((prevUnscanned) => {
      if (prevUnscanned.find(i => i.id === item.id)) return prevUnscanned;
      return [...prevUnscanned, item];
    });
  };

  const handleCustomerNameChange = (itemId: string, name: string) => {
    setCustomerNames(prevNames => ({ ...prevNames, [itemId]: name }));
  };

  const handlePaymentMethodChange = (itemId: string, method: string) => {
    setPaymentMethods(prevMethods => ({ ...prevMethods, [itemId]: method }));
  };

  const handleSubmit = async () => {
    if (!maleta) {
      toast.error("Nenhuma maleta selecionada");
      return;
    }

    if (!selectedDate) {
      toast.error("Selecione a data do acerto");
      return;
    }

    try {
      setIsProcessing(true);

      // Preparar dados para o acerto
      const settlementData = {
        suitcase_id: maleta.id,
        seller_id: maleta.seller_id,
        settlement_date: selectedDate.toISOString(),
        next_settlement_date: nextSettlementDate ? nextSettlementDate.toISOString() : undefined,
        items_present: scannedItems.map((item) => item.id),
        items_sold: unscannedItems.map(item => ({
          suitcase_item_id: item.id,
          inventory_id: item.inventory_id,
          price: item.product?.price || 0,
          customer_name: customerNames[item.id],
          payment_method: paymentMethods[item.id],
        })),
      };

      // Criar o acerto
      const newAcerto = await AcertoMaletaController.createAcerto(settlementData);
      setAcerto(newAcerto);
      setAcertoCompleto(true);
      toast.success("Acerto criado com sucesso!");

      if (onAcertoComplete) {
        onAcertoComplete(newAcerto);
      }
    } catch (error) {
      console.error("Erro ao criar acerto:", error);
      toast.error("Erro ao criar acerto. Por favor, tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Função para visualizar o recibo como PDF - modificada para usar nossa nova função
  const handleViewReceipt = async () => {
    if (!acerto) {
      toast.error("Nenhum acerto para gerar recibo");
      return;
    }

    try {
      setIsGeneratingPdf(true);
      const pdfUrl = await AcertoMaletaController.generateReceiptPDF(acerto.id);
      console.log("PDF gerado com sucesso, URL:", pdfUrl.substring(0, 100) + "...");
      
      // Usar a nova função para abrir o PDF em uma nova aba
      openPdfInNewTab(pdfUrl);
      
      toast.success("Recibo gerado com sucesso");
    } catch (error) {
      console.error("Erro ao gerar recibo:", error);
      toast.error("Erro ao gerar recibo. Por favor, tente novamente.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isProcessing && !isGeneratingPdf && !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Acerto de Maleta</DialogTitle>
        </DialogHeader>
        
        {!acertoCompleto ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Informações da Maleta</h3>
                <p><strong>Código:</strong> {maleta?.code}</p>
                <p><strong>Revendedora:</strong> {maleta?.seller?.name}</p>
                <p><strong>Status:</strong> {maleta?.status}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Data do Acerto</h3>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-[240px] justify-start text-left font-normal"
                    >
                      {selectedDate ? (
                        format(selectedDate, "dd/MM/yyyy")
                      ) : (
                        <span>Selecione a data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      disabled={(date) =>
                        date > new Date() || date < new Date('2023-01-01')
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <div className="mt-2">
                  <h3 className="text-md font-semibold mb-1">Próximo Acerto (Opcional)</h3>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className="w-[240px] justify-start text-left font-normal"
                      >
                        {nextSettlementDate ? (
                          format(nextSettlementDate, "dd/MM/yyyy")
                        ) : (
                          <span>Selecione a data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={nextSettlementDate}
                        onSelect={handleNextSettlementDateSelect}
                        disabled={(date) =>
                          date < new Date()
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-2">Escanear Itens</h3>
            <SuitcaseInventoryScanner
              suitcaseId={maleta?.id || ""}
              onItemScan={handleItemScan}
              existingItems={scannedItems}
              onRemoveItem={handleRemoveItem}
              onMarkAsSold={handleMarkAsSold}
            />

            {unscannedItems.length > 0 && (
              <div className="mt-4">
                <h4 className="text-md font-semibold mb-2">Itens Vendidos</h4>
                <ul className="space-y-2">
                  {unscannedItems.map((item) => (
                    <li key={item.id} className="flex items-center justify-between border rounded-md p-2">
                      <div>
                        <p className="font-medium">{item.product?.name}</p>
                        <p className="text-sm text-gray-500">Código: {item.product?.sku}</p>
                        <p className="text-sm text-gray-500">Preço: {AcertoMaletaController.formatCurrency(item.product?.price || 0)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="text"
                          placeholder="Nome do Cliente"
                          value={customerNames[item.id] || ""}
                          onChange={(e) => handleCustomerNameChange(item.id, e.target.value)}
                          className="w-40 text-sm"
                        />
                        <Input
                          type="text"
                          placeholder="Forma de Pagamento"
                          value={paymentMethods[item.id] || ""}
                          onChange={(e) => handlePaymentMethodChange(item.id, e.target.value)}
                          className="w-40 text-sm"
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <div className="my-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex flex-col items-center justify-center text-center space-y-2">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <h3 className="text-xl font-semibold text-green-700">Acerto Concluído com Sucesso!</h3>
              <p className="text-gray-600">O acerto da maleta foi registrado com sucesso.</p>
              
              <div className="grid grid-cols-2 gap-4 w-full mt-4">
                <div>
                  <p className="text-sm text-gray-500">Total de Itens:</p>
                  <p className="font-medium">{scannedItems.length + unscannedItems.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Itens Vendidos:</p>
                  <p className="font-medium">{unscannedItems.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total em Vendas:</p>
                  <p className="font-medium">{AcertoMaletaController.formatCurrency(acerto?.total_sales || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Data do Acerto:</p>
                  <p className="font-medium">
                    {acerto?.settlement_date ? format(new Date(acerto.settlement_date), 'dd/MM/yyyy') : "-"}
                  </p>
                </div>
              </div>
              
              <Button 
                className="mt-4 w-full md:w-auto" 
                onClick={handleViewReceipt}
                disabled={isGeneratingPdf}
              >
                <Printer className="h-4 w-4 mr-2" />
                {isGeneratingPdf ? "Gerando PDF..." : "Visualizar/Imprimir Recibo"}
              </Button>
            </div>
          </div>
        )}
        
        <DialogFooter className="flex justify-between items-center">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isProcessing || isGeneratingPdf}
          >
            Cancelar
          </Button>
          {!acertoCompleto ? (
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={isProcessing || isGeneratingPdf}
            >
              {isProcessing ? "Processando..." : "Concluir Acerto"}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={onClose}
              disabled={isProcessing || isGeneratingPdf}
            >
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
