
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SuitcaseController } from "@/controllers/suitcaseController";
import { SuitcaseItem } from "@/types/suitcase";
import { toast } from "sonner";
import { format, addDays } from "date-fns";

export function useSuitcaseDetails(
  suitcaseId: string | null,
  open: boolean,
  onOpenChange: (open: boolean) => void,
  onRefresh?: () => void
) {
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
      // Passando os três parâmetros necessários
      const pdfUrl = await SuitcaseController.generateSuitcasePDF(
        suitcaseId,
        suitcaseItems,
        promoterInfo
      );
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
  const handleUpdateNextSettlementDate = async (date?: Date | null) => {
    if (!suitcaseId) return;
    
    try {
      // Usando null quando a data não for fornecida
      const formattedDate = date ? format(date, "yyyy-MM-dd") : null;
      await SuitcaseController.updateSuitcase(suitcaseId, {
        next_settlement_date: formattedDate
      });
      
      setNextSettlementDate(date || undefined);
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

  return {
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    searchResults,
    isSearching,
    isAdding,
    isPrintingPdf,
    nextSettlementDate,
    showDeleteDialog,
    setShowDeleteDialog,
    isDeleting,
    suitcase,
    isLoadingSuitcase,
    promoterInfo,
    loadingPromoterInfo,
    suitcaseItems,
    isLoadingSuitcaseItems,
    acertosHistorico,
    isLoadingAcertos,
    handleSearch,
    handleAddItem,
    handleToggleSold,
    handleUpdateSaleInfo,
    calculateTotalValue,
    handleViewReceipt,
    handlePrint,
    handleUpdateNextSettlementDate,
    handleDeleteSuitcase
  };
}
