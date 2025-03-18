import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Suitcase, SuitcaseItem, SuitcaseItemStatus } from "@/types/suitcase";
import { SuitcaseModel } from "@/models/suitcaseModel";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Edit, Printer, Check, Plus, Search, PlusSquare, List, DollarSign } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useReactPrint } from "@/hooks/useReactPrint";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InventoryController } from "@/controllers/inventoryController";

interface SuitcaseDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suitcase: Suitcase | null;
  onEdit: (suitcase: Suitcase) => void;
}

export function SuitcaseDetailsDialog({
  open,
  onOpenChange,
  suitcase,
  onEdit,
}: SuitcaseDetailsDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("items");
  const [searchTerm, setSearchTerm] = useState("");
  const [isItemSubmitting, setIsItemSubmitting] = useState(false);
  const [sellStatus, setSellStatus] = useState<Record<string, SuitcaseItemStatus>>({});
  const [clientNames, setClientNames] = useState<Record<string, string>>({});
  const [paymentMethods, setPaymentMethods] = useState<Record<string, string>>({});
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handlePrint = useReactPrint({
    contentRef: printRef,
    documentTitle: `Maleta ${suitcase?.code || ''}`
  });

  const {
    data: suitcaseItems = [],
    isLoading: isLoadingItems,
    refetch: refetchItems,
  } = useQuery({
    queryKey: ["suitcase-items", suitcase?.id],
    queryFn: async () => {
      if (!suitcase) return [];
      return SuitcaseModel.getSuitcaseItems(suitcase.id);
    },
    enabled: !!suitcase?.id && open,
  });

  useEffect(() => {
    const initialStatuses: Record<string, SuitcaseItemStatus> = {};
    const initialClientNames: Record<string, string> = {};
    const initialPaymentMethods: Record<string, string> = {};

    suitcaseItems.forEach((item) => {
      initialStatuses[item.id] = item.status;
      initialClientNames[item.id] = "";
      initialPaymentMethods[item.id] = "";
    });

    setSellStatus(initialStatuses);
    setClientNames(initialClientNames);
    setPaymentMethods(initialPaymentMethods);
  }, [suitcaseItems]);

  const handleSearch = async () => {
    if (!searchTerm || searchTerm.length < 3) {
      toast.info("Digite pelo menos 3 caracteres para buscar");
      return;
    }

    try {
      const results = await InventoryController.searchInventoryItems(searchTerm);
      setSearchResults(results);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      toast.error("Erro ao buscar produtos");
    }
  };

  const handleAddItem = async (inventoryId: string) => {
    if (!suitcase) return;

    setIsItemSubmitting(true);
    try {
      await SuitcaseModel.addItemToSuitcase({
        suitcase_id: suitcase.id,
        inventory_id: inventoryId
      });
      
      toast.success("Item adicionado à maleta com sucesso");
      refetchItems();
      setSearchTerm("");
      setSearchResults([]);
    } catch (error) {
      console.error("Erro ao adicionar item:", error);
      toast.error("Erro ao adicionar item à maleta");
    } finally {
      setIsItemSubmitting(false);
    }
  };

  const handleUpdateItemStatus = async (itemId: string, status: string, index: number) => {
    try {
      let saleInfo = {};
      if (status === 'sold') {
        saleInfo = {
          customer_name: clientNames[itemId],
          payment_method: paymentMethods[itemId]
        };
      }

      await SuitcaseModel.updateSuitcaseItemStatus(
        itemId, 
        status as SuitcaseItemStatus,
        saleInfo as any
      );
      
      toast.success("Status atualizado com sucesso");
      refetchItems();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status do item");
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (window.confirm("Tem certeza que deseja remover este item da maleta?")) {
      try {
        await SuitcaseModel.removeSuitcaseItem(itemId);
        toast.success("Item removido com sucesso");
        refetchItems();
      } catch (error) {
        console.error("Erro ao remover item:", error);
        toast.error("Erro ao remover item da maleta");
      }
    }
  };

  const getStatusLabel = (status: SuitcaseItemStatus) => {
    switch (status) {
      case 'in_possession': return 'Em posse';
      case 'sold': return 'Vendido';
      case 'returned': return 'Devolvido';
      case 'lost': return 'Perdido';
      default: return status;
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const calculateSuitcaseSummary = () => {
    const totalItems = suitcaseItems.length;
    const totalValue = suitcaseItems.reduce((sum, item) => {
      return sum + (item.product?.price || 0);
    }, 0);
    
    return {
      totalItems,
      totalValue
    };
  };

  const suitcaseSummary = calculateSuitcaseSummary();

  if (!suitcase) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-pink-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 7H4C2.89543 7 2 7.89543 2 9V17C2 18.1046 2.89543 19 4 19H20C21.1046 19 22 18.1046 22 17V9C22 7.89543 21.1046 7 20 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 12H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 7V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Detalhes da Maleta {suitcase.code}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <p className="text-sm text-gray-500 mb-4">
            Informações detalhadas sobre a maleta da revendedora {suitcase.seller?.name || "Não especificada"}.
          </p>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="items">Itens</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Código da Maleta</Label>
                  <p className="font-medium">{suitcase.code}</p>
                </div>
                
                <div>
                  <Label>Status</Label>
                  <p className="font-medium">
                    {suitcase.status === 'in_use' 
                      ? 'Em Uso' 
                      : suitcase.status === 'returned'
                        ? 'Devolvida'
                        : 'Aguardando Reposição'}
                  </p>
                </div>
                
                <div>
                  <Label>Revendedora</Label>
                  <p className="font-medium">{suitcase.seller?.name}</p>
                </div>
                
                <div>
                  <Label>Telefone</Label>
                  <p className="font-medium">{suitcase.seller?.phone || "Não informado"}</p>
                </div>
                
                <div>
                  <Label>Cidade</Label>
                  <p className="font-medium">{suitcase.city || "Não informada"}</p>
                </div>
                
                <div>
                  <Label>Bairro</Label>
                  <p className="font-medium">{suitcase.neighborhood || "Não informado"}</p>
                </div>
                
                <div>
                  <Label>Data de Criação</Label>
                  <p className="font-medium">{formatDate(suitcase.created_at)}</p>
                </div>
                
                <div>
                  <Label>Última Atualização</Label>
                  <p className="font-medium">{suitcase.updated_at ? formatDate(suitcase.updated_at) : "N/A"}</p>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button onClick={() => onEdit(suitcase)} className="bg-pink-500 hover:bg-pink-600">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Maleta
                </Button>
                
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="items" className="space-y-4">
              <div className="flex items-center mb-4 gap-2">
                <p className="text-lg font-medium">Itens na Maleta</p>
                <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  {suitcaseItems.length} itens
                </span>
              </div>
              
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Input
                    placeholder="Digite o código ou nome do item para adicionar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                <Button onClick={handleSearch} className="bg-pink-500 hover:bg-pink-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
              
              {searchResults.length > 0 && (
                <div className="bg-gray-50 p-3 rounded mb-4 border border-gray-200">
                  <h4 className="text-sm font-medium mb-2">Resultados da pesquisa:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {searchResults.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-2 bg-white rounded border">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-500">
                            {item.sku || "Sem código"} - R$ {item.price.toFixed(2)}
                          </p>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => handleAddItem(item.id)}
                          disabled={isItemSubmitting}
                          className="bg-pink-500 hover:bg-pink-600"
                        >
                          <PlusSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <p className="text-sm text-gray-500 mb-2">
                Use um leitor de código de barras ou digite o código/nome do produto para adicionar rapidamente.
              </p>
              
              {isLoadingItems ? (
                <div className="text-center py-10">
                  <div className="animate-spin h-8 w-8 border-4 border-pink-500 border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Carregando itens...</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {suitcaseItems.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">
                        Nenhum item adicionado à maleta ainda. Use a barra de pesquisa acima para adicionar itens.
                      </p>
                    </div>
                  ) : (
                    suitcaseItems.map((item, index) => (
                      <div key={item.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center">
                            {item.product?.photo_url ? (
                              <img 
                                src={item.product.photo_url} 
                                alt={item.product?.name} 
                                className="max-w-full max-h-full object-contain"
                              />
                            ) : (
                              <div className="text-gray-400 text-xs text-center">Sem imagem</div>
                            )}
                          </div>
                          
                          <div>
                            <h4 className="font-medium">{item.product?.name}</h4>
                            <p className="text-sm text-gray-500">
                              Código: {item.product?.sku || "N/A"}
                            </p>
                            <p className="text-sm font-semibold">
                              R$ {item.product?.price.toFixed(2) || "0.00"}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor={`status-${item.id}`} className="text-xs">
                              Status
                            </Label>
                            <Select
                              value={sellStatus[item.id]}
                              onValueChange={(value) => {
                                setSellStatus(prev => ({
                                  ...prev,
                                  [item.id]: value as SuitcaseItemStatus
                                }));
                                handleUpdateItemStatus(item.id, value, index);
                              }}
                            >
                              <SelectTrigger id={`status-${item.id}`}>
                                <SelectValue placeholder={getStatusLabel(item.status)} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="in_possession">Em posse</SelectItem>
                                <SelectItem value="sold">Vendido</SelectItem>
                                <SelectItem value="returned">Devolvido</SelectItem>
                                <SelectItem value="lost">Perdido</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {sellStatus[item.id] === 'sold' && (
                            <>
                              <div>
                                <Label htmlFor={`client-${item.id}`} className="text-xs">
                                  Cliente
                                </Label>
                                <Input
                                  id={`client-${item.id}`}
                                  placeholder="Nome do cliente"
                                  value={clientNames[item.id]}
                                  onChange={(e) => 
                                    setClientNames(prev => ({
                                      ...prev,
                                      [item.id]: e.target.value
                                    }))
                                  }
                                />
                              </div>
                              <div>
                                <Label htmlFor={`payment-${item.id}`} className="text-xs">
                                  Forma de Pagamento
                                </Label>
                                <Select
                                  value={paymentMethods[item.id]}
                                  onValueChange={(value) => 
                                    setPaymentMethods(prev => ({
                                      ...prev,
                                      [item.id]: value
                                    }))
                                  }
                                >
                                  <SelectTrigger id={`payment-${item.id}`}>
                                    <SelectValue placeholder="Selecione" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                                    <SelectItem value="pix">PIX</SelectItem>
                                    <SelectItem value="credito">Crédito</SelectItem>
                                    <SelectItem value="debito">Débito</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button 
                                onClick={() => handleUpdateItemStatus(item.id, 'sold', index)}
                                className="mt-auto bg-green-500 hover:bg-green-600 h-10"
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Confirmar
                              </Button>
                            </>
                          )}
                        </div>
                        
                        <Button 
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 self-start"
                        >
                          Remover
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
              
              <div className="mt-6 border-t border-gray-200 pt-4">
                <h3 className="text-lg font-medium mb-3">Resumo da Maleta</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <div className="bg-pink-100 p-2 rounded-full mr-3">
                        <List className="h-5 w-5 text-pink-500" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total de peças</p>
                        <p className="text-xl font-bold">{suitcaseSummary.totalItems} itens</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <div className="bg-pink-100 p-2 rounded-full mr-3">
                        <DollarSign className="h-5 w-5 text-pink-500" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Valor total da maleta</p>
                        <p className="text-xl font-bold text-pink-600">
                          R$ {suitcaseSummary.totalValue.toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div className="border-l-2 border-gray-200 pl-4 ml-2 space-y-6">
                <div className="relative">
                  <div className="absolute -left-6 mt-1">
                    <div className="bg-pink-500 rounded-full w-4 h-4"></div>
                  </div>
                  <div>
                    <h3 className="font-medium">Criação da Maleta</h3>
                    <p className="text-sm text-gray-500">{formatDate(suitcase.created_at)}</p>
                    <p className="mt-1 text-sm">
                      Maleta {suitcase.code} criada para {suitcase.seller?.name || "N/A"}.
                    </p>
                  </div>
                </div>
                
                {suitcase.updated_at && suitcase.updated_at !== suitcase.created_at && (
                  <div className="relative">
                    <div className="absolute -left-6 mt-1">
                      <div className="bg-blue-500 rounded-full w-4 h-4"></div>
                    </div>
                    <div>
                      <h3 className="font-medium">Atualização</h3>
                      <p className="text-sm text-gray-500">{formatDate(suitcase.updated_at)}</p>
                      <p className="mt-1 text-sm">
                        Dados da maleta foram atualizados.
                      </p>
                    </div>
                  </div>
                )}
                
                {suitcaseItems.map((item) => (
                  <div key={item.id} className="relative">
                    <div className="absolute -left-6 mt-1">
                      <div className="bg-green-500 rounded-full w-4 h-4"></div>
                    </div>
                    <div>
                      <h3 className="font-medium">Item Adicionado</h3>
                      <p className="text-sm text-gray-500">{formatDate(item.added_at)}</p>
                      <p className="mt-1 text-sm">
                        {item.product?.name || "Item desconhecido"} foi adicionado à maleta.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="hidden">
          <div ref={printRef}>
            <div className="p-8">
              <h1 className="text-2xl font-bold mb-4">Maleta {suitcase.code}</h1>
              <p className="mb-2">Revendedora: {suitcase.seller?.name}</p>
              <p className="mb-2">Data: {format(new Date(), "dd/MM/yyyy")}</p>
              
              <hr className="my-4" />
              
              <h2 className="text-xl font-semibold mb-3">Itens na Maleta</h2>
              <table className="w-full mb-4 border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">Código</th>
                    <th className="py-2 text-left">Produto</th>
                    <th className="py-2 text-right">Preço</th>
                    <th className="py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {suitcaseItems.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="py-2">{item.product?.sku || ""}</td>
                      <td className="py-2">{item.product?.name || ""}</td>
                      <td className="py-2 text-right">R$ {item.product?.price.toFixed(2) || "0.00"}</td>
                      <td className="py-2 text-right">{getStatusLabel(item.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="mt-4 border-t pt-4">
                <h2 className="text-xl font-semibold mb-3">Resumo</h2>
                <p>Total de peças: {suitcaseSummary.totalItems} itens</p>
                <p className="font-bold">Valor total: R$ {suitcaseSummary.totalValue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
