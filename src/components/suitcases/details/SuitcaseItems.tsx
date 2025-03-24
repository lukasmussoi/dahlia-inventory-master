
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Package, Search, Plus } from "lucide-react";
import { SuitcaseItem } from "@/types/suitcase";
import { formatPrice } from "@/utils/formatUtils";
import { getProductPhotoUrl } from "@/utils/photoUtils";

interface SuitcaseItemsProps {
  suitcaseItems: SuitcaseItem[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  handleSearch: (e?: React.KeyboardEvent) => Promise<void>;
  searchResults: any[];
  isSearching: boolean;
  isAdding: { [key: string]: boolean };
  handleAddItem: (inventoryId: string) => Promise<void>;
  handleToggleSold: (item: SuitcaseItem, sold: boolean) => Promise<void>;
  handleUpdateSaleInfo: (itemId: string, field: string, value: string) => Promise<void>;
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
  handleToggleSold,
  handleUpdateSaleInfo,
  calculateTotalValue
}: SuitcaseItemsProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
          <Package className="h-4 w-4 text-pink-500" />
          Itens na Maleta
          <span className="text-sm font-normal text-muted-foreground ml-2">
            {suitcaseItems.length} itens
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
        
        <ItemsList 
          suitcaseItems={suitcaseItems} 
          handleToggleSold={handleToggleSold}
          handleUpdateSaleInfo={handleUpdateSaleInfo}
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

function ItemsList({ 
  suitcaseItems,
  handleToggleSold,
  handleUpdateSaleInfo
}: { 
  suitcaseItems: SuitcaseItem[],
  handleToggleSold: (item: SuitcaseItem, sold: boolean) => Promise<void>,
  handleUpdateSaleInfo: (itemId: string, field: string, value: string) => Promise<void>
}) {
  if (suitcaseItems.length === 0) {
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
      {suitcaseItems.map((item) => {
        const isSold = item.status === 'sold';
        const price = item.product?.price || 0;
        const image = item.product?.photo_url;
        
        return (
          <div key={item.id} className="border rounded-md p-3">
            <div className="flex">
              <div className="w-16 h-16 bg-gray-100 rounded-md mr-3 flex-shrink-0">
                {image ? (
                  <img src={getProductPhotoUrl(image)} alt={item.product?.name} className="w-full h-full object-cover rounded-md" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Package className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <div>
                    <h4 className="font-medium">{item.product?.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Código: {item.product?.sku}
                    </p>
                    <p className="font-medium text-pink-600">
                      {formatPrice(price)}
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex items-center">
                      <Checkbox 
                        id={`sold-${item.id}`}
                        checked={isSold}
                        onCheckedChange={(checked) => 
                          handleToggleSold(item, checked as boolean)
                        }
                      />
                      <label 
                        htmlFor={`sold-${item.id}`}
                        className="ml-2 text-sm font-medium"
                      >
                        Vendido
                      </label>
                    </div>
                  </div>
                </div>
                
                {isSold && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500">Cliente</label>
                      <Input 
                        placeholder="Nome do cliente"
                        className="h-8 text-sm"
                        value={item.sales?.[0]?.customer_name || ''}
                        onChange={(e) => handleUpdateSaleInfo(item.id, 'customer_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Forma de Pagamento</label>
                      <Select 
                        value={item.sales?.[0]?.payment_method || ''}
                        onValueChange={(value) => handleUpdateSaleInfo(item.id, 'payment_method', value)}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Dinheiro</SelectItem>
                          <SelectItem value="credit">Cartão de Crédito</SelectItem>
                          <SelectItem value="debit">Cartão de Débito</SelectItem>
                          <SelectItem value="pix">PIX</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
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
  return (
    <div className="mt-6 bg-gray-50 p-4 rounded-md">
      <h3 className="text-lg font-medium mb-2">Resumo da Maleta</h3>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm">Total de peças: {suitcaseItems.length} itens</p>
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
