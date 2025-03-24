
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Plus } from "lucide-react";
import { suitcaseController } from "@/controllers/suitcaseController";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

export interface SuitcaseInventorySearchProps {
  suitcaseId: string;
  handleClose: () => void;
  onItemAdded: () => void;
}

export function SuitcaseInventorySearch({ 
  suitcaseId, 
  handleClose, 
  onItemAdded 
}: SuitcaseInventorySearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<{[key: string]: boolean}>({});

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (searchTerm.length < 3) {
      toast.error("Digite pelo menos 3 caracteres para pesquisar");
      return;
    }
    
    try {
      setLoading(true);
      const results = await suitcaseController.searchInventoryItems(searchTerm);
      setSearchResults(results);
    } catch (error: any) {
      console.error("Erro ao pesquisar itens:", error);
      toast.error(error.message || "Erro ao pesquisar itens");
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (inventoryId: string) => {
    try {
      setAdding(prev => ({ ...prev, [inventoryId]: true }));
      
      await suitcaseController.addItemToSuitcase(suitcaseId, inventoryId);
      
      toast.success("Item adicionado à maleta com sucesso");
      onItemAdded();
      
      // Remover o item adicionado dos resultados
      setSearchResults(prev => prev.filter(item => item.id !== inventoryId));
    } catch (error: any) {
      console.error("Erro ao adicionar item:", error);
      toast.error(error.message || "Erro ao adicionar item à maleta");
    } finally {
      setAdding(prev => ({ ...prev, [inventoryId]: false }));
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Buscar Itens</h3>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <Input
            placeholder="Buscar por nome, código, etc."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={loading}>
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </form>
        
        {searchResults.length > 0 ? (
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Nome</th>
                  <th className="text-right py-2">Preço</th>
                  <th className="text-right py-2">Estoque</th>
                  <th className="text-right py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-2">
                      <div>
                        <div className="font-semibold">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.sku}</div>
                      </div>
                    </td>
                    <td className="text-right py-2">
                      {new Intl.NumberFormat('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      }).format(item.price)}
                    </td>
                    <td className="text-right py-2">{item.quantity}</td>
                    <td className="text-right py-2">
                      {item.suitcase_info ? (
                        <div className="text-xs text-red-500">
                          Já está na maleta {item.suitcase_info.suitcase_code}
                        </div>
                      ) : item.quantity <= 0 ? (
                        <div className="text-xs text-red-500">
                          Sem estoque
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleAddItem(item.id)}
                          disabled={adding[item.id]}
                        >
                          {adding[item.id] ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent"></div>
                          ) : (
                            <>
                              <Plus className="h-3 w-3 mr-1" /> Adicionar
                            </>
                          )}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            {loading ? "Buscando itens..." : "Nenhum resultado encontrado"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
