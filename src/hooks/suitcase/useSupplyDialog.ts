
/**
 * Hook para Gerenciar o Diálogo de Abastecimento
 * @file Este hook centraliza a lógica do diálogo de abastecimento de maletas
 * @relacionamento Utilizado pelo componente SuitcaseSupplyDialog
 */
import { useState, useEffect } from "react";
import { CombinedSuitcaseController } from "@/controllers/suitcase";
import { Suitcase } from "@/types/suitcase";
import { toast } from "sonner";
import { openPdfInNewTab } from "@/utils/pdfUtils";
import { formatMoney } from "@/utils/formatUtils";

interface SelectedItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  max_quantity?: number;
  quantity_available?: number;
  quantity_reserved?: number;
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

  // Limpar quando o diálogo for fechado
  useEffect(() => {
    if (!open) {
      setSearchTerm("");
      setSearchResults([]);
      setSelectedItems([]);
    } else if (suitcaseId) {
      // Carregar itens existentes na maleta quando o diálogo abrir
      loadCurrentSuitcaseItems(suitcaseId);
    }
  }, [open, suitcaseId]);

  // Função auxiliar para agrupar itens idênticos
  const groupIdenticalItems = (items: SelectedItem[]): SelectedItem[] => {
    const groupedMap = new Map<string, SelectedItem>();
    
    items.forEach(item => {
      if (groupedMap.has(item.id)) {
        // Se o item já existe no map, apenas atualiza a quantidade
        const existingItem = groupedMap.get(item.id)!;
        existingItem.quantity += item.quantity;
        
        // Se algum dos itens está na maleta, marcar o item agrupado como na maleta
        if (item.from_suitcase) {
          existingItem.from_suitcase = true;
        }
      } else {
        // Se não existe, adiciona ao map
        groupedMap.set(item.id, { ...item });
      }
    });
    
    return Array.from(groupedMap.values());
  };

  // Carregar itens existentes na maleta
  const loadCurrentSuitcaseItems = async (suitcaseId: string) => {
    try {
      setIsLoadingCurrentItems(true);
      const items = await CombinedSuitcaseController.getSuitcaseItems(suitcaseId);
      
      // Filtrar apenas itens em posse (não vendidos, perdidos ou devolvidos)
      const inPossessionItems = items.filter(item => item.status === 'in_possession');
      
      // Transformar para o formato de itens selecionados
      const currentItems: SelectedItem[] = inPossessionItems.map(item => ({
        id: item.inventory_id,
        name: item.product?.name || 'Item sem nome',
        sku: item.product?.sku || 'N/A',
        price: item.product?.price || 0,
        quantity: item.quantity || 1,
        photo_url: item.product?.photo_url,
        from_suitcase: true // Marcar como item já existente na maleta
      }));
      
      // Agrupar itens idênticos antes de definir no estado
      setSelectedItems(groupIdenticalItems(currentItems));
    } catch (error) {
      console.error("Erro ao carregar itens da maleta:", error);
      toast.error("Erro ao carregar itens existentes da maleta");
    } finally {
      setIsLoadingCurrentItems(false);
    }
  };

  // Buscar itens do inventário
  const handleSearch = async () => {
    if (!searchTerm || searchTerm.length < 2) {
      toast.warning("Digite pelo menos 2 caracteres para pesquisar");
      return;
    }

    setIsSearching(true);
    try {
      const results = await CombinedSuitcaseController.searchInventoryForSuitcase(searchTerm);
      
      // Filtrar resultados que já estão selecionados
      const filteredResults = results.filter(
        result => !selectedItems.some(item => item.id === result.id)
      );
      
      setSearchResults(filteredResults);
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
      const newItem = { 
        id: item.id,
        name: item.name,
        sku: item.sku,
        price: item.price,
        quantity: 1,
        max_quantity: item.quantity_total,
        quantity_available: item.quantity_available,
        quantity_reserved: item.quantity_reserved,
        photo_url: item.photo_url
      };
      setSelectedItems(currentItems => groupIdenticalItems([...currentItems, newItem]));
    }

    // Remover dos resultados da busca
    setSearchResults(searchResults.filter((resultItem) => resultItem.id !== item.id));
  };

  // Remover item da lista de selecionados
  const handleRemoveItem = (itemId: string) => {
    const itemToRemove = selectedItems.find(item => item.id === itemId);
    
    // Remover item da lista de selecionados
    setSelectedItems(selectedItems.filter((item) => item.id !== itemId));

    // Adicionar de volta aos resultados da busca apenas se não for um item já existente na maleta
    if (itemToRemove && !itemToRemove.from_suitcase) {
      setSearchResults([...searchResults, { 
        id: itemToRemove.id,
        name: itemToRemove.name,
        sku: itemToRemove.sku,
        price: itemToRemove.price,
        quantity: itemToRemove.quantity_available || itemToRemove.max_quantity,
        quantity_available: itemToRemove.quantity_available,
        quantity_reserved: itemToRemove.quantity_reserved,
        photo_url: itemToRemove.photo_url
      }]);
    }
  };

  // Incrementar quantidade do item
  const handleIncreaseQuantity = (itemId: string) => {
    const updatedItems = selectedItems.map((item) => {
      if (item.id === itemId) {
        // Para novos itens, verificar limite de estoque disponível
        if (!item.from_suitcase) {
          const availableQuantity = item.quantity_available || item.max_quantity || Number.MAX_SAFE_INTEGER;
          if ((item.quantity || 1) < availableQuantity) {
            return { ...item, quantity: (item.quantity || 1) + 1 };
          }
          toast.warning(`Limite de estoque disponível atingido: ${availableQuantity} unidades`);
          return item;
        }
        // Para itens existentes, permitir aumentar sem limite (serão novos itens adicionados)
        return { ...item, quantity: (item.quantity || 1) + 1 };
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
      return total + item.price * item.quantity;
    }, 0);
  };

  // Calcular total de peças
  const calculateTotalItems = () => {
    return selectedItems.reduce((total, item) => {
      return total + item.quantity;
    }, 0);
  };

  // Finalizar abastecimento
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
      console.log("[useSupplyDialog] Iniciando processo de abastecimento");
      console.log("[useSupplyDialog] Maleta:", suitcaseId);
      console.log("[useSupplyDialog] Código da maleta:", suitcase.code);
      console.log("[useSupplyDialog] Qtde de itens:", selectedItems.length);
      
      // Separar itens novos e itens existentes com quantidades modificadas
      const existingItems = selectedItems.filter(item => item.from_suitcase);
      const newItems = selectedItems.filter(item => !item.from_suitcase);
      
      console.log(`[useSupplyDialog] Itens: ${newItems.length} novos, ${existingItems.length} existentes`);
      
      // Preparar os itens para abastecimento
      const itemsToSupply = newItems.map(item => ({
        inventory_id: item.id,
        quantity: item.quantity,
        product: {
          id: item.id,
          name: item.name,
          sku: item.sku,
          price: item.price,
          photo_url: item.photo_url
        }
      }));

      // Abastecer a maleta com novos itens
      let addedItems = [];
      if (itemsToSupply.length > 0) {
        try {
          console.log(`[useSupplyDialog] Enviando ${itemsToSupply.length} itens para abastecimento`);
          console.log("[useSupplyDialog] Detalhes dos itens:", JSON.stringify(itemsToSupply, null, 2));
          
          const itemsLog = itemsToSupply.map(item => 
            `[LOG] Adicionando ${item.quantity} unidades do item ${item.product.name} (${item.product.sku}) à maleta ${suitcase.code || suitcaseId}`
          );
          
          // Exibir logs para cada item sendo adicionado
          itemsLog.forEach(log => console.log(log));
          
          addedItems = await CombinedSuitcaseController.supplySuitcase(
            suitcaseId,
            itemsToSupply
          );
          
          console.log("[useSupplyDialog] Itens adicionados com sucesso:", addedItems);
          console.log(`[LOG] ${addedItems.length} itens adicionados com sucesso à maleta ${suitcase.code || suitcaseId}`);
        } catch (error: any) {
          const mensagemErro = error instanceof Error 
            ? error.message 
            : "Não foi possível adicionar os itens à maleta";
          
          console.error(`[useSupplyDialog] Erro ao adicionar itens à maleta: ${mensagemErro}`);
          console.error(`[useSupplyDialog] Detalhes do erro:`, error);
          console.error(`[ERRO] ${mensagemErro}`);
          
          // Exibir mensagem mais explicativa
          toast.error(mensagemErro, {
            description: "Verifique se há estoque disponível e se o item não está vinculado a outra maleta."
          });
          setIsSupplying(false);
          return;
        }
      }
      
      // Gerar PDF após abastecimento com todos os itens (novos e existentes)
      setIsGeneratingPdf(true);
      
      // Combinar todos os itens para o PDF
      const allItems = [
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
      
      try {
        console.log("[useSupplyDialog] Gerando PDF de abastecimento");
        const pdfUrl = await CombinedSuitcaseController.generateSupplyPDF(
          suitcaseId,
          allItems,
          suitcase
        );
        
        if (!pdfUrl) {
          throw new Error("Não foi possível gerar o PDF de abastecimento");
        }
        
        // Abrir PDF em nova aba
        openPdfInNewTab(pdfUrl);
      } catch (pdfError) {
        console.error("[useSupplyDialog] Erro ao gerar PDF de abastecimento:", pdfError);
        toast.error("Abastecimento realizado, mas não foi possível gerar o PDF");
      }
      
      // Mensagem de sucesso
      if (addedItems.length > 0) {
        toast.success(`Maleta abastecida com ${addedItems.length} novos itens`);
      } else {
        toast.success("Nenhum novo item adicionado à maleta");
      }
      
      // Atualizar e fechar
      if (onRefresh) onRefresh();
      onOpenChange(false);
    } catch (error: any) {
      console.error("[useSupplyDialog] Erro ao abastecer maleta:", error);
      
      // Mostrar mensagem de erro específica
      const errorMessage = error instanceof Error ? error.message : "Erro ao abastecer maleta";
      console.error(`[ERRO] ${errorMessage}`);
      toast.error(errorMessage);
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
