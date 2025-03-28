/**
 * Hook para Gerenciar o Diálogo de Abastecimento
 * @file Este hook centraliza a lógica do diálogo de abastecimento de maletas
 * @relacionamento Utilizado pelo componente SuitcaseSupplyDialog
 */
import { useState, useEffect } from "react";
import { CombinedSuitcaseController } from "@/controllers/suitcase";
import { Suitcase, SupplyItem } from "@/types/suitcase";
import { toast } from "sonner";
import { openPdfInNewTab } from "@/utils/pdfUtils";
import { formatMoney } from "@/utils/formatUtils";
import { getProductPhotoUrl } from "@/utils/photoUtils";

interface SelectedItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  max_quantity?: number;
  photo_url?: string | { photo_url: string }[];
  from_suitcase?: boolean;
}

export function useSupplyDialog(
  suitcaseId: string | null,
  open: boolean,
  onOpenChange: (open: boolean) => void,
  onRefresh?: () => void
) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [isSupplying, setIsSupplying] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isLoadingCurrentItems, setIsLoadingCurrentItems] = useState(false);

  useEffect(() => {
    if (!open) {
      setSearchTerm("");
      setSearchResults([]);
      setSelectedItems([]);
    } else if (suitcaseId) {
      loadCurrentSuitcaseItems(suitcaseId);
    }
  }, [open, suitcaseId]);

  const groupIdenticalItems = (items: SelectedItem[]): SelectedItem[] => {
    const groupedMap = new Map<string, SelectedItem>();
    
    items.forEach(item => {
      if (groupedMap.has(item.id)) {
        const existingItem = groupedMap.get(item.id)!;
        existingItem.quantity += item.quantity;
        
        if (item.from_suitcase) {
          existingItem.from_suitcase = true;
        }
      } else {
        groupedMap.set(item.id, { ...item });
      }
    });
    
    return Array.from(groupedMap.values());
  };

  const loadCurrentSuitcaseItems = async (suitcaseId: string) => {
    try {
      setIsLoadingCurrentItems(true);
      const items = await CombinedSuitcaseController.getSuitcaseItems(suitcaseId);
      
      const inPossessionItems = items.filter(item => item.status === 'in_possession');
      
      const currentItems: SelectedItem[] = inPossessionItems.map(item => ({
        id: item.inventory_id,
        name: item.product?.name || 'Item sem nome',
        sku: item.product?.sku || 'N/A',
        price: item.product?.price || 0,
        quantity: item.quantity || 1,
        photo_url: item.product?.photo_url,
        from_suitcase: true
      }));
      
      setSelectedItems(groupIdenticalItems(currentItems));
    } catch (error) {
      console.error("Erro ao carregar itens da maleta:", error);
      toast.error("Erro ao carregar itens existentes da maleta");
    } finally {
      setIsLoadingCurrentItems(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm || searchTerm.length < 2) {
      toast.warning("Digite pelo menos 2 caracteres para pesquisar");
      return;
    }

    setIsSearching(true);
    try {
      const results = await CombinedSuitcaseController.searchInventoryForSuitcase(searchTerm, suitcaseId || undefined);
      
      const filteredResults = results.filter(
        result => !selectedItems.some(item => item.id === result.product.id)
      );
      
      setSearchResults(filteredResults);
    } catch (error) {
      console.error("Erro ao buscar itens:", error);
      toast.error("Erro ao buscar itens do inventário");
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleAddItem = (item: SupplyItem) => {
    if (!item.product) return;
    
    const productId = item.product.id;
    
    const existingItemIndex = selectedItems.findIndex(
      (selectedItem) => selectedItem.id === productId
    );

    if (existingItemIndex !== -1) {
      const updatedItems = [...selectedItems];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: (updatedItems[existingItemIndex].quantity || 1) + 1
      };
      setSelectedItems(updatedItems);
    } else {
      const newItem: SelectedItem = { 
        id: productId,
        name: item.product.name,
        sku: item.product.sku,
        price: item.product.price,
        quantity: 1,
        max_quantity: item.quantity,
        photo_url: item.product.photo_url
      };
      setSelectedItems(currentItems => groupIdenticalItems([...currentItems, newItem]));
    }

    setSearchResults(searchResults.filter((resultItem) => resultItem.product.id !== productId));
  };

  const handleRemoveItem = (itemId: string) => {
    const itemToRemove = selectedItems.find(item => item.id === itemId);
    
    setSelectedItems(selectedItems.filter((item) => item.id !== itemId));

    if (itemToRemove && !itemToRemove.from_suitcase) {
      setSearchResults([...searchResults, { 
        inventory_id: itemToRemove.id,
        quantity: itemToRemove.max_quantity || 1,
        product: { 
          id: itemToRemove.id,
          name: itemToRemove.name,
          sku: itemToRemove.sku,
          price: itemToRemove.price,
          photo_url: itemToRemove.photo_url
        }
      }]);
    }
  };

  const handleIncreaseQuantity = (itemId: string) => {
    const updatedItems = selectedItems.map((item) => {
      if (item.id === itemId) {
        if (!item.from_suitcase) {
          const maxQuantity = item.max_quantity || Number.MAX_SAFE_INTEGER;
          if ((item.quantity || 1) < maxQuantity) {
            return { ...item, quantity: (item.quantity || 1) + 1 };
          }
          toast.warning(`Limite de estoque atingido: ${maxQuantity} unidades`);
          return item;
        }
        return { ...item, quantity: (item.quantity || 1) + 1 };
      }
      return item;
    });
    setSelectedItems(updatedItems);
  };

  const handleDecreaseQuantity = (itemId: string) => {
    const updatedItems = selectedItems.map((item) => {
      if (item.id === itemId && item.quantity > 1) {
        return { ...item, quantity: item.quantity - 1 };
      }
      return item;
    });
    setSelectedItems(updatedItems);
  };

  const calculateTotalValue = () => {
    return selectedItems.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);
  };

  const calculateTotalItems = () => {
    return selectedItems.reduce((total, item) => {
      return total + item.quantity;
    }, 0);
  };

  const handleFinishSupply = async (suitcase: Suitcase | null) => {
    if (!suitcaseId || !suitcase) {
      toast.error("Maleta não encontrada");
      return;
    }

    if (selectedItems.length === 0) {
      toast.warning("Selecione pelo menos um item para abastecer a maleta");
      return;
    }

    setIsSupplying(true);
    try {
      const existingItems = selectedItems.filter(item => item.from_suitcase);
      const newItems = selectedItems.filter(item => !item.from_suitcase);
      
      let addedItems = [];
      if (newItems.length > 0) {
        for (const item of newItems) {
          try {
            const addedItem = await CombinedSuitcaseController.supplySuitcase(
              suitcaseId,
              item.id
            );
            
            if (addedItem) {
              addedItems.push(addedItem);
            }
          } catch (error) {
            console.error(`Erro ao adicionar item ${item.id} à maleta:`, error);
          }
        }
        
        if (addedItems.length > 0) {
          console.log("Itens adicionados com sucesso:", addedItems);
        } else {
          toast.error("Não foi possível adicionar os itens à maleta");
          setIsSupplying(false);
          return;
        }
      }
      
      setIsGeneratingPdf(true);
      
      const allItemsForPdf = [
        ...addedItems,
        ...existingItems.map(item => ({
          inventory_id: item.id,
          quantity: item.quantity,
          product: {
            id: item.id,
            name: item.name,
            sku: item.sku,
            price: item.price,
            photo_url: item.photo_url
          }
        }))
      ];
      
      const pdfUrl = await CombinedSuitcaseController.generateSupplyPDF(
        suitcaseId,
        suitcase,
        allItemsForPdf
      );
      
      if (!pdfUrl) {
        throw new Error("Não foi possível gerar o PDF de abastecimento");
      }
      
      openPdfInNewTab(pdfUrl);
      
      if (addedItems.length > 0) {
        toast.success(`Maleta abastecida com ${addedItems.length} novos itens`);
      } else {
        toast.success("Nenhum novo item adicionado à maleta");
      }
      
      if (onRefresh) onRefresh();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao abastecer maleta:", error);
      toast.error("Erro ao abastecer maleta");
    } finally {
      setIsSupplying(false);
      setIsGeneratingPdf(false);
    }
  };

  return {
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
  };
}
