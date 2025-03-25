
import { useState } from "react";
import { CombinedSuitcaseController } from "@/controllers/suitcase";
import { toast } from "sonner";

export function useInventorySearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState<{ [key: string]: boolean }>({});

  // Função para buscar itens no inventário
  const handleSearch = async (e?: React.KeyboardEvent) => {
    if (e && e.key !== "Enter") return;
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    try {
      const results = await CombinedSuitcaseController.searchInventoryItems(searchTerm);
      setSearchResults(results);
    } catch (error) {
      console.error("Erro ao buscar itens:", error);
      toast.error("Erro ao buscar itens no inventário");
    } finally {
      setIsSearching(false);
    }
  };

  // Função para adicionar item à maleta
  const handleAddItem = async (suitcaseId: string, inventoryId: string) => {
    if (!suitcaseId) return;
    
    setIsAdding(prev => ({ ...prev, [inventoryId]: true }));
    try {
      await CombinedSuitcaseController.addItemToSuitcase(suitcaseId, inventoryId);
      toast.success("Item adicionado à maleta com sucesso");
      
      // Limpar resultados da busca
      setSearchResults([]);
      setSearchTerm("");
      
      return true; // Retornar true para indicar sucesso
    } catch (error: any) {
      console.error("Erro ao adicionar item:", error);
      toast.error(error.message || "Erro ao adicionar item à maleta");
      return false;
    } finally {
      setIsAdding(prev => ({ ...prev, [inventoryId]: false }));
    }
  };

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    setSearchResults,
    isSearching,
    isAdding,
    handleSearch,
    handleAddItem
  };
}
