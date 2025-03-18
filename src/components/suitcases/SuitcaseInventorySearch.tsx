
import { useState } from "react";
import { SuitcaseController } from "@/controllers/suitcaseController";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, PlusCircle, AlertCircle } from "lucide-react";

interface SuitcaseInventorySearchProps {
  suitcaseId: string;
  onItemAdded?: () => void;
}

export function SuitcaseInventorySearch({ suitcaseId, onItemAdded }: SuitcaseInventorySearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<{ [key: string]: number }>({});

  // Realizar busca
  const handleSearch = async () => {
    if (searchTerm.trim() === "") {
      setError("Digite um termo para buscar");
      return;
    }

    try {
      setIsSearching(true);
      setError(null);
      const results = await SuitcaseController.searchInventoryItems(searchTerm);
      setSearchResults(results);
      
      // Inicializar as quantidades para cada item
      const initialQuantities: { [key: string]: number } = {};
      results.forEach(item => {
        initialQuantities[item.id] = 1;
      });
      setQuantity(initialQuantities);
      
      if (results.length === 0) {
        setError("Nenhum item encontrado");
      }
    } catch (error: any) {
      console.error("Erro ao buscar itens:", error);
      setError(error.message || "Erro ao buscar itens");
    } finally {
      setIsSearching(false);
    }
  };

  // Adicionar item à maleta
  const handleAddItem = async (inventoryId: string) => {
    try {
      setIsAdding(prev => ({ ...prev, [inventoryId]: true }));
      
      const itemQuantity = quantity[inventoryId] || 1;
      
      await SuitcaseController.addItemToSuitcase(suitcaseId, inventoryId, itemQuantity);
      
      // Atualizar lista de resultados para remover o item adicionado
      setSearchResults(prevResults => prevResults.filter(item => item.id !== inventoryId));
      
      // Notificar o componente pai
      if (onItemAdded) onItemAdded();
      
      toast.success("Item adicionado à maleta com sucesso");
    } catch (error: any) {
      console.error("Erro ao adicionar item à maleta:", error);
      toast.error(error.message || "Erro ao adicionar item à maleta");
    } finally {
      setIsAdding(prev => ({ ...prev, [inventoryId]: false }));
    }
  };

  // Alterar quantidade do item a ser adicionado
  const handleQuantityChange = (inventoryId: string, newValue: number) => {
    if (newValue < 1) newValue = 1;
    
    // Garantir que a quantidade não exceda o estoque disponível
    const item = searchResults.find(item => item.id === inventoryId);
    if (item && newValue > item.quantity) {
      newValue = item.quantity;
      toast.info(`Quantidade limitada ao estoque disponível (${item.quantity})`);
    }
    
    setQuantity(prev => ({
      ...prev,
      [inventoryId]: newValue
    }));
  };

  // Formatar preço
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(price);
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Input
          placeholder="Buscar por nome, SKU ou código de barras"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1"
        />
        <Button onClick={handleSearch} disabled={isSearching}>
          {isSearching ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" /> Buscar
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="overflow-hidden border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">SKU</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-right w-[80px]">Estoque</TableHead>
                <TableHead className="w-[80px]">Qtd</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searchResults.map((item) => {
                const isItemAdding = isAdding[item.id] || false;
                const hasStock = item.quantity > 0;
                const itemQuantity = quantity[item.id] || 1;
                
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">{item.sku || "N/A"}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatPrice(item.price)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={hasStock ? "outline" : "destructive"} className="ml-auto">
                        {item.quantity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={1}
                        max={item.quantity}
                        value={itemQuantity}
                        onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                        disabled={!hasStock || isItemAdding}
                        className="w-16 h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddItem(item.id)}
                        disabled={isItemAdding || !hasStock}
                        className={`w-full h-8 ${
                          !hasStock ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {isItemAdding ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-500"></div>
                        ) : (
                          <>
                            <PlusCircle className="mr-1 h-4 w-4" /> Adicionar
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
