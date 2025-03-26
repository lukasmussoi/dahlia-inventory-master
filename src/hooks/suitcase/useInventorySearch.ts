
import { useState, useCallback } from "react";
import { CombinedSuitcaseController } from "@/controllers/suitcase";
import { toast } from "sonner";

export function useInventorySearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState<{ [key: string]: boolean }>({});

  const handleSearch = async (e?: React.KeyboardEvent) => {
    if (e && e.key !== "Enter") return;
    
    if (!searchTerm || searchTerm.trim().length < 3) {
      toast.warning("Digite pelo menos 3 caracteres para buscar");
      return;
    }

    setIsSearching(true);
    try {
      const results = await CombinedSuitcaseController.searchInventoryItems(searchTerm);
      setSearchResults(results);
      if (results.length === 0) {
        toast.info("Nenhum item encontrado");
      }
    } catch (error) {
      console.error("Erro ao buscar itens:", error);
      toast.error("Erro ao buscar itens");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddItem = async (suitcaseId: string, inventoryId: string) => {
    setIsAdding(prev => ({ ...prev, [inventoryId]: true }));
    try {
      await CombinedSuitcaseController.addItemToSuitcase(suitcaseId, inventoryId);
      toast.success("Item adicionado à maleta");
      
      // Remover o item adicionado dos resultados de busca
      setSearchResults(prev => prev.filter(item => item.id !== inventoryId));
      return true;
    } catch (error: any) {
      console.error("Erro ao adicionar item:", error);
      toast.error(error.message || "Erro ao adicionar item à maleta");
      return false;
    } finally {
      setIsAdding(prev => ({ ...prev, [inventoryId]: false }));
    }
  };

  // Função para resetar os estados
  const resetSearchState = useCallback(() => {
    setSearchTerm("");
    setSearchResults([]);
    setIsSearching(false);
    setIsAdding({});
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    isSearching,
    isAdding,
    handleSearch,
    handleAddItem,
    resetSearchState
  };
}
