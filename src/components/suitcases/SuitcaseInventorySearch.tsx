
import { useState, useEffect } from "react";
import { SuitcaseController } from "@/controllers/suitcaseController";
import { SuitcaseStockingController } from "@/controllers/suitcaseStockingController";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, PlusCircle, AlertCircle, Sparkles, TrendingUp, BarChart3 } from "lucide-react";

interface SuitcaseInventorySearchProps {
  suitcaseId: string;
  sellerId?: string;
  onItemAdded?: () => void;
}

export function SuitcaseInventorySearch({ suitcaseId, sellerId, onItemAdded }: SuitcaseInventorySearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<{ [key: string]: number }>({});
  const [suggestions, setSuggestions] = useState<{ items: any[], categories: any[] }>({ items: [], categories: [] });
  const [activeTab, setActiveTab] = useState("buscar");
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Carregar sugestões baseadas no histórico de vendas
  useEffect(() => {
    if (sellerId) {
      fetchSuggestions();
    }
  }, [sellerId]);

  const fetchSuggestions = async () => {
    if (!sellerId) return;
    
    try {
      setIsLoadingSuggestions(true);
      const suggestionData = await SuitcaseStockingController.getStockingSuggestions(sellerId);
      setSuggestions(suggestionData);
      
      // Inicializar quantidades para itens sugeridos
      const initialQuantities: { [key: string]: number } = {};
      suggestionData.items.forEach((item: any) => {
        initialQuantities[item.id] = 1;
      });
      setQuantity(prev => ({ ...prev, ...initialQuantities }));
      
      // Se houver sugestões, mas o tab ativo for a busca e não há resultados,
      // alternar automaticamente para o tab de sugestões
      if (suggestionData.items.length > 0 && activeTab === "buscar" && searchResults.length === 0) {
        setActiveTab("sugestoes");
      }
    } catch (error) {
      console.error("Erro ao carregar sugestões:", error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

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
      results.forEach((item: any) => {
        initialQuantities[item.id] = 1;
      });
      setQuantity(prev => ({ ...prev, ...initialQuantities }));
      
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
  const handleAddItem = async (inventoryId: string, fromSuggestions = false) => {
    try {
      setIsAdding(prev => ({ ...prev, [inventoryId]: true }));
      
      const itemQuantity = quantity[inventoryId] || 1;
      
      await SuitcaseController.addItemToSuitcase(suitcaseId, inventoryId, itemQuantity);
      
      // Atualizar listas
      if (fromSuggestions) {
        // Remover ou atualizar da lista de sugestões
        setSuggestions(prev => ({
          ...prev,
          items: prev.items.filter(item => item.id !== inventoryId)
        }));
      } else {
        // Remover dos resultados da busca
        setSearchResults(prevResults => prevResults.filter(item => item.id !== inventoryId));
      }
      
      // Verificar histórico de vendas desse item para o vendedor
      if (sellerId) {
        SuitcaseStockingController.checkItemPreviousSales(inventoryId, sellerId);
      }
      
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
  const handleQuantityChange = (inventoryId: string, newValue: number, fromSuggestions = false) => {
    if (newValue < 1) newValue = 1;
    
    // Garantir que a quantidade não exceda o estoque disponível
    const item = fromSuggestions
      ? suggestions.items.find(item => item.id === inventoryId)
      : searchResults.find(item => item.id !== inventoryId);
      
    const maxQuantity = fromSuggestions 
      ? (item?.stockAvailable || 0)
      : (item?.quantity || 0);
    
    if (item && newValue > maxQuantity) {
      newValue = maxQuantity;
      toast.info(`Quantidade limitada ao estoque disponível (${maxQuantity})`);
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

  // Renderizar um item (comum para ambas as abas)
  const renderItem = (item: any, fromSuggestions = false) => {
    const isItemAdding = isAdding[item.id] || false;
    const hasStock = fromSuggestions ? item.stockAvailable > 0 : item.quantity > 0;
    const itemQuantity = quantity[item.id] || 1;
    const maxQuantity = fromSuggestions ? item.stockAvailable : item.quantity;
    
    const countBadge = fromSuggestions && item.count > 0 ? (
      <Badge variant={item.count > 5 ? "destructive" : item.count > 2 ? "default" : "outline"} className="ml-2">
        {item.count}x vendido
      </Badge>
    ) : null;
    
    return (
      <TableRow key={item.id}>
        <TableCell className="font-mono text-xs">{item.sku || "N/A"}</TableCell>
        <TableCell>
          {item.name}
          {countBadge}
        </TableCell>
        <TableCell className="text-right font-medium">
          {formatPrice(item.price)}
        </TableCell>
        <TableCell className="text-right">
          <Badge variant={hasStock ? "outline" : "destructive"} className="ml-auto">
            {maxQuantity}
          </Badge>
        </TableCell>
        <TableCell>
          <Input
            type="number"
            min={1}
            max={maxQuantity}
            value={itemQuantity}
            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1, fromSuggestions)}
            disabled={!hasStock || isItemAdding}
            className="w-16 h-8"
          />
        </TableCell>
        <TableCell>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddItem(item.id, fromSuggestions)}
            disabled={isItemAdding || !hasStock}
            className={`w-full h-8 ${
              !hasStock ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isItemAdding ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-500"></div>
            ) : (
              <>
                <PlusCircle className="mr-1 h-4 w-4" /> 
                {fromSuggestions ? "Adicionar" : "Adicionar"}
              </>
            )}
          </Button>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="buscar" className="flex items-center gap-1">
            <Search className="h-4 w-4" /> Buscar Itens
          </TabsTrigger>
          <TabsTrigger value="sugestoes" className="flex items-center gap-1" disabled={!sellerId}>
            <Sparkles className="h-4 w-4" /> 
            Sugestões 
            {suggestions.items.length > 0 && (
              <Badge variant="secondary" className="ml-1">{suggestions.items.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="buscar" className="mt-0">
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
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center mt-4">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="overflow-hidden border rounded-md mt-4">
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
                  {searchResults.map((item) => renderItem(item, false))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="sugestoes" className="mt-0">
          {!sellerId ? (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Selecione uma revendedora para ver sugestões personalizadas
            </div>
          ) : isLoadingSuggestions ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
              <span className="ml-3">Carregando sugestões...</span>
            </div>
          ) : suggestions.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-md">
              <TrendingUp className="h-10 w-10 text-muted-foreground mb-2" />
              <h3 className="text-lg font-medium">Sem histórico de vendas</h3>
              <p className="text-sm text-muted-foreground text-center mt-1">
                Não encontramos vendas anteriores desta revendedora nos últimos 90 dias.
                <br />Use a aba de busca para adicionar itens à maleta.
              </p>
            </div>
          ) : (
            <>
              {suggestions.categories.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2 flex items-center">
                    <BarChart3 className="h-4 w-4 mr-1" /> 
                    Categorias mais vendidas:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.categories.slice(0, 5).map((category, index) => (
                      <Badge 
                        key={index} 
                        variant={index < 2 ? "default" : "outline"}
                      >
                        {category.name}: {category.count}x
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
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
                    {suggestions.items.map((item) => renderItem(item, true))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
