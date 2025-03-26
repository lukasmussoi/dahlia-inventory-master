
/**
 * Hook para Detalhes de Maleta
 * @file Agrupa funcionalidades para gerenciar detalhes e operações em maletas
 * @relacionamento Utiliza hooks específicos como useInventorySearch, useSuitcaseItems
 */
import { useCallback, useEffect } from "react";
import { addDays } from "date-fns";
import { useTabNavigation } from "./suitcase/useTabNavigation";
import { useInventorySearch } from "./suitcase/useInventorySearch";
import { useSuitcaseItems } from "./suitcase/useSuitcaseItems";
import { usePrintOperations } from "./suitcase/usePrintOperations";
import { useSettlementDates } from "./suitcase/useSettlementDates";
import { useSuitcaseDeletion } from "./suitcase/useSuitcaseDeletion";
import { useSuitcaseQueries } from "./suitcase/useSuitcaseQueries";

export function useSuitcaseDetails(
  suitcaseId: string | null,
  open: boolean,
  onOpenChange: (open: boolean) => void,
  onRefresh?: () => void
) {
  // Utilizando hooks específicos
  const { activeTab, setActiveTab } = useTabNavigation();
  const { searchTerm, setSearchTerm, searchResults, isSearching, isAdding, handleSearch, handleAddItem, resetSearchState } = useInventorySearch();
  const { processingItems, handleToggleSold, handleUpdateSaleInfo, handleReturnToInventory, calculateTotalValue, resetItemsState } = useSuitcaseItems();
  const { isPrintingPdf, handleViewReceipt, handlePrint } = usePrintOperations();
  const { nextSettlementDate, setNextSettlementDate, handleUpdateNextSettlementDate } = useSettlementDates();
  const { showDeleteDialog, setShowDeleteDialog, isDeleting, handleDeleteSuitcase, resetDeletionState } = useSuitcaseDeletion();
  
  // Utilizando o hook de queries
  const {
    suitcase,
    isLoadingSuitcase,
    refetchSuitcase,
    promoterInfo,
    loadingPromoterInfo,
    suitcaseItems,
    isLoadingSuitcaseItems,
    refetchSuitcaseItems,
    acertosHistorico,
    isLoadingAcertos,
    resetQueryState
  } = useSuitcaseQueries(suitcaseId, open);

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

  const handleReturnToInventoryWrapper = async (itemIds: string[], quantity: number, isDamaged: boolean) => {
    const success = await handleReturnToInventory(itemIds, quantity, isDamaged);
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

  const calculateTotalValueWrapper = () => {
    // Filtra itens que estão em posse (não vendidos, devolvidos, etc.) antes de calcular
    const activeItems = suitcaseItems.filter(item => item.status === 'in_possession');
    return calculateTotalValue(activeItems);
  };

  // Função para resetar todos os estados - implementada corretamente agora
  const resetStates = useCallback(() => {
    setActiveTab("informacoes");
    setSearchTerm("");
    setShowDeleteDialog(false);
    
    // Chamar as funções de reset de cada hook específico
    if (resetSearchState) resetSearchState();
    if (resetItemsState) resetItemsState();
    if (resetDeletionState) resetDeletionState();
    if (resetQueryState) resetQueryState();
  }, [
    setActiveTab, 
    setSearchTerm, 
    setShowDeleteDialog, 
    resetSearchState, 
    resetItemsState, 
    resetDeletionState,
    resetQueryState
  ]);

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
    handleReturnToInventory: handleReturnToInventoryWrapper,
    calculateTotalValue: calculateTotalValueWrapper,
    handleViewReceipt,
    handlePrint: handlePrintWrapper,
    handleUpdateNextSettlementDate: handleUpdateNextSettlementDateWrapper,
    handleDeleteSuitcase: handleDeleteSuitcaseWrapper,
    resetStates
  };
}
