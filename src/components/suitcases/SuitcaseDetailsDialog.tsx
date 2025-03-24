
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { SuitcaseDetailsTabs } from "./details/SuitcaseDetailsTabs";
import { SuitcaseController } from "@/controllers/suitcaseController";
import { LoadingIndicator } from "@/components/shared/LoadingIndicator";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Acerto, SuitcaseItem } from "@/types/suitcase";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

interface SuitcaseDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suitcaseId: string | null;
  onRefresh?: () => void;
  isAdmin?: boolean;
}

export function SuitcaseDetailsDialog({
  open,
  onOpenChange,
  suitcaseId,
  onRefresh,
  isAdmin = false
}: SuitcaseDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState("informacoes");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState<{ [key: string]: boolean }>({});
  const [isPrintingPdf, setIsPrintingPdf] = useState(false);
  const [nextSettlementDate, setNextSettlementDate] = useState<Date | undefined>(undefined);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Buscar detalhes da maleta
  const {
    data: suitcase,
    isLoading: isLoadingSuitcase,
    refetch: refetchSuitcase
  } = useQuery({
    queryKey: ["suitcase", suitcaseId],
    queryFn: () => SuitcaseController.getSuitcaseById(suitcaseId || ""),
    enabled: open && !!suitcaseId,
  });

  // Buscar promotora da revendedora
  const {
    data: promoterInfo,
    isLoading: loadingPromoterInfo
  } = useQuery({
    queryKey: ["promoter-for-reseller", suitcase?.seller_id],
    queryFn: () => SuitcaseController.getPromoterForReseller(suitcase?.seller_id || ""),
    enabled: open && !!suitcase?.seller_id,
  });

  // Buscar itens da maleta
  const {
    data: suitcaseItems = [],
    isLoading: isLoadingSuitcaseItems,
    refetch: refetchSuitcaseItems
  } = useQuery({
    queryKey: ["suitcase-items", suitcaseId],
    queryFn: () => SuitcaseController.getSuitcaseItems(suitcaseId || ""),
    enabled: open && !!suitcaseId,
  });

  // Buscar histórico de acertos
  const {
    data: acertosHistorico = [],
    isLoading: isLoadingAcertos
  } = useQuery({
    queryKey: ["acertos-historico", suitcaseId],
    queryFn: () => SuitcaseController.createPendingSettlement(suitcaseId || "", true),
    enabled: open && !!suitcaseId,
  });

  // Atualizar a data do próximo acerto na primeira carga
  useEffect(() => {
    if (suitcase?.next_settlement_date) {
      setNextSettlementDate(new Date(suitcase.next_settlement_date));
    } else if (suitcase && !suitcase.next_settlement_date) {
      // Se não houver data definida, sugerir data para 30 dias no futuro
      setNextSettlementDate(addDays(new Date(), 30));
    }
  }, [suitcase]);

  // Funções de busca de inventário
  const handleSearch = async (e?: React.KeyboardEvent) => {
    if (e && e.key !== "Enter") return;
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    try {
      const results = await SuitcaseController.searchInventoryItems(searchTerm);
      setSearchResults(results);
    } catch (error) {
      console.error("Erro ao buscar itens:", error);
      toast.error("Erro ao buscar itens no inventário");
    } finally {
      setIsSearching(false);
    }
  };

  // Função para adicionar item à maleta
  const handleAddItem = async (inventoryId: string) => {
    if (!suitcaseId) return;
    
    setIsAdding(prev => ({ ...prev, [inventoryId]: true }));
    try {
      await SuitcaseController.addItemToSuitcase(suitcaseId, inventoryId);
      refetchSuitcaseItems();
      toast.success("Item adicionado à maleta com sucesso");
      
      // Limpar resultados da busca
      setSearchResults([]);
      setSearchTerm("");
    } catch (error: any) {
      console.error("Erro ao adicionar item:", error);
      toast.error(error.message || "Erro ao adicionar item à maleta");
    } finally {
      setIsAdding(prev => ({ ...prev, [inventoryId]: false }));
    }
  };

  // Função para alternar status de vendido
  const handleToggleSold = async (item: SuitcaseItem, sold: boolean) => {
    try {
      const newStatus = sold ? "sold" : "in_possession";
      await SuitcaseController.updateSuitcaseItemStatus(item.id, newStatus);
      refetchSuitcaseItems();
    } catch (error) {
      console.error("Erro ao atualizar status do item:", error);
      toast.error("Erro ao atualizar status do item");
    }
  };

  // Função para atualizar informações de venda
  const handleUpdateSaleInfo = async (itemId: string, field: string, value: string) => {
    try {
      await SuitcaseController.updateSaleInfo(itemId, field, value);
      refetchSuitcaseItems();
    } catch (error) {
      console.error("Erro ao atualizar informações de venda:", error);
      toast.error("Erro ao atualizar informações de venda");
    }
  };

  // Calcular valor total da maleta
  const calculateTotalValue = () => {
    return suitcaseItems.reduce((total, item) => {
      return total + (item.product?.price || 0);
    }, 0);
  };

  // Função para visualizar recibo
  const handleViewReceipt = (acertoId: string) => {
    console.log("Visualizar recibo:", acertoId);
    // Implementação pendente
  };

  // Função para imprimir PDF
  const handlePrint = async () => {
    if (!suitcaseId) return;
    
    setIsPrintingPdf(true);
    try {
      const pdfUrl = await SuitcaseController.generateSuitcasePDF(suitcaseId);
      // Abrir o PDF em uma nova aba
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF da maleta");
    } finally {
      setIsPrintingPdf(false);
    }
  };

  // Atualizar a data do próximo acerto
  const handleUpdateNextSettlementDate = async (date?: Date) => {
    if (!suitcaseId) return;
    
    try {
      const formattedDate = date ? format(date, "yyyy-MM-dd") : null;
      await SuitcaseController.updateSuitcase(suitcaseId, {
        next_settlement_date: formattedDate
      });
      
      setNextSettlementDate(date);
      refetchSuitcase();
      toast.success("Data do próximo acerto atualizada com sucesso");
    } catch (error) {
      console.error("Erro ao atualizar data de acerto:", error);
      toast.error("Erro ao atualizar data do próximo acerto");
    }
  };

  // Função para excluir a maleta
  const handleDeleteSuitcase = async () => {
    if (!suitcaseId) return;
    
    setIsDeleting(true);
    try {
      // Chamar a função de exclusão da maleta
      await SuitcaseController.deleteSuitcaseWithCascade(suitcaseId);
      
      // Fechar o diálogo de confirmação e o modal de detalhes
      setShowDeleteDialog(false);
      onOpenChange(false);
      
      // Atualizar a lista de maletas
      if (onRefresh) onRefresh();
      
      toast.success("Maleta excluída com sucesso");
    } catch (error: any) {
      console.error("Erro ao excluir maleta:", error);
      toast.error(error.message || "Erro ao excluir maleta");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoadingSuitcase || !suitcase) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-center items-center p-8">
            <LoadingIndicator />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog 
        open={open} 
        onOpenChange={(newOpen) => {
          // Resetar o estado ao fechar o diálogo
          if (!newOpen) {
            setActiveTab("informacoes");
            setSearchTerm("");
            setSearchResults([]);
          }
          onOpenChange(newOpen);
        }}
      >
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
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
            isAdmin={isAdmin}
            onDeleteClick={() => setShowDeleteDialog(true)}
          />
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta maleta? Esta ação é irreversível e excluirá todo o histórico de acertos. 
              As peças que ainda estiverem na maleta serão devolvidas automaticamente ao estoque.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteSuitcase();
              }}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
