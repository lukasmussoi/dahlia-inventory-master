
/**
 * Diálogo de Detalhes da Maleta
 * @file Exibe e gerencia os detalhes completos de uma maleta
 * @relacionamento Utiliza hooks específicos para gerenciar estados e operações da maleta
 */

import { useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SuitcaseDetailsTabs } from "./SuitcaseDetailsTabs";
import { LoadingIndicator } from "@/components/shared/LoadingIndicator";
import { DeleteSuitcaseDialog } from "./DeleteSuitcaseDialog";
import { useSuitcaseDetails } from "@/hooks/useSuitcaseDetails";
import { addDays } from "date-fns";
import { SuitcaseItem } from "@/types/suitcase";
import { Button } from "@/components/ui/button";

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
  const {
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
    acertosHistorico,
    isLoadingAcertos,
    handleSearch,
    handleAddItem,
    handleToggleSold,
    handleUpdateSaleInfo,
    handleReturnToInventory,
    calculateTotalValue,
    handleViewReceipt,
    handlePrint,
    handleUpdateNextSettlementDate,
    handleDeleteSuitcase,
    resetStates
  } = useSuitcaseDetails(suitcaseId, open, onOpenChange, onRefresh);

  // Limpar estados ao fechar o diálogo
  useEffect(() => {
    if (!open) {
      resetStates();
    }
  }, [open, resetStates]);

  // Atualizar a data do próximo acerto na primeira carga
  useEffect(() => {
    if (suitcase?.next_settlement_date) {
      // Este efeito é necessário para definir a data inicialmente
      // Já que o hook sozinho não consegue reagir a mudanças no suitcase
    } else if (suitcase && !suitcase.next_settlement_date) {
      // Se não houver data definida, sugerir data para 30 dias no futuro
      const futureDate = addDays(new Date(), 30);
      void handleUpdateNextSettlementDate(futureDate);
    }
  }, [suitcase, handleUpdateNextSettlementDate]);

  // Manipulador de mudança de diálogo que garante limpeza de estados
  const handleDialogChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Resetamos os estados e notificamos o componente pai imediatamente
      resetStates();
      onOpenChange(newOpen);
    } else {
      onOpenChange(newOpen);
    }
  };

  // Função para fechar o diálogo com limpeza completa de estados
  const handleClose = () => {
    // Forçar o reset de estados antes de fechar
    resetStates();
    // Notificar o componente pai que o diálogo deve fechar
    onOpenChange(false);
  };

  // Adaptadores para ajustar os tipos de retorno para Promise<void>
  const handleUpdateNextSettlementDateAdapter = async (date: Date) => {
    await handleUpdateNextSettlementDate(date);
  };

  const handleAddItemAdapter = async (inventoryId: string) => {
    await handleAddItem(inventoryId);
  };

  const handleToggleSoldAdapter = async (item: SuitcaseItem, sold: boolean) => {
    await handleToggleSold(item, sold);
  };

  const handleUpdateSaleInfoAdapter = async (itemId: string, field: string, value: string) => {
    await handleUpdateSaleInfo(itemId, field, value);
  };

  const handleReturnToInventoryAdapter = async (itemIds: string[], quantity: number, isDamaged: boolean) => {
    await handleReturnToInventory(itemIds, quantity, isDamaged);
  };

  const handlePrintAdapter = async () => {
    await handlePrint();
  };

  const handleDeleteSuitcaseAdapter = async () => {
    await handleDeleteSuitcase();
  };

  if (isLoadingSuitcase || !suitcase) {
    return (
      <Dialog open={open} onOpenChange={handleDialogChange}>
        <DialogContent className="no-close-x">
          <DialogTitle>Detalhes da Maleta</DialogTitle>
          <div className="flex justify-center items-center p-8">
            <LoadingIndicator />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto no-close-x">
          <DialogTitle>Detalhes da Maleta {suitcase.code}</DialogTitle>
          <SuitcaseDetailsTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            suitcase={suitcase}
            nextSettlementDate={nextSettlementDate}
            handleUpdateNextSettlementDate={handleUpdateNextSettlementDateAdapter}
            promoterInfo={promoterInfo}
            loadingPromoterInfo={loadingPromoterInfo}
            suitcaseItems={suitcaseItems}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            handleSearch={handleSearch}
            searchResults={searchResults}
            isSearching={isSearching}
            isAdding={isAdding}
            handleAddItem={handleAddItemAdapter}
            handleToggleSold={handleToggleSoldAdapter}
            handleUpdateSaleInfo={handleUpdateSaleInfoAdapter}
            handleReturnToInventory={handleReturnToInventoryAdapter}
            calculateTotalValue={calculateTotalValue}
            acertosHistorico={acertosHistorico}
            isLoadingAcertos={isLoadingAcertos}
            handleViewReceipt={handleViewReceipt}
            handlePrint={handlePrintAdapter}
            isPrintingPdf={isPrintingPdf}
            isAdmin={isAdmin}
            onDeleteClick={() => setShowDeleteDialog(true)}
          />
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={handleClose}>Fechar Janela</Button>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteSuitcaseDialog 
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        isDeleting={isDeleting}
        onDelete={handleDeleteSuitcaseAdapter}
      />
    </>
  );
}
