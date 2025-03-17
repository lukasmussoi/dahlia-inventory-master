import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SuitcaseController } from "@/controllers/suitcaseController";
import { 
  Info, 
  Package, 
  ShoppingBag, 
  Edit, 
  Printer, 
  CheckCircle, 
  XCircle,
  Search,
  Loader2,
  ShoppingCart,
  AlertTriangle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { 
  SuitcaseItem, 
  SuitcaseItemStatus,
  SuitcaseItemWithSales 
} from "@/types/suitcase";

interface SuitcaseDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suitcaseId: string;
  onEdit?: () => void;
  onPrint?: () => void;
}

export function SuitcaseDetailsDialog({ 
  open, 
  onOpenChange, 
  suitcaseId,
  onEdit,
  onPrint
}: SuitcaseDetailsDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: suitcase, isLoading: isLoadingSuitcase, refetch: refetchSuitcase } = useQuery({
    queryKey: ['suitcase', suitcaseId],
    queryFn: () => suitcaseId ? SuitcaseController.getSuitcaseById(suitcaseId) : null,
    enabled: !!suitcaseId && open,
  });

  const { 
    data: suitcaseItems = [], 
    isLoading: isLoadingItems, 
    refetch: refetchItems
  } = useQuery({
    queryKey: ['suitcase-items', suitcaseId],
    queryFn: () => suitcaseId ? SuitcaseController.getSuitcaseItems(suitcaseId) : [],
    enabled: !!suitcaseId && open,
  });

  const itemsWithSales = suitcaseItems.map((item) => ({
    ...item,
    name: item.product?.name || '',
    sku: item.product?.sku || '',
    price: item.product?.price || 0,
    sales: item.sales || []
  })) as SuitcaseItemWithSales[];

  const calculateTotalValue = () => {
    return itemsWithSales.reduce((total, item) => {
      return total + (item.product?.price || 0);
    }, 0);
  };

  const handleMarkAsSold = async (itemId: string) => {
    try {
      await SuitcaseController.updateSuitcaseItemStatus(itemId, 'sold');
      toast.success("Item marcado como vendido");
      refetchItems();
    } catch (error) {
      console.error("Erro ao marcar item como vendido:", error);
      toast.error("Erro ao atualizar status do item");
    }
  };

  const handleMarkAsAvailable = async (itemId: string) => {
    try {
      await SuitcaseController.updateSuitcaseItemStatus(itemId, 'in_possession');
      toast.success("Item marcado como disponível");
      refetchItems();
    } catch (error) {
      console.error("Erro ao marcar item como disponível:", error);
      toast.error("Erro ao atualizar status do item");
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await SuitcaseController.removeItemFromSuitcase(itemId);
      toast.success("Item removido da maleta");
      refetchItems();
    } catch (error) {
      console.error("Erro ao remover item da maleta:", error);
      toast.error("Erro ao remover item");
    }
  };

  const handleSearchInventory = async (query: string) => {
    setSearchTerm(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    
    try {
      const results = await SuitcaseController.searchInventoryItems(query);
      console.log("Resultados da busca:", results);
      setSearchResults(results);
    } catch (error) {
      console.error("Erro ao buscar itens:", error);
      toast.error("Erro ao buscar itens do inventário");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddItem = async (inventoryId: string) => {
    try {
      await SuitcaseController.addItemToSuitcase(suitcaseId, inventoryId);
      toast.success("Item adicionado à maleta");
      refetchItems();
      setSearchTerm("");
      setSearchResults([]);
    } catch (error) {
      console.error("Erro ao adicionar item à maleta:", error);
      toast.error("Erro ao adicionar item");
    }
  };

  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  if (isLoadingSuitcase) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Maleta</DialogTitle>
            <DialogDescription>Carregando informações...</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
            <span className="ml-2">Carregando detalhes da maleta...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!suitcase) {
    return null;
  }

  const formattedDate = suitcase.next_settlement_date
    ? format(new Date(suitcase.next_settlement_date), 'dd/MM/yyyy', { locale: ptBR })
    : "Não definida";

  const code = suitcase.code || `ML${suitcase.id.substring(0, 3)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" /> Detalhes da Maleta {code}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="info">
              <Info className="h-4 w-4 mr-2" /> Informações
            </TabsTrigger>
            <TabsTrigger value="items">
              <Package className="h-4 w-4 mr-2" /> Itens
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Dados da Maleta</h3>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <p className="text-sm text-gray-500">Código</p>
                      <p>{code}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <Badge
                        className={cn(
                          suitcase.status === "in_use"
                            ? "bg-green-100 text-green-800"
                            : suitcase.status === "returned"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-orange-100 text-orange-800"
                        )}
                      >
                        {SuitcaseController.formatStatus(suitcase.status)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Cidade</p>
                      <p>{suitcase.city || "Não especificada"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Bairro</p>
                      <p>{suitcase.neighborhood || "Não especificado"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Próximo Acerto</p>
                      <p>{formattedDate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Criada em</p>
                      <p>{format(new Date(suitcase.created_at), 'dd/MM/yyyy', { locale: ptBR })}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold">Revendedora</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">Nome</p>
                    <p>{suitcase.seller?.name || "Revendedora não especificada"}</p>
                    
                    {suitcase.seller && 'phone' in suitcase.seller && suitcase.seller.phone && (
                      <>
                        <p className="text-sm text-gray-500 mt-2">Telefone</p>
                        <p>{suitcase.seller.phone}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold">Resumo Financeiro</h3>
                <div className="border rounded-lg p-4 mt-2 space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Total de itens:</span>
                    <span className="font-medium">{itemsWithSales.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Valor total da maleta:</span>
                    <span className="font-medium">
                      R$ {calculateTotalValue().toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Itens vendidos:</span>
                    <span className="font-medium">
                      {itemsWithSales.filter(i => i.status === 'sold').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Valor vendido:</span>
                    <span className="font-medium text-green-600">
                      R$ {itemsWithSales
                        .filter(i => i.status === 'sold')
                        .reduce((total, item) => total + (item.price || 0), 0)
                        .toFixed(2)
                        .replace('.', ',')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Itens disponíveis:</span>
                    <span className="font-medium">
                      {itemsWithSales.filter(i => i.status !== 'sold').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="items">
            <div className="mb-4">
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <Input
                    ref={searchInputRef}
                    placeholder="Digite o código, nome ou categoria do item para adicionar..."
                    value={searchTerm}
                    onChange={(e) => handleSearchInventory(e.target.value)}
                    className="pr-10"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
              
              {searchTerm.length > 1 && (
                <div className="relative w-full mt-1">
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    {isSearching ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-gold mr-2" />
                        <span>Buscando itens...</span>
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        Nenhum item encontrado. Verifique o código ou nome.
                      </div>
                    ) : (
                      <ul className="divide-y">
                        {searchResults.map((item) => (
                          <li 
                            key={item.id} 
                            className="p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                            onClick={() => handleAddItem(item.id)}
                          >
                            <div className="flex-1">
                              <div className="flex items-center">
                                <div className="h-10 w-10 mr-3 bg-gray-100 rounded flex-shrink-0">
                                  {item.photo_url && (
                                    <img 
                                      src={item.photo_url} 
                                      alt={item.name} 
                                      className="h-full w-full object-cover rounded"
                                    />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium">{item.name}</p>
                                  <div className="flex items-center text-sm text-gray-500">
                                    <span>SKU: {item.sku}</span>
                                    <span className="mx-2">•</span>
                                    <span>R$ {item.price.toFixed(2).replace('.', ',')}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <Button size="sm" variant="ghost" className="ml-2">
                              <ShoppingCart className="h-4 w-4 mr-1" /> Adicionar
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-2 text-sm text-gray-500 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                <span>
                  Esta maleta possui <strong>{itemsWithSales.length}</strong> itens. 
                  Digite no campo acima para adicionar novos itens.
                </span>
              </div>
            </div>

            {isLoadingItems ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gold" />
                <span className="ml-2">Carregando itens...</span>
              </div>
            ) : itemsWithSales.length === 0 ? (
              <div className="text-center py-8 border rounded-lg">
                <Package className="h-12 w-12 mx-auto text-gray-300" />
                <h3 className="mt-4 text-lg font-medium">Maleta Vazia</h3>
                <p className="mt-2 text-gray-500">
                  Esta maleta não possui nenhum item adicionado.
                </p>
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Produto
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Preço
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {itemsWithSales.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 mr-3 bg-gray-100 rounded flex-shrink-0">
                              {item.product?.photo_url && (
                                <img 
                                  src={item.product.photo_url} 
                                  alt={item.name} 
                                  className="h-full w-full object-cover rounded"
                                />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          R$ {item.price.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <Badge
                            className={cn(
                              item.status === "in_possession"
                                ? "bg-blue-100 text-blue-800"
                                : item.status === "sold"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            )}
                          >
                            {SuitcaseController.formatStatus(item.status)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            {item.status === 'in_possession' ? (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 gap-1"
                                onClick={() => handleMarkAsSold(item.id)}
                              >
                                <CheckCircle className="h-4 w-4" /> Marcar como vendido
                              </Button>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 gap-1"
                                onClick={() => handleMarkAsAvailable(item.id)}
                              >
                                <XCircle className="h-4 w-4" /> Marcar como disponível
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              Remover
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <div className="space-x-2">
            {onPrint && (
              <Button onClick={onPrint} className="gap-1">
                <Printer className="h-4 w-4" /> Imprimir
              </Button>
            )}
            {onEdit && (
              <Button onClick={onEdit} className="gap-1">
                <Edit className="h-4 w-4" /> Editar
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
