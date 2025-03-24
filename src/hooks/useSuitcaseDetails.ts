
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SuitcaseController } from "@/controllers/suitcaseController";
import { addDays } from "date-fns";
import { useTabNavigation } from "./suitcase/useTabNavigation";
import { useInventorySearch } from "./suitcase/useInventorySearch";
import { useSuitcaseItems } from "./suitcase/useSuitcaseItems";
import { usePrintOperations } from "./suitcase/usePrintOperations";
import { useSettlementDates } from "./suitcase/useSettlementDates";
import { useSuitcaseDeletion } from "./suitcase/useSuitcaseDeletion";

export function useSuitcaseDetails(
  suitcaseId: string | null,
  open: boolean,
  onOpenChange: (open: boolean) => void,
  onRefresh?: () => void
) {
  // Utilizando hooks específicos
  const { activeTab, setActiveTab } = useTabNavigation();
  const { searchTerm, setSearchTerm, searchResults, isSearching, isAdding, handleSearch, handleAddItem } = useInventorySearch();
  const { handleToggleSold, handleUpdateSaleInfo, calculateTotalValue } = useSuitcaseItems();
  const { isPrintingPdf, handleViewReceipt, handlePrint } = usePrintOperations();
  const { nextSettlementDate, setNextSettlementDate, handleUpdateNextSettlementDate } = useSettlementDates();
  const { showDeleteDialog, setShowDeleteDialog, isDeleting, handleDeleteSuitcase } = useSuitcaseDeletion();

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
      const futureDate = addDays(new Date(), 30);
      handleUpdateNextSettlementDateWrapper(futureDate);
    }
  }, [suitcase]);

  // Wrappers para integrar os hooks específicos ao contexto do hook principal
  const handleAddItemWrapper = async (inventoryId: string) => {
    if (!suitcaseId) return;
    const success = await handleAddItem(suitcaseId, inventoryId);
    if (success) {
      refetchSuitcaseItems();
    }
  };

  const handleToggleSoldWrapper = async (item: any, sold: boolean) => {
    const success = await handleToggleSold(item, sold);
    if (success) {
      refetchSuitcaseItems();
    }
  };

  const handleUpdateSaleInfoWrapper = async (itemId: string, field: string, value: string) => {
    const success = await handleUpdateSaleInfo(itemId, field, value);
    if (success) {
      refetchSuitcaseItems();
    }
  };

  const handlePrintWrapper = async () => {
    if (!suitcaseId) return;
    await handlePrint(suitcaseId, suitcaseItems, promoterInfo);
  };

  const handleUpdateNextSettlementDateWrapper = async (date?: Date | null) => {
    if (!suitcaseId) return;
    const success = await handleUpdateNextSettlementDate(suitcaseId, date);
    if (success) {
      refetchSuitcase();
    }
  };

  const handleDeleteSuitcaseWrapper = async () => {
    if (!suitcaseId) return;
    const success = await handleDeleteSuitcase(suitcaseId);
    if (success) {
      onOpenChange(false);
      if (onRefresh) onRefresh();
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
    handleAddItem: handleAddItemWrapper,
    handleToggleSold: handleToggleSoldWrapper,
    handleUpdateSaleInfo: handleUpdateSaleInfoWrapper,
    calculateTotalValue: () => calculateTotalValue(suitcaseItems),
    handleViewReceipt,
    handlePrint: handlePrintWrapper,
    handleUpdateNextSettlementDate: handleUpdateNextSettlementDateWrapper,
    handleDeleteSuitcase: handleDeleteSuitcaseWrapper
  };
}
