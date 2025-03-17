import { useState, useEffect } from "react";
import { format } from "date-fns";
import { SuitcaseController } from "@/controllers/suitcaseController";
import { Briefcase, Edit, Printer, Loader2, X, Calendar, MapPin, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { InventoryModel, type InventoryItem } from "@/models/inventoryModel";
import { SuitcaseItem } from "@/models/suitcaseModel";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface SaleInfo {
  customer_name?: string;
  payment_method?: string;
}

interface SuitcaseItemWithSales extends SuitcaseItem {
  name?: string;
  sku?: string;
  price?: number;
  photo_url?: string;
  sales?: SaleInfo[];
}

interface SuitcaseDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suitcaseId: string;
  onEdit: () => void;
  onPrint: () => void;
}

export function SuitcaseDetailsDialog({
  open,
  onOpenChange,
  suitcaseId,
  onEdit,
  onPrint,
}: SuitcaseDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState("peças");
  const [suitcase, setSuitcase] = useState<any>(null);
  const [suitcaseItems, setSuitcaseItems] = useState<SuitcaseItemWithSales[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerNames, setCustomerNames] = useState<Record<string, string>>({});
  const [paymentMethods, setPaymentMethods] = useState<Record<string, string>>({});
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);

  useEffect(() => {
    async function fetchSuitcaseDetails() {
      if (open && suitcaseId) {
        setLoading(true);
        try {
          const suitcaseData = await SuitcaseController.getSuitcaseById(suitcaseId);
          const itemsData = await SuitcaseController.getSuitcaseItems(suitcaseId);
          
          setSuitcase(suitcaseData);
          const itemsWithSales = itemsData as unknown as SuitcaseItemWithSales[];
          setSuitcaseItems(itemsWithSales);
          
          const initialCustomerNames: Record<string, string> = {};
          const initialPaymentMethods: Record<string, string> = {};
          
          itemsWithSales.forEach(item => {
            if (item.sales && item.sales.length > 0) {
              initialCustomerNames[item.id] = item.sales[0].customer_name || '';
              initialPaymentMethods[item.id] = item.sales[0].payment_method || '';
            } else {
              initialCustomerNames[item.id] = '';
              initialPaymentMethods[item.id] = '';
            }
          });
          
          setCustomerNames(initialCustomerNames);
          setPaymentMethods(initialPaymentMethods);
        } catch (error) {
          console.error("Erro ao buscar detalhes da maleta:", error);
          toast.error("Erro ao carregar detalhes da maleta");
        } finally {
          setLoading(false);
        }
      }
    }

    fetchSuitcaseDetails();
  }, [open, suitcaseId]);

  const handleItemStatusChange = async (item: any, checked: boolean) => {
    try {
      const newStatus = checked ? 'sold' : 'in_possession';
      const saleInfo = checked
        ? { customer_name: customerNames[item.id], payment_method: paymentMethods[item.id] }
        : undefined;
      
      await SuitcaseController.updateSuitcaseItemStatus(item.id, newStatus, saleInfo);
      
      const updatedItems = await SuitcaseController.getSuitcaseItems(suitcaseId);
      const updatedItemsWithSales = updatedItems as unknown as SuitcaseItemWithSales[];
      setSuitcaseItems(updatedItemsWithSales);
      toast.success(`Peça ${checked ? 'marcada como vendida' : 'desmarcada como vendida'}`);
    } catch (error) {
      console.error("Erro ao atualizar status da peça:", error);
      toast.error("Erro ao atualizar status da peça");
    }
  };

  const handleCustomerNameChange = (itemId: string, name: string) => {
    setCustomerNames(prev => ({ ...prev, [itemId]: name }));
  };

  const handlePaymentMethodChange = (itemId: string, method: string) => {
    setPaymentMethods(prev => ({ ...prev, [itemId]: method }));
  };

  const handleSaveSale = async (item: any) => {
    try {
      await SuitcaseController.updateSuitcaseItemStatus(
        item.id,
        'sold',
        {
          customer_name: customerNames[item.id],
          payment_method: paymentMethods[item.id]
        }
      );
      
      const updatedItems = await SuitcaseController.getSuitcaseItems(suitcaseId);
      const updatedItemsWithSales = updatedItems as unknown as SuitcaseItemWithSales[];
      setSuitcaseItems(updatedItemsWithSales);
      toast.success("Informações da venda salvas com sucesso");
    } catch (error) {
      console.error("Erro ao salvar venda:", error);
      toast.error("Erro ao salvar informações da venda");
    }
  };

  const searchInventoryItems = async (term: string) => {
    if (!term || term.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoadingInventory(true);
    try {
      const filter = {
        search: term
      };
      
      const items = await InventoryModel.searchInventoryItems(filter);
      
      const existingItemIds = suitcaseItems.map(item => item.inventory_id);
      const filteredItems = items.filter(item => !existingItemIds.includes(item.id));
      
      setSearchResults(filteredItems);
    } catch (error) {
      console.error("Erro ao buscar itens do inventário:", error);
    } finally {
      setLoadingInventory(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setShowSearchResults(true);
    searchInventoryItems(value);
  };

  const handleAddItemToSuitcase = async (inventoryId: string) => {
    if (!inventoryId) {
      toast.error("Nenhum item selecionado");
      return;
    }

    setIsAddingItem(true);
    try {
      await SuitcaseController.addItemToSuitcase({
        suitcase_id: suitcaseId,
        inventory_id: inventoryId
      });

      const updatedItems = await SuitcaseController.getSuitcaseItems(suitcaseId);
      const updatedItemsWithSales = updatedItems as unknown as SuitcaseItemWithSales[];
      setSuitcaseItems(updatedItemsWithSales);

      setSearchTerm("");
      setSearchResults([]);
      setShowSearchResults(false);
      toast.success("Item adicionado à maleta com sucesso");
    } catch (error) {
      console.error("Erro ao adicionar item à maleta:", error);
      toast.error("Erro ao adicionar item à maleta");
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleSearchKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      e.preventDefault();
      handleAddItemToSuitcase(searchResults[0].id);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
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

  const code = suitcase.code || `ML${suitcase.id.substring(0, 3)}`;
  
  const resellerName = suitcase.seller && suitcase.seller.name 
    ? suitcase.seller.name 
    : "Revendedora não especificada";
  
  const createdAt = suitcase.created_at 
    ? format(new Date(suitcase.created_at), 'dd/MM/yyyy')
    : "Data não disponível";
  
  const updatedAt = suitcase.updated_at 
    ? format(new Date(suitcase.updated_at), 'dd/MM/yyyy HH:mm')
    : "Data não disponível";
  
  const nextSettlementDate = suitcase.next_settlement_date
    ? format(new Date(suitcase.next_settlement_date), 'dd/MM/yyyy')
    : "Não especificada";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogClose className="absolute right-4 top-4">
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar</span>
          </DialogClose>
          
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" /> Detalhes da Maleta {code}
            </DialogTitle>
            <DialogDescription>
              Informações detalhadas sobre a maleta da revendedora {resellerName}.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={onPrint} className="flex items-center">
              <Printer className="h-4 w-4 mr-2" /> Imprimir
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="informações">Informações</TabsTrigger>
              <TabsTrigger value="peças">Peças</TabsTrigger>
              <TabsTrigger value="histórico">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="informações" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Código</h3>
                  <p className="text-lg font-medium">{code}</p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Revendedora</h3>
                  <p className="text-lg font-medium">{resellerName}</p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <Badge 
                    className={`
                      ${suitcase.status === 'in_use' ? 'bg-green-100 text-green-800' : 
                        suitcase.status === 'returned' ? 'bg-blue-100 text-blue-800' : 
                        suitcase.status === 'in_replenishment' ? 'bg-orange-100 text-orange-800' : 
                        'bg-gray-100 text-gray-800'}
                    `}
                  >
                    {SuitcaseController.formatStatus(suitcase.status)}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Quantidade de Peças</h3>
                  <p className="text-lg font-medium">{suitcaseItems.length}</p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Data de Criação</h3>
                  <p className="text-lg font-medium flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-muted-foreground" /> {createdAt}
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Próximo Acerto</h3>
                  <p className="text-lg font-medium flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-muted-foreground" /> {nextSettlementDate}
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Última Atualização</h3>
                  <p className="text-lg font-medium">{updatedAt}</p>
                </div>

                <div className="space-y-2 col-span-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Localização</h3>
                  <p className="text-lg font-medium flex items-center">
                    <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                    {suitcase.city && suitcase.neighborhood
                      ? `${suitcase.city} - ${suitcase.neighborhood}`
                      : "Localização não especificada"}
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="peças" className="space-y-4">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Itens na Maleta</h2>
                  <Badge variant="outline" className="text-sm">{suitcaseItems.length} itens</Badge>
                </div>

                <div className="relative">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        placeholder="Digite o código, nome ou categoria do item para adicionar..."
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        disabled={isAddingItem}
                        className="pl-8"
                      />
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    {searchTerm && (
                      <Button 
                        onClick={() => handleAddItemToSuitcase(searchResults[0]?.id)} 
                        disabled={isAddingItem || searchResults.length === 0}
                      >
                        {isAddingItem ? <Loader2 className="h-4 w-4 animate-spin" /> : "Adicionar"}
                      </Button>
                    )}
                  </div>
                  
                  {showSearchResults && searchTerm && (
                    <div className="absolute z-50 w-full mt-1 bg-white rounded-md border shadow-md">
                      {loadingInventory ? (
                        <div className="p-2 text-center">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                          <p className="text-sm text-muted-foreground mt-1">Buscando itens...</p>
                        </div>
                      ) : searchResults.length === 0 ? (
                        <div className="p-2 text-center">
                          <p className="text-sm text-muted-foreground">Nenhum item encontrado</p>
                        </div>
                      ) : (
                        <div className="max-h-60 overflow-auto">
                          {searchResults.map((item) => (
                            <div 
                              key={item.id} 
                              className="p-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => handleAddItemToSuitcase(item.id)}
                            >
                              <div className="flex items-center gap-2">
                                {item.photos && item.photos[0] && item.photos[0].photo_url && (
                                  <div className="h-10 w-10 rounded bg-gray-100">
                                    <img 
                                      src={item.photos[0].photo_url} 
                                      alt={item.name} 
                                      className="h-full w-full object-cover rounded"
                                    />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium">{item.name}</p>
                                  <p className="text-xs text-muted-foreground">Código: {item.sku} | R$ {item.price?.toFixed(2).replace('.', ',')}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Use um leitor de código de barras ou digite o código/nome do produto para adicionar rapidamente.
                </p>
              </div>

              {suitcaseItems.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                  <h3 className="mt-2 text-lg font-medium">Nenhuma peça na maleta</h3>
                  <p className="text-muted-foreground">
                    Utilize o campo de busca acima para adicionar peças à maleta.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {suitcaseItems.map((item) => (
                    <div key={item.id} className="border rounded-md p-4 mb-2">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex items-start gap-3">
                          <div className="h-16 w-16 bg-gray-100 rounded">
                            {item.product?.photos && item.product.photos[0] && item.product.photos[0].photo_url && (
                              <img 
                                src={item.product.photos[0].photo_url} 
                                alt={item.product?.name} 
                                className="h-full w-full object-cover rounded"
                              />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-lg">{item.product?.name || "Produto não especificado"}</h4>
                            <p className="text-sm text-muted-foreground">
                              Código: {item.product?.sku || "N/A"}
                            </p>
                            <p className="font-medium text-lg">
                              R$ {item.product?.price?.toFixed(2).replace('.', ',') || "0,00"}
                            </p>
                          </div>
                        </div>

                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                          <div className="flex items-center">
                            <Checkbox
                              id={`item-${item.id}-sold`}
                              checked={item.status === 'sold'}
                              onCheckedChange={(checked) => 
                                handleItemStatusChange(item, checked as boolean)
                              }
                            />
                            <label 
                              htmlFor={`item-${item.id}-sold`}
                              className="ml-2 text-sm font-medium"
                            >
                              Vendido
                            </label>
                          </div>

                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Cliente</p>
                            <Input
                              placeholder="Nome do cliente"
                              value={customerNames[item.id] || ''}
                              onChange={(e) => handleCustomerNameChange(item.id, e.target.value)}
                              disabled={item.status !== 'sold'}
                              className="h-9"
                            />
                          </div>

                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Forma de Pagamento</p>
                            <Select
                              value={paymentMethods[item.id] || ''}
                              onValueChange={(value) => handlePaymentMethodChange(item.id, value)}
                              disabled={item.status !== 'sold'}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                                <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                                <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                                <SelectItem value="pix">PIX</SelectItem>
                                <SelectItem value="boleto">Boleto</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {item.status === 'sold' && (
                            <div className="col-span-3 flex justify-end">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleSaveSale(item)}
                              >
                                Salvar Informações
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="histórico" className="space-y-4">
              <div className="space-y-4 py-2">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Briefcase className="h-4 w-4 text-blue-700" />
                    </div>
                    <div className="w-0.5 h-full bg-muted mt-2"></div>
                  </div>
                  
                  <div className="space-y-1 pb-6">
                    <p className="text-sm font-medium">Maleta criada</p>
                    <p className="text-xs text-muted-foreground">
                      {suitcase.created_at 
                        ? format(new Date(suitcase.created_at), 'dd/MM/yyyy HH:mm')
                        : "Data não disponível"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <Badge className="h-4 w-4 text-green-700" />
                    </div>
                    <div className="w-0.5 h-full bg-muted mt-2"></div>
                  </div>
                  
                  <div className="space-y-1 pb-6">
                    <p className="text-sm font-medium">Status alterado para "{SuitcaseController.formatStatus(suitcase.status)}"</p>
                    <p className="text-xs text-muted-foreground">
                      {suitcase.updated_at 
                        ? format(new Date(suitcase.updated_at), 'dd/MM/yyyy HH:mm')
                        : "Data não disponível"}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Separator />

          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button 
              onClick={() => onEdit()}
              className="bg-[#FF0080] hover:bg-[#D50067] text-white"
            >
              <Edit className="h-4 w-4 mr-2" /> Editar Maleta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
