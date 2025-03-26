
/**
 * Hook para Detalhes de Maleta
 * @file Agrupa funcionalidades para gerenciar detalhes e operações em maletas
 * @relacionamento Utiliza hooks específicos como useInventorySearch, useSuitcaseItems
 */
import { useCallback, useEffect, useState } from "react";
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
  // Estado local para controlar se o componente está sendo desmontado
  const [isClosing, setIsClosing] = useState(false);

  // Utilizando hooks específicos
  const { activeTab, setActiveTab, resetTabState } = useTabNavigation();
  const { searchTerm, setSearchTerm, searchResults, isSearching, isAdding, handleSearch, handleAddItem, resetSearchState } = useInventorySearch();
  const { processingItems, handleToggleSold, handleUpdateSaleInfo, handleReturnToInventory, calculateTotalValue, resetItemsState } = useSuitcaseItems();
  const { isPrintingPdf, handleViewReceipt, handlePrint, resetPrintState } = usePrintOperations();
  const { nextSettlementDate, setNextSettlementDate, handleUpdateNextSettlementDate, resetDateState } = useSettlementDates();
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
  
  // Função para resetar todos os estados
  const resetStates = useCallback(() => {
    // Resetar estados de navegação
    if (resetTabState) resetTabState();
    else setActiveTab("informacoes");
    
    // Resetar estado de busca
    setSearchTerm("");
    if (resetSearchState) resetSearchState();
    
    // Resetar estado de exclusão
    setShowDeleteDialog(false);
    if (resetDeletionState) resetDeletionState();
    
    // Resetar outros estados específicos
    if (resetItemsState) resetItemsState();
    if (resetPrintState) resetPrintState();
    if (resetDateState) resetDateState();
    
    // Resetar estado de queries
    if (resetQueryState) resetQueryState();
    
    // Garantir que os estados locais sejam resetados
    setIsClosing(false);
  }, [
    setActiveTab,
    resetTabState,
    setSearchTerm,
    resetSearchState,
    setShowDeleteDialog,
    resetDeletionState,
    resetItemsState,
    resetPrintState,
    resetDateState,
    resetQueryState
  ]);

  // Efeito para monitorar quando o diálogo é fechado
  useEffect(() => {
    if (!open && !isClosing) {
      // Se o diálogo está sendo fechado, limpar todos os estados
      resetStates();
    }
    // Atualizar o estado de fechamento
    setIsClosing(!open);
  }, [open, isClosing, resetStates]);

  // Atualizar a data do próximo acerto na primeira carga
  useEffect(() => {
    if (suitcase?.next_settlement_date) {
      setNextSettlementDate(new Date(suitcase.next_settlement_date));
    } else if (suitcase && !suitcase.next_settlement_date) {
      // Se não houver data definida, sugerir data para 30 dias no futuro
      const futureDate = addDays(new Date(), 30);
      handleUpdateNextSettlementDateWrapper(futureDate);
    }
  }, [suitcase, setNextSettlementDate]);

  // Wrappers para integrar os hooks específicos ao contexto do hook principal
  const handleAddItemWrapper = async (inventoryId: string) => {
    if (!suitcaseId) return false;
    const success = await handleAddItem(suitcaseId, inventoryId);
    if (success) {
      refetchSuitcaseItems();
    }
    return success;
  };

  const handleToggleSoldWrapper = async (item: any, sold: boolean) => {
    const success = await handleToggleSold(item, sold);
    if (success) {
      refetchSuitcaseItems();
    }
    return success;
  };

  const handleUpdateSaleInfoWrapper = async (itemId: string, field: string, value: string) => {
    const success = await handleUpdateSaleInfo(itemId, field, value);
    if (success) {
      refetchSuitcaseItems();
    }
    return success;
  };

  const handleReturnToInventoryWrapper = async (itemIds: string[], quantity: number, isDamaged: boolean) => {
    const success = await handleReturnToInventory(itemIds, quantity, isDamaged);
    if (success) {
      refetchSuitcaseItems();
    }
    return success;
  };

  const handlePrintWrapper = async () => {
    if (!suitcaseId) return false;
    const success = await handlePrint(suitcaseId, suitcaseItems, promoterInfo);
    return success;
  };

  const handleUpdateNextSettlementDateWrapper = async (date?: Date | null) => {
    if (!suitcaseId) return false;
    const success = await handleUpdateNextSettlementDate(suitcaseId, date);
    if (success) {
      refetchSuitcase();
    }
    return success;
  };

  const handleDeleteSuitcaseWrapper = async () => {
    if (!suitcaseId) return false;
    const success = await handleDeleteSuitcase(suitcaseId);
    if (success) {
      // Fechar o diálogo e notificar para atualização
      resetStates();
      onOpenChange(false);
      if (onRefresh) onRefresh();
    }
    return success;
  };

  const calculateTotalValueWrapper = () => {
    // Filtra itens que estão em posse (não vendidos, devolvidos, etc.) antes de calcular
    const activeItems = suitcaseItems.filter(item => item.status === 'in_possession');
    return calculateTotalValue(activeItems);
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
    handleReturnToInventory: handleReturnToInventoryWrapper,
    calculateTotalValue: calculateTotalValueWrapper,
    handleViewReceipt,
    handlePrint: handlePrintWrapper,
    handleUpdateNextSettlementDate: handleUpdateNextSettlementDateWrapper,
    handleDeleteSuitcase: handleDeleteSuitcaseWrapper,
    resetStates
  };
}
