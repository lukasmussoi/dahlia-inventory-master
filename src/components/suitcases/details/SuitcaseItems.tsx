
/**
 * Componente de Itens da Maleta
 * @file Este componente exibe e gerencia os itens presentes em uma maleta
 * @relacionamento Utiliza ItemActionControls para gerenciar ações em itens agrupados
 */
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Package, Search, Plus } from "lucide-react";
import { SuitcaseItem, GroupedSuitcaseItem } from "@/types/suitcase";
import { formatPrice } from "@/utils/formatUtils";
import { getProductPhotoUrl } from "@/utils/photoUtils";
import { ItemActionControls } from "./ItemActionControls";
import { toast } from "sonner";

interface SuitcaseItemsProps {
  suitcaseItems: SuitcaseItem[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  handleSearch: (e?: React.KeyboardEvent) => Promise<void>;
  searchResults: any[];
  isSearching: boolean;
  isAdding: { [key: string]: boolean };
  handleAddItem: (inventoryId: string) => Promise<void>;
  handleReturnToInventory: (itemIds: string[], quantity: number, isDamaged: boolean) => Promise<void>;
  calculateTotalValue: () => number;
}

export function SuitcaseItems({
  suitcaseItems,
  searchTerm,
  setSearchTerm,
  handleSearch,
  searchResults,
  isSearching,
  isAdding,
  handleAddItem,
  handleReturnToInventory,
  calculateTotalValue
}: SuitcaseItemsProps) {
  // Agrupar itens idênticos (mesmo produto)
  const groupedItems = useMemo(() => {
    const groups: Record<string, GroupedSuitcaseItem> = {};
    
    // Filtrar apenas itens que estão em posse (não vendidos, não devolvidos)
    const activeItems = suitcaseItems.filter(item => item.status === 'in_possession');
    
    activeItems.forEach(item => {
      if (!item.product?.id) return;
      
      const productId = item.product.id;
      
      if (!groups[productId]) {
        groups[productId] = {
          product_id: productId,
          product_sku: item.product.sku || '',
          product_name: item.product.name || 'Produto sem nome',
          product_price: item.product.price || 0,
          photo_url: item.product.photo_url ? getProductPhotoUrl(item.product.photo_url) : undefined,
          total_quantity: 0,
          items: []
        };
      }
      
      groups[productId].total_quantity += item.quantity || 1;
      groups[productId].items.push(item);
    });
    
    return Object.values(groups);
  }, [suitcaseItems]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
          <Package className="h-4 w-4 text-pink-500" />
          Itens na Maleta
          <span className="text-sm font-normal text-muted-foreground ml-2">
            {suitcaseItems.filter(item => item.status === 'in_possession').length} itens
          </span>
        </h3>
        
        <div className="flex items-center space-x-2 mb-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Digite o código ou nome do item para adicionar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => handleSearch(e)}
              className="pl-8"
            />
          </div>
          <Button 
            onClick={() => handleSearch()} 
            disabled={isSearching || !searchTerm.trim()} 
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Use um leitor de código de barras ou digite o código/nome do produto para adicionar rapidamente.
        </p>
        
        <SearchResults 
          searchResults={searchResults} 
          isAdding={isAdding} 
          handleAddItem={handleAddItem} 
        />
        
        <GroupedItemsList
          groupedItems={groupedItems}
          handleReturnToInventory={handleReturnToInventory}
        />
        
        <SummarySection 
          suitcaseItems={suitcaseItems} 
          calculateTotalValue={calculateTotalValue} 
        />
      </div>
    </div>
  );
}

function SearchResults({ 
  searchResults, 
  isAdding, 
  handleAddItem 
}: { 
  searchResults: any[],
  isAdding: { [key: string]: boolean },
  handleAddItem: (inventoryId: string) => Promise<void>
}) {
  if (searchResults.length === 0) return null;
  
  return (
    <div className="bg-gray-50 p-2 rounded-md mb-4">
      <h4 className="text-sm font-medium mb-2">Resultados da busca:</h4>
      <div className="space-y-2">
        {searchResults.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-2 bg-white border rounded-md">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-muted-foreground">Código: {item.sku} • {formatPrice(item.price)}</p>
            </div>
            <Button
              size="sm"
              onClick={() => handleAddItem(item.id)}
              disabled={isAdding[item.id]}
            >
              {isAdding[item.id] ? (
                <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
              ) : (
                <Plus className="h-4 w-4 mr-1" />
              )}
              Adicionar
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function GroupedItemsList({ 
  groupedItems,
  handleReturnToInventory
}: { 
  groupedItems: GroupedSuitcaseItem[],
  handleReturnToInventory: (itemIds: string[], quantity: number, isDamaged: boolean) => Promise<void>
}) {
  if (groupedItems.length === 0) {
    return (
      <div className="text-center py-8 border rounded-md">
        <Package className="h-12 w-12 mx-auto text-gray-300" />
        <p className="mt-2 text-muted-foreground">Nenhum item na maleta ainda</p>
        <p className="text-sm text-muted-foreground">Adicione itens usando a busca acima</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {groupedItems.map((groupedItem) => (
        <div key={groupedItem.product_id} className="border rounded-md p-3">
          <div className="flex">
            <div className="w-16 h-16 bg-gray-100 rounded-md mr-3 flex-shrink-0">
              {groupedItem.photo_url ? (
                <img 
                  src={groupedItem.photo_url} 
                  alt={groupedItem.product_name} 
                  className="w-full h-full object-cover rounded-md" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Package className="h-8 w-8" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <div>
                  <h4 className="font-medium">{groupedItem.product_name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Código: {groupedItem.product_sku}
                  </p>
                  <p className="font-medium text-pink-600">
                    {formatPrice(groupedItem.product_price)}
                  </p>
                  <p className="text-sm font-medium mt-1">
                    Quantidade: {groupedItem.total_quantity}
                  </p>
                </div>
                <div className="flex items-start">
                  <ItemActionControls 
                    groupedItem={groupedItem}
                    onReturnToInventory={handleReturnToInventory}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SummarySection({ 
  suitcaseItems, 
  calculateTotalValue 
}: { 
  suitcaseItems: SuitcaseItem[],
  calculateTotalValue: () => number
}) {
  // Contar apenas itens em posse (não vendidos ou devolvidos)
  const activeItems = suitcaseItems.filter(item => item.status === 'in_possession');

  return (
    <div className="mt-6 bg-gray-50 p-4 rounded-md">
      <h3 className="text-lg font-medium mb-2">Resumo da Maleta</h3>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm">Total de peças: {activeItems.length} itens</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Valor total da maleta:</p>
          <p className="text-xl font-bold text-pink-600">
            {formatPrice(calculateTotalValue())}
          </p>
        </div>
      </div>
    </div>
  );
}
