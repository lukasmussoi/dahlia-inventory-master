
/**
 * Componente de Diálogo de Detalhes da Maleta
 * @file Exibe e gerencia os detalhes completos de uma maleta
 * @relacionamento Utiliza hooks específicos para gerenciar estados e operações da maleta
 */
import { useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SuitcaseDetailsTabs } from "./details/SuitcaseDetailsTabs";
import { LoadingIndicator } from "@/components/shared/LoadingIndicator";
import { DeleteSuitcaseDialog } from "./details/DeleteSuitcaseDialog";
import { useSuitcaseDetails } from "@/hooks/useSuitcaseDetails";
import { addDays } from "date-fns";

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
      handleUpdateNextSettlementDate(futureDate);
    }
  }, [suitcase, handleUpdateNextSettlementDate]);

  // Manipulador de mudança de diálogo que garante limpeza de estados
  const handleDialogChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Resetamos os estados imediatamente antes de fechar
      resetStates();
      // Notificamos o componente pai sobre a mudança
      onOpenChange(newOpen);
    } else {
      onOpenChange(newOpen);
    }
  };

  if (isLoadingSuitcase || !suitcase) {
    return (
      <Dialog open={open} onOpenChange={handleDialogChange}>
        <DialogContent>
          <DialogTitle>Detalhes da Maleta</DialogTitle>
          <DialogDescription>Carregando informações da maleta...</DialogDescription>
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
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogTitle>Detalhes da Maleta {suitcase.code}</DialogTitle>
          <DialogDescription>
            Visualize e gerencie as informações desta maleta
          </DialogDescription>
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
            handleReturnToInventory={handleReturnToInventory}
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

      <DeleteSuitcaseDialog 
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        isDeleting={isDeleting}
        onDelete={handleDeleteSuitcase}
      />
    </>
  );
}
