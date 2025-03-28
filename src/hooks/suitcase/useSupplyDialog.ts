
/**
 * Hook para Gerenciar o Diálogo de Abastecimento
 * @file Este hook contém a lógica para adicionar itens a uma maleta
 */
import { useState, useCallback } from "react";
import { CombinedSuitcaseController } from "@/controllers/suitcase";
import { SupplyItem } from "@/types/suitcase";
import { toast } from "sonner";
import { openPdfInNewTab } from "@/utils/pdfUtils";

// Propriedades para o hook
interface UseSupplyDialogProps {
  suitcaseId: string | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function useSupplyDialog({ 
  suitcaseId, 
  open,
  onOpenChange,
  onSuccess 
}: UseSupplyDialogProps) {
  // Estados para controlar a busca e adição de itens
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<SupplyItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [addingItem, setAddingItem] = useState<{ [key: string]: boolean }>({});
  const [isPrintingPdf, setIsPrintingPdf] = useState<boolean>(false);
  const [isSupplying, setIsSupplying] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isLoadingCurrentItems, setIsLoadingCurrentItems] = useState<boolean>(false);

  // Função para formatar valores monetários
  const formatMoney = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para buscar itens no inventário
  const handleSearch = useCallback(async (e?: React.KeyboardEvent) => {
    // Verificar se é um evento de teclado e se não é a tecla Enter
    if (e && e.key !== "Enter") return;
    
    // Verificar se o termo de busca é válido
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    
    try {
      // Buscar itens no inventário que correspondem ao termo de busca
      const results = await CombinedSuitcaseController.searchInventoryItems(searchTerm);
      
      // Filtrar itens já selecionados
      const filteredResults = results.filter(
        (result: any) => !selectedItems.some(item => item.inventory_id === result.id)
      );
      
      setSearchResults(filteredResults);
    } catch (error) {
      console.error("Erro ao buscar itens:", error);
      toast.error("Erro ao buscar itens no inventário");
    } finally {
      setIsSearching(false);
    }
  }, [searchTerm, selectedItems]);

