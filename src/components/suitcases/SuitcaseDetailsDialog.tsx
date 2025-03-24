
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Briefcase } from "lucide-react";
import { toast } from "sonner";
import { Suitcase } from "@/types/suitcase";
import { SuitcaseController } from "@/controllers/suitcaseController";
import { AcertoMaletaController } from "@/controllers/acertoMaletaController";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { openPdfInNewTab } from "@/utils/pdfUtils";
import { SuitcaseDetailsTabs } from "./details/SuitcaseDetailsTabs";

interface SuitcaseDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suitcase: Suitcase | null;
  onOpenAcertoDialog?: (suitcase: Suitcase) => void;
  onRefresh?: () => void;
  isAdmin?: boolean;
  onEdit?: (suitcase: Suitcase) => void;
}

export function SuitcaseDetailsDialog({
  open,
  onOpenChange,
  suitcase,
  onOpenAcertoDialog,
  onRefresh,
  isAdmin = false,
  onEdit
}: SuitcaseDetailsDialogProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("itens");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState<{ [key: string]: boolean }>({});
  const [nextSettlementDate, setNextSettlementDate] = useState<Date | undefined>(
    suitcase?.next_settlement_date ? new Date(suitcase.next_settlement_date) : undefined
  );
  const [isPrintingPdf, setIsPrintingPdf] = useState(false);

  useEffect(() => {
    if (suitcase) {
      setSearchTerm("");
      setSearchResults([]);
      setNextSettlementDate(
        suitcase.next_settlement_date ? new Date(suitcase.next_settlement_date) : undefined
      );
    }
  }, [suitcase]);

  const { data: suitcaseItems = [], refetch: refetchItems } = useQuery({
    queryKey: ['suitcase-items', suitcase?.id],
    queryFn: async () => {
      if (!suitcase) return [];
      const items = await SuitcaseController.getSuitcaseItems(suitcase.id);
      return items.filter(item => item.status === 'in_possession');
    },
    enabled: !!suitcase && open,
  });

  const { data: acertosHistorico = [], isLoading: isLoadingAcertos } = useQuery({
    queryKey: ['suitcase-acertos', suitcase?.id],
    queryFn: async () => {
      if (!suitcase) return [];
      try {
        const acertos = await AcertoMaletaController.getAcertosBySuitcase(suitcase.id);
        return acertos as unknown as Acerto[];
      } catch (error) {
        console.error("Erro ao buscar histórico de acertos:", error);
        return [];
      }
    },
    enabled: !!suitcase && open && activeTab === "historico",
  });

  const { data: promoterInfo, isLoading: loadingPromoterInfo } = useQuery({
    queryKey: ['promoter-for-reseller', suitcase?.seller_id],
    queryFn: () => suitcase?.seller_id 
      ? SuitcaseController.getPromoterForReseller(suitcase.seller_id) 
      : Promise.resolve(null),
    enabled: !!suitcase?.seller_id && open,
  });

  const handleSearch = async (e?: React.KeyboardEvent) => {
    if (e && e.key !== 'Enter') return;
    if (!suitcase) return;
    
    if (searchTerm.trim() === "") {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const results = await SuitcaseController.searchInventoryItems(searchTerm);
      setSearchResults(results);
      
      if (results.length === 0) {
        toast.info("Nenhum item encontrado ou todos os itens correspondentes estão arquivados");
      }
    } catch (error: any) {
      console.error("Erro ao buscar itens:", error);
      toast.error(error.message || "Erro ao buscar itens");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddItem = async (inventoryId: string) => {
    if (!suitcase) return;
    
    try {
      setIsAdding(prev => ({ ...prev, [inventoryId]: true }));
      
      await SuitcaseController.addItemToSuitcase(suitcase.id, inventoryId);
      
      setSearchResults(prevResults => prevResults.filter(item => item.id !== inventoryId));
      
      refetchItems();
      
      toast.success("Item adicionado à maleta com sucesso");
    } catch (error: any) {
      console.error("Erro ao adicionar item à maleta:", error);
      toast.error(error.message || "Erro ao adicionar item à maleta");
    } finally {
      setIsAdding(prev => ({ ...prev, [inventoryId]: false }));
    }
  };

  const handleToggleSold = async (item: SuitcaseItem, sold: boolean) => {
    try {
      await SuitcaseController.updateSuitcaseItemStatus(
        item.id, 
        sold ? 'sold' : 'in_possession'
      );
      
      refetchItems();
      
      toast.success(`Item ${sold ? 'marcado como vendido' : 'marcado como disponível'}`);
    } catch (error: any) {
      console.error("Erro ao atualizar status do item:", error);
      toast.error(error.message || "Erro ao atualizar status do item");
    }
  };

  const handleUpdateSaleInfo = async (itemId: string, field: string, value: string) => {
    try {
      await SuitcaseController.updateSaleInfo(itemId, field, value);
      refetchItems();
    } catch (error: any) {
      console.error("Erro ao atualizar informações de venda:", error);
      toast.error(error.message || "Erro ao atualizar informações de venda");
    }
  };

  const handleUpdateNextSettlementDate = async (date?: Date) => {
    if (!suitcase) return;
    
    try {
      setNextSettlementDate(date);
      
      await SuitcaseController.updateSuitcase(suitcase.id, {
        next_settlement_date: date ? date.toISOString() : null,
      });
      
      if (date) {
        await SuitcaseController.createPendingSettlement(suitcase.id, date);
        toast.success(`Data do próximo acerto definida para ${date.toLocaleDateString('pt-BR')} e acerto pendente criado`);
      } else {
        toast.info("Data do próximo acerto removida");
      }
      
      queryClient.invalidateQueries({ queryKey: ['suitcase', suitcase.id] });
      queryClient.invalidateQueries({ queryKey: ['acertos'] });
    } catch (error: any) {
      console.error("Erro ao atualizar data do próximo acerto:", error);
      toast.error(error.message || "Erro ao atualizar data do próximo acerto");
    }
  };

  const calculateTotalValue = (): number => {
    return suitcaseItems.reduce((total, item) => {
      const price = item.product?.price || 0;
      const quantity = item.quantity || 1;
      return total + (price * quantity);
    }, 0);
  };

  const getSellerName = (): string => {
    return suitcase?.seller?.name || "Revendedora não informada";
  };

  const handleClose = () => {
    onOpenChange(false);
    if (onRefresh) {
      setTimeout(() => {
        onRefresh();
      }, 100);
    }
  };

  const handlePrint = async () => {
    if (!suitcase) return;
    
    try {
      setIsPrintingPdf(true);
      toast.info("Gerando PDF da maleta...");
      
      // Chamar o método para gerar o PDF e obter a URL
      const pdfUrl = await SuitcaseController.generateSuitcasePDF(
        suitcase.id, 
        suitcaseItems, 
        promoterInfo
      );
      
      // Abrir o PDF em uma nova aba
      openPdfInNewTab(pdfUrl);
      
      toast.success("PDF da maleta gerado com sucesso");
    } catch (error) {
      console.error("Erro ao gerar PDF da maleta:", error);
      toast.error("Erro ao gerar PDF da maleta. Tente novamente.");
    } finally {
      setIsPrintingPdf(false);
    }
  };

  const handleViewReceipt = async (acertoId: string) => {
    try {
      const pdfUrl = await AcertoMaletaController.generateReceiptPDF(acertoId);
      openPdfInNewTab(pdfUrl);
    } catch (error) {
      console.error("Erro ao gerar PDF do acerto:", error);
      toast.error("Erro ao gerar PDF do recibo. Tente novamente.");
    }
  };

  const handleEdit = () => {
    if (!suitcase || !onEdit) return;
    
    onOpenChange(false);
    setTimeout(() => {
      onEdit(suitcase);
    }, 100);
  };

  if (!suitcase) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto p-0">
        <div className="p-6 pb-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-pink-500" />
              <h2 className="text-xl font-semibold">Detalhes da Maleta {suitcase.code}</h2>
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
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <p>Revendedora: <span className="font-medium text-foreground">{getSellerName()}</span></p>
            
            {promoterInfo && (
              <div className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                <p>Promotora: <span className="font-medium text-foreground">{promoterInfo.name}</span></p>
              </div>
            )}
          </div>
        </div>
        
        <SuitcaseDetailsTabs 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          suitcase={suitcase}
          nextSettlementDate={nextSettlementDate}
          handleUpdateNextSettlementDate={handleUpdateNextSettlementDate}
          promoterInfo={promoterInfo}
          loadingPromoterInfo={loadingPromoterInfo}
          suitcaseItems={suitcaseItems}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          handleSearch={handleSearch}
          searchResults={searchResults}
          isSearching={isSearching}
          isAdding={isAdding}
          handleAddItem={handleAddItem}
          handleToggleSold={handleToggleSold}
          handleUpdateSaleInfo={handleUpdateSaleInfo}
          calculateTotalValue={calculateTotalValue}
          acertosHistorico={acertosHistorico}
          isLoadingAcertos={isLoadingAcertos}
          handleViewReceipt={handleViewReceipt}
          handlePrint={handlePrint}
          isPrintingPdf={isPrintingPdf}
        />
        
        <div className="p-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Fechar
          </Button>
          
          {isAdmin && (
            <Button onClick={handleEdit} className="bg-pink-500 hover:bg-pink-600">
              Editar Maleta
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function User(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      {...props}
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
