
/**
 * Diálogo de Abastecimento de Maleta
 * @file Este componente gerencia a interface para adicionar produtos a uma maleta
 * @relacionamento Utiliza o useSupplyDialog para controlar o estado e lógica
 */
import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Suitcase } from "@/types/suitcase";
import { Package, Search, Loader2, FileText } from "lucide-react";
import { useSupplyDialog } from "@/hooks/suitcase/useSupplyDialog";
import { SearchResultCard } from "./SearchResultCard";
import { SelectedItemCard } from "./SelectedItemCard";

interface SuitcaseSupplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suitcase: Suitcase | null;
  suitcaseId?: string | null;
  onRefresh?: () => void;
}

export function SuitcaseSupplyDialog({ 
  open, 
  onOpenChange, 
  suitcase, 
  suitcaseId,
  onRefresh 
}: SuitcaseSupplyDialogProps) {
  // Priorizar suitcase.id, mas usar suitcaseId como fallback
  const effectiveSuitcaseId = suitcase?.id || suitcaseId || null;

  const {
    searchTerm,
    setSearchTerm,
    isSearching,
    searchResults,
    selectedItems,
    isSupplying,
    isGeneratingPdf,
    isLoadingCurrentItems,
    handleSearch,
    handleKeyPress,
    handleAddItem,
    handleRemoveItem,
    handleIncreaseQuantity,
    handleDecreaseQuantity,
    calculateTotalValue,
    calculateTotalItems,
    handleFinishSupply,
    formatMoney
  } = useSupplyDialog(effectiveSuitcaseId, open, onOpenChange, onRefresh);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Package className="mr-2 h-5 w-5" />
            Abastecer Maleta
          </DialogTitle>
          <DialogDescription>
            {suitcase && (
              <span>
                Adicione produtos à maleta {suitcase.code || `#${suitcase.id?.substring(0, 8)}`}
                {suitcase.seller?.name && ` - ${suitcase.seller.name}`}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-4 h-full grow">
          {/* Painel de busca */}
          <div className="w-full sm:w-2/5 flex flex-col">
            <div className="flex items-center space-x-2 mb-4">
              <Input
                placeholder="Buscar por nome ou código"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyPress}
                className="flex-1"
              />
              <Button
                onClick={handleSearch}
                disabled={isSearching}
                className="shrink-0"
                variant="outline"
              >
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>

            <ScrollArea className="h-[350px] rounded-md border">
              <div className="p-4 space-y-4">
                {isSearching ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((item) => (
                    <SearchResultCard 
                      key={item.id} 
                      item={item}
                      onAdd={handleAddItem}
                      formatMoney={formatMoney}
                    />
                  ))
                ) : searchTerm.length > 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    Nenhum resultado encontrado
                  </p>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    Digite nome ou código do produto para buscar
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Separador vertical em telas maiores */}
          <div className="hidden sm:block">
            <Separator orientation="vertical" />
          </div>

          {/* Separador horizontal em telas menores */}
          <div className="sm:hidden">
            <Separator />
          </div>

          {/* Painel de itens selecionados */}
          <div className="w-full sm:w-3/5 flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-base font-medium">Itens selecionados</h3>
              <span className="text-sm text-gray-500">
                {selectedItems.length} {selectedItems.length === 1 ? "item" : "itens"}
              </span>
            </div>

            <ScrollArea className="h-[350px] rounded-md border">
              <div className="p-4 space-y-4">
                {isLoadingCurrentItems ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
                  </div>
                ) : selectedItems.length > 0 ? (
                  selectedItems.map((item) => (
                    <SelectedItemCard 
                      key={item.id} 
                      item={item}
                      onRemove={handleRemoveItem}
                      onIncrease={handleIncreaseQuantity}
                      onDecrease={handleDecreaseQuantity}
                      formatMoney={formatMoney}
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                    <Package className="h-8 w-8 mb-2" />
                    <p>Nenhum item selecionado</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="mt-4 p-3 bg-gray-50 rounded-md flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">Total de peças: <span className="font-semibold">{calculateTotalItems()}</span></p>
                <p className="text-lg font-semibold text-pink-600">
                  Total: {formatMoney(calculateTotalValue())}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:space-x-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSupplying || isGeneratingPdf}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => handleFinishSupply(suitcase)}
            disabled={selectedItems.length === 0 || isSupplying || isGeneratingPdf}
            className="gap-2"
          >
            {isSupplying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isGeneratingPdf ? (
              <FileText className="h-4 w-4" />
            ) : (
              <Package className="h-4 w-4" />
            )}
            {isSupplying ? "Abastecendo..." : isGeneratingPdf ? "Gerando PDF..." : "Concluir Abastecimento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
