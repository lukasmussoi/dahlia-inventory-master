
/**
 * Diálogo de Abastecimento de Maleta
 * @file Este componente gerencia a interface para adicionar produtos a uma maleta
 * @relacionamento Utiliza o SuitcaseController para abastecer a maleta
 */
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { CombinedSuitcaseController } from "@/controllers/suitcase";
import { Suitcase } from "@/types/suitcase";
import { Package, Search, X, Plus, Minus, Loader2, FileText } from "lucide-react";
import { openPdfInNewTab } from "@/utils/pdfUtils";
import { formatMoney } from "@/utils/formatUtils";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface SuitcaseSupplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suitcase: Suitcase | null;
  onRefresh?: () => void;
}

export function SuitcaseSupplyDialog({ 
  open, 
  onOpenChange, 
  suitcase, 
  onRefresh 
}: SuitcaseSupplyDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [isSupplying, setIsSupplying] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Limpar quando o diálogo for fechado
  useEffect(() => {
    if (!open) {
      setSearchTerm("");
      setSearchResults([]);
      setSelectedItems([]);
    }
  }, [open]);

  // Buscar itens do inventário
  const handleSearch = async () => {
    if (!searchTerm || searchTerm.length < 2) {
      toast.warning("Digite pelo menos 2 caracteres para pesquisar");
      return;
    }

    setIsSearching(true);
    try {
      const results = await CombinedSuitcaseController.searchInventoryItems(searchTerm);
      setSearchResults(results);
    } catch (error) {
      console.error("Erro ao buscar itens:", error);
      toast.error("Erro ao buscar itens do inventário");
    } finally {
      setIsSearching(false);
    }
  };

  // Lidar com tecla Enter na busca
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Adicionar item à lista de selecionados
  const handleAddItem = (item: any) => {
    // Verificar se o item já está na lista
    const existingItemIndex = selectedItems.findIndex(
      (selectedItem) => selectedItem.id === item.id
    );

    if (existingItemIndex !== -1) {
      // Se já estiver na lista, incrementar a quantidade
      const updatedItems = [...selectedItems];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: (updatedItems[existingItemIndex].quantity || 1) + 1
      };
      setSelectedItems(updatedItems);
    } else {
      // Se não estiver na lista, adicionar com quantidade 1
      setSelectedItems([...selectedItems, { ...item, quantity: 1 }]);
    }

    // Remover dos resultados da busca
    setSearchResults(searchResults.filter((resultItem) => resultItem.id !== item.id));
  };

  // Remover item da lista de selecionados
  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(selectedItems.filter((item) => item.id !== itemId));

    // Adicionar de volta aos resultados da busca
    const removedItem = selectedItems.find((item) => item.id === itemId);
    if (removedItem) {
      setSearchResults([...searchResults, { ...removedItem, quantity: undefined }]);
    }
  };

  // Incrementar quantidade do item
  const handleIncreaseQuantity = (itemId: string) => {
    const updatedItems = selectedItems.map((item) => {
      if (item.id === itemId) {
        // Verificar limite de estoque
        if ((item.quantity || 1) < (item.quantity_available || item.quantity)) {
          return { ...item, quantity: (item.quantity || 1) + 1 };
        }
        toast.warning(`Limite de estoque atingido: ${item.quantity_available || item.quantity} unidades`);
      }
      return item;
    });
    setSelectedItems(updatedItems);
  };

  // Decrementar quantidade do item
  const handleDecreaseQuantity = (itemId: string) => {
    const updatedItems = selectedItems.map((item) => {
      if (item.id === itemId && item.quantity > 1) {
        return { ...item, quantity: item.quantity - 1 };
      }
      return item;
    });
    setSelectedItems(updatedItems);
  };

  // Calcular valor total
  const calculateTotalValue = () => {
    return selectedItems.reduce((total, item) => {
      return total + (item.price || 0) * (item.quantity || 1);
    }, 0);
  };

  // Finalizar abastecimento
  const handleFinishSupply = async () => {
    if (!suitcase?.id) {
      toast.error("Maleta não encontrada");
      return;
    }

    if (selectedItems.length === 0) {
      toast.warning("Selecione pelo menos um item para abastecer a maleta");
      return;
    }

    setIsSupplying(true);
    try {
      // Preparar os itens para abastecimento
      const itemsToSupply = selectedItems.map(item => ({
        inventory_id: item.id,
        quantity: item.quantity || 1,
        product: {
          id: item.id,
          name: item.name,
          sku: item.sku,
          price: item.price,
          photo_url: item.photo_url
        }
      }));

      // Abastecer a maleta
      const addedItems = await CombinedSuitcaseController.supplySuitcase(
        suitcase.id,
        itemsToSupply
      );

      if (addedItems && addedItems.length > 0) {
        toast.success(`Maleta abastecida com ${addedItems.length} itens`);
        
        // Gerar PDF após abastecimento
        setIsGeneratingPdf(true);
        const pdfUrl = await CombinedSuitcaseController.generateSupplyPDF(
          suitcase.id,
          addedItems,
          suitcase
        );
        
        // Abrir PDF em nova aba
        openPdfInNewTab(pdfUrl);
        
        // Atualizar e fechar
        if (onRefresh) onRefresh();
        onOpenChange(false);
      } else {
        toast.warning("Nenhum item foi adicionado à maleta");
      }
    } catch (error) {
      console.error("Erro ao abastecer maleta:", error);
      toast.error("Erro ao abastecer maleta");
    } finally {
      setIsSupplying(false);
      setIsGeneratingPdf(false);
    }
  };

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
                    <Card key={item.id} className="shadow-sm">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium truncate">{item.name}</h4>
                            <p className="text-xs text-gray-500">{item.sku}</p>
                            <p className="text-xs text-gray-500">Estoque: {item.quantity}</p>
                          </div>
                          <p className="text-sm font-medium text-pink-600 mx-2">
                            {formatMoney(item.price)}
                          </p>
                          <Button
                            size="sm"
                            onClick={() => handleAddItem(item)}
                            className="shrink-0 ml-2"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
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
                {selectedItems.length > 0 ? (
                  selectedItems.map((item) => (
                    <Card key={item.id} className="shadow-sm">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium truncate">{item.name}</h4>
                            <p className="text-xs text-gray-500">{item.sku}</p>
                            <p className="text-xs text-gray-600">
                              {formatMoney(item.price)} x {item.quantity} = {formatMoney(item.price * item.quantity)}
                            </p>
                          </div>
                          <div className="flex items-center shrink-0 ml-2">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleDecreaseQuantity(item.id)}
                              disabled={item.quantity <= 1}
                              className="h-8 w-8"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleIncreaseQuantity(item.id)}
                              disabled={(item.quantity || 1) >= (item.quantity_available || item.quantity)}
                              className="h-8 w-8"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleRemoveItem(item.id)}
                              className="h-8 w-8 ml-2"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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
                <p className="text-sm font-medium">Total de peças: <span className="font-semibold">{selectedItems.reduce((sum, item) => sum + (item.quantity || 1), 0)}</span></p>
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
            onClick={handleFinishSupply}
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
