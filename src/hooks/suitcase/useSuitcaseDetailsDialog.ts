
/**
 * Hook para Gerenciar Diálogo de Detalhes da Maleta
 * @file Este hook gerencia o estado e a lógica do diálogo de detalhes da maleta
 * @depends hooks/useSuitcaseQueries - Para carregamento de dados de maletas
 * @depends controllers/SuitcaseController - Para operações relacionadas a maletas
 */

import { useState, useEffect } from "react";
import { useSuitcaseQueries } from "./useSuitcaseQueries";
import { CombinedSuitcaseController } from "@/controllers/suitcase";
import { SuitcaseItem } from "@/types/suitcase";
import { toast } from "sonner";

export function useSuitcaseDetailsDialog(
  suitcaseId: string | null,
  open: boolean,
  onOpenChange: (open: boolean) => void,
  onRefresh?: () => void
) {
  // Estados locais
  const [activeTab, setActiveTab] = useState("info");
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Buscando dados da maleta através do hook de queries
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
    isLoadingAcertos
  } = useSuitcaseQueries(suitcaseId, open);

  // Reseta a aba ativa quando o diálogo é aberto/fechado
  useEffect(() => {
    if (open) {
      setActiveTab("info");
    } else {
      setSearchTerm("");
      setSearchResults([]);
    }
  }, [open]);

  // Função para pesquisar itens no inventário
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      // Certifique-se de utilizar o controlador combinado
      const results = await CombinedSuitcaseController.searchInventoryItems(searchTerm);
      console.log("Resultados da pesquisa:", results);
      setSearchResults(results);
    } catch (error) {
      console.error("Erro ao pesquisar itens:", error);
      toast.error("Erro ao pesquisar itens no inventário");
    } finally {
      setIsSearching(false);
    }
  };

  // Função para adicionar item à maleta
  const handleAddItem = async (inventoryId: string) => {
    if (!suitcaseId) return false;
    
    try {
      setIsAdding(true);
      // Verifica se o item já está em outra maleta
      const itemInfo = await CombinedSuitcaseController.getItemSuitcaseInfo(inventoryId);
      
      if (itemInfo && itemInfo.suitcase_id && itemInfo.suitcase_id !== suitcaseId) {
        toast.error(`Este item já está na maleta ${itemInfo.suitcase_code} (${itemInfo.seller_name || ""})`);
        return false;
      }
      
      await CombinedSuitcaseController.addItemToSuitcase(suitcaseId, inventoryId);
      toast.success("Item adicionado à maleta com sucesso!");
      setSearchTerm("");
      setSearchResults([]);
      
      // Atualizar a lista de itens
      await refetchSuitcaseItems();
      return true;
    } catch (error) {
      console.error("Erro ao adicionar item à maleta:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Erro ao adicionar item à maleta");
      }
      return false;
    } finally {
      setIsAdding(false);
    }
  };

  // Função para alternar status de vendido do item
  const handleToggleSold = async (item: SuitcaseItem, sold: boolean) => {
    try {
      const newStatus = sold ? "sold" : "in_possession";
      await CombinedSuitcaseController.updateSuitcaseItemStatus(item.id, newStatus);
      await refetchSuitcaseItems();
      return true;
    } catch (error) {
      console.error("Erro ao atualizar status do item:", error);
      toast.error("Erro ao atualizar status do item");
      return false;
    }
  };

  // Função para atualizar informações de venda
  const handleUpdateSaleInfo = async (itemId: string, field: string, value: string) => {
    try {
      await CombinedSuitcaseController.updateSaleInfo(itemId, field, value);
      await refetchSuitcaseItems();
      return true;
    } catch (error) {
      console.error("Erro ao atualizar informações de venda:", error);
      toast.error("Erro ao atualizar informações de venda");
      return false;
    }
  };

  // Calculando valor total da maleta
  const calculateTotalValue = () => {
    return suitcaseItems.reduce((total, item) => {
      return total + (item.product?.price || 0);
    }, 0);
  };

  // Função para remover item da maleta
  const handleRemoveItem = async (itemId: string) => {
    try {
      await CombinedSuitcaseController.removeSuitcaseItem(itemId);
      toast.success("Item removido da maleta com sucesso!");
      await refetchSuitcaseItems();
      return true;
    } catch (error) {
      console.error("Erro ao remover item da maleta:", error);
      toast.error("Erro ao remover item da maleta");
      return false;
    }
  };

  return {
    // Estados
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    searchResults,
    isSearching,
    isAdding,
    
    // Dados
    suitcase,
    isLoadingSuitcase,
    promoterInfo,
    loadingPromoterInfo,
    suitcaseItems,
    isLoadingSuitcaseItems,
    acertosHistorico,
    isLoadingAcertos,
    
    // Funções
    handleSearch,
    handleAddItem,
    handleToggleSold,
    handleUpdateSaleInfo,
    calculateTotalValue,
    handleRemoveItem,
    refetchSuitcaseItems,
    refetchSuitcase
  };
}