  // Handler para eventos de teclado
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch(e);
    }
  }, [handleSearch]);

  // Função para adicionar um item à seleção
  const handleAddItem = useCallback((item: any) => {
    // Verificar se o item existe e tem os campos necessários
    if (!item || !item.id) return;
    
    // Criar um item formatado para adicionar à seleção
    const newItem: SupplyItem = {
      inventory_id: item.id,
      quantity: 1,
      product: {
        id: item.id,
        name: item.name || "Produto sem nome",
        sku: item.sku || "SKU não disponível",
        price: item.price || 0,
        photo_url: item.photo_url || undefined
      }
    };
    
    // Adicionar à lista de itens selecionados
    setSelectedItems(prev => [...prev, newItem]);
    
    // Remover dos resultados da busca
    setSearchResults(prev => prev.filter(result => result.id !== item.id));
    
    // Limpar o termo de busca
    setSearchTerm("");
  }, []);

  // Função para aumentar a quantidade de um item
  const handleIncreaseQuantity = useCallback((inventoryId: string) => {
    setSelectedItems(prev => 
      prev.map(item => 
        item.inventory_id === inventoryId 
          ? { ...item, quantity: (item.quantity || 1) + 1 } 
          : item
      )
    );
  }, []);

  // Função para diminuir a quantidade de um item
  const handleDecreaseQuantity = useCallback((inventoryId: string) => {
    setSelectedItems(prev => 
      prev.map(item => {
        if (item.inventory_id === inventoryId) {
          const newQuantity = Math.max(1, (item.quantity || 1) - 1);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  }, []);

  // Função para atualizar a quantidade de um item
  const handleUpdateQuantity = useCallback((inventoryId: string, quantity: number) => {
    if (quantity < 1) return;
    
    setSelectedItems(prev => 
      prev.map(item => 
        item.inventory_id === inventoryId 
          ? { ...item, quantity } 
          : item
      )
    );
  }, []);

  // Função para remover um item da seleção
  const handleRemoveItem = useCallback((inventoryId: string) => {
    setSelectedItems(prev => prev.filter(item => item.inventory_id !== inventoryId));
  }, []);

  // Função para calcular o valor total dos itens selecionados
  const calculateTotalValue = useCallback(() => {
    return selectedItems.reduce((sum, item) => {
      const price = item.product?.price || 0;
      const quantity = item.quantity || 1;
      return sum + (price * quantity);
    }, 0);
  }, [selectedItems]);

  // Função para calcular o total de itens
  const calculateTotalItems = useCallback(() => {
    return selectedItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }, [selectedItems]);

  // Função para concluir o abastecimento
  const handleFinishSupply = useCallback(async (suitcaseInfo: any) => {
    if (!suitcaseId) {
      toast.error("ID da maleta não informado");
      return;
    }
    
    if (selectedItems.length === 0) {
      toast.error("Nenhum item selecionado para abastecimento");
      return;
    }
    
    setIsSupplying(true);
    
    try {
      // Adicionar itens à maleta
      await CombinedSuitcaseController.supplySuitcase(suitcaseId, selectedItems);
      
      toast.success("Maleta abastecida com sucesso!");
      
      // Gerar PDF após abastecimento concluído
      await handleGeneratePdf(suitcaseInfo);
      
      // Chamar callback de sucesso
      if (onSuccess) onSuccess();
      
      // Fechar diálogo
      if (onOpenChange) onOpenChange(false);
    } catch (error) {
      console.error("Erro ao abastecer maleta:", error);
      toast.error("Erro ao abastecer maleta");
    } finally {
      setIsSupplying(false);
    }
  }, [suitcaseId, selectedItems, onSuccess, onOpenChange]);

  // Função para abastecer a maleta com os itens selecionados
  const handleSupplySuitcase = useCallback(async () => {
    if (!suitcaseId) {
      toast.error("ID da maleta não informado");
      return;
    }
    
    if (selectedItems.length === 0) {
      toast.error("Nenhum item selecionado para abastecimento");
      return;
    }
    
    setIsAdding(true);
    
    try {
      // Adicionar itens à maleta
      await CombinedSuitcaseController.supplySuitcase(suitcaseId, selectedItems);
      
      toast.success("Maleta abastecida com sucesso!");
      
      // Chamar callback de sucesso
      if (onSuccess) onSuccess();
      
      // Fechar diálogo
      if (onOpenChange) onOpenChange(false);
    } catch (error) {
      console.error("Erro ao abastecer maleta:", error);
      toast.error("Erro ao abastecer maleta");
    } finally {
      setIsAdding(false);
    }
  }, [suitcaseId, selectedItems, onSuccess, onOpenChange]);

  // Função para adicionar um item diretamente à maleta
  const handleAddItemDirectly = useCallback(async (inventoryId: string) => {
    if (!inventoryId || !suitcaseId) return;
    
    setAddingItem(prev => ({ ...prev, [inventoryId]: true }));
    
    try {
      // Adicionar o item à maleta
      await CombinedSuitcaseController.addItemToSuitcase(suitcaseId, inventoryId);
      
      // Remover dos resultados da busca
      setSearchResults(prev => prev.filter(item => item.id !== inventoryId));
      
      toast.success("Item adicionado à maleta!");
      
      // Chamar callback de sucesso
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Erro ao adicionar item à maleta:", error);
      toast.error("Erro ao adicionar item à maleta");
    } finally {
      setAddingItem(prev => ({ ...prev, [inventoryId]: false }));
    }
  }, [suitcaseId, onSuccess]);

  // Função para gerar PDF após abastecimento
  const handleGeneratePdf = useCallback(async (suitcaseInfo: any) => {
    if (!suitcaseId || selectedItems.length === 0) return;
    
    setIsGeneratingPdf(true);
    
    try {
      // Gerar PDF de abastecimento
      const pdfUrl = await CombinedSuitcaseController.generateSupplyPDF(
        suitcaseId,
        selectedItems,
        suitcaseInfo
      );
      
      // Abrir PDF em nova aba
      openPdfInNewTab(pdfUrl);
      
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF de abastecimento");
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [suitcaseId, selectedItems]);

  // Função para resetar estados
  const resetState = useCallback(() => {
    setSearchTerm("");
    setSearchResults([]);
    setSelectedItems([]);
    setIsLoading(false);
    setIsSearching(false);
    setIsAdding(false);
    setAddingItem({});
    setIsPrintingPdf(false);
    setIsSupplying(false);
    setIsGeneratingPdf(false);
    setIsLoadingCurrentItems(false);
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    selectedItems,
    isLoading,
    isSearching,
    isAdding,
    addingItem,
    isPrintingPdf,
    isSupplying,
    isGeneratingPdf,
    isLoadingCurrentItems,
    handleSearch,
    handleKeyPress,
    handleAddItem,
    handleSelectItem: handleAddItem, // Alias para compatibilidade
    handleUpdateQuantity,
    handleRemoveItem,
    handleIncreaseQuantity,
    handleDecreaseQuantity,
    handleSupplySuitcase,
    handleAddItemDirectly,
    handleGeneratePdf,
    handleFinishSupply,
    calculateTotalValue,
    calculateTotalItems,
    formatMoney,
    resetState
  };
}
