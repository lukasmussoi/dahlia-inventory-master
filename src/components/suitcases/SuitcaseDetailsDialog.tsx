
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Package, 
  Briefcase,
  Search,
  Plus,
  Printer,
  Calendar as CalendarIcon,
  User,
  History,
  CreditCard,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { Suitcase, SuitcaseStatus, SuitcaseItem, Acerto } from "@/types/suitcase";
import { SuitcaseController } from "@/controllers/suitcaseController";
import { AcertoMaletaController } from "@/controllers/acertoMaletaController";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { SuitcasePrintDialog } from "./SuitcasePrintDialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SuitcaseDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suitcase: Suitcase | null;
  onOpenAcertoDialog?: (suitcase: Suitcase) => void;
  onRefresh?: () => void;
  isAdmin?: boolean;
  onEdit?: (suitcase: Suitcase) => void;
}

export function SuitcaseDetailsDialog({
  open,
  onOpenChange,
  suitcase,
  onOpenAcertoDialog,
  onRefresh,
  isAdmin = false,
  onEdit
}: SuitcaseDetailsDialogProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("itens");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState<{ [key: string]: boolean }>({});
  const [nextSettlementDate, setNextSettlementDate] = useState<Date | undefined>(
    suitcase?.next_settlement_date ? new Date(suitcase.next_settlement_date) : undefined
  );
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);

  // Atualizar quando o suitcase mudar
  useEffect(() => {
    if (suitcase) {
      // Resetar o termo de busca quando a maleta muda
      setSearchTerm("");
      setSearchResults([]);
      // Atualizar a data de próximo acerto se estiver definida
      setNextSettlementDate(
        suitcase.next_settlement_date ? new Date(suitcase.next_settlement_date) : undefined
      );
    }
  }, [suitcase]);

  // Buscar itens da maleta (apenas itens em posse, não os vendidos)
  const { data: suitcaseItems = [], refetch: refetchItems } = useQuery({
    queryKey: ['suitcase-items', suitcase?.id],
    queryFn: async () => {
      if (!suitcase) return [];
      const items = await SuitcaseController.getSuitcaseItems(suitcase.id);
      // Filtrar apenas itens que não foram vendidos
      return items.filter(item => item.status === 'in_possession');
    },
    enabled: !!suitcase && open,
  });

  // Buscar histórico de acertos da maleta
  const { data: acertosHistorico = [], isLoading: isLoadingAcertos } = useQuery({
    queryKey: ['suitcase-acertos', suitcase?.id],
    queryFn: async () => {
      if (!suitcase) return [];
      try {
        return await AcertoMaletaController.getAcertosBySuitcase(suitcase.id);
      } catch (error) {
        console.error("Erro ao buscar histórico de acertos:", error);
        return [];
      }
    },
    enabled: !!suitcase && open && activeTab === "historico",
  });

  // Buscar informações da promotora responsável pela revendedora
  const { data: promoterInfo, isLoading: loadingPromoterInfo } = useQuery({
    queryKey: ['promoter-for-reseller', suitcase?.seller_id],
    queryFn: () => suitcase?.seller_id 
      ? SuitcaseController.getPromoterForReseller(suitcase.seller_id) 
      : Promise.resolve(null),
    enabled: !!suitcase?.seller_id && open,
  });

  // Realizar busca
  const handleSearch = async (e?: React.KeyboardEvent) => {
    if (e && e.key !== 'Enter') return;
    if (!suitcase) return;
    
    if (searchTerm.trim() === "") {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const results = await SuitcaseController.searchInventoryItems(searchTerm);
      setSearchResults(results);
      
      if (results.length === 0) {
        toast.info("Nenhum item encontrado");
      }
    } catch (error: any) {
      console.error("Erro ao buscar itens:", error);
      toast.error(error.message || "Erro ao buscar itens");
    } finally {
      setIsSearching(false);
    }
  };

  // Adicionar item à maleta
  const handleAddItem = async (inventoryId: string) => {
    if (!suitcase) return;
    
    try {
      setIsAdding(prev => ({ ...prev, [inventoryId]: true }));
      
      await SuitcaseController.addItemToSuitcase(suitcase.id, inventoryId);
      
      // Atualizar lista de resultados para remover o item adicionado
      setSearchResults(prevResults => prevResults.filter(item => item.id !== inventoryId));
      
      // Atualizar a lista de itens da maleta
      refetchItems();
      
      toast.success("Item adicionado à maleta com sucesso");
    } catch (error: any) {
      console.error("Erro ao adicionar item à maleta:", error);
      toast.error(error.message || "Erro ao adicionar item à maleta");
    } finally {
      setIsAdding(prev => ({ ...prev, [inventoryId]: false }));
    }
  };

  // Atualizar status de um item
  const handleToggleSold = async (item: SuitcaseItem, sold: boolean) => {
    try {
      await SuitcaseController.updateSuitcaseItemStatus(
        item.id, 
        sold ? 'sold' : 'in_possession'
      );
      
      // Atualizar a lista de itens
      refetchItems();
      
      toast.success(`Item ${sold ? 'marcado como vendido' : 'marcado como disponível'}`);
    } catch (error: any) {
      console.error("Erro ao atualizar status do item:", error);
      toast.error(error.message || "Erro ao atualizar status do item");
    }
  };

  // Atualizar dados de venda
  const handleUpdateSaleInfo = async (itemId: string, field: string, value: string) => {
    try {
      await SuitcaseController.updateSaleInfo(itemId, field, value);
      refetchItems();
    } catch (error: any) {
      console.error("Erro ao atualizar informações de venda:", error);
      toast.error(error.message || "Erro ao atualizar informações de venda");
    }
  };

  // Atualizar data do próximo acerto e criar registro de acerto pendente
  const handleUpdateNextSettlementDate = async (date?: Date) => {
    if (!suitcase) return;
    
    try {
      setNextSettlementDate(date);
      
      // Atualizar a data na maleta
      await SuitcaseController.updateSuitcase(suitcase.id, {
        next_settlement_date: date ? date.toISOString() : null,
      });
      
      // Se uma data foi definida, criar um acerto pendente
      if (date) {
        // Criar acerto pendente
        await SuitcaseController.createPendingSettlement(suitcase.id, date);
        toast.success(`Data do próximo acerto definida para ${format(date, 'dd/MM/yyyy', { locale: ptBR })} e acerto pendente criado`);
      } else {
        toast.info("Data do próximo acerto removida");
      }
      
      // Atualizar a consulta para refletir as mudanças
      queryClient.invalidateQueries({ queryKey: ['suitcase', suitcase.id] });
      // Invalidar também a lista de acertos
      queryClient.invalidateQueries({ queryKey: ['acertos'] });
    } catch (error: any) {
      console.error("Erro ao atualizar data do próximo acerto:", error);
      toast.error(error.message || "Erro ao atualizar data do próximo acerto");
    }
  };

  // Formatar preço
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(price);
  };

  // Calcular valor total da maleta
  const calculateTotalValue = (): number => {
    return suitcaseItems.reduce((total, item) => {
      const price = item.product?.price || 0;
      const quantity = item.quantity || 1;
      return total + (price * quantity);
    }, 0);
  };

  // Formatar o endereço da revendedora
  const getSellerName = (): string => {
    return suitcase?.seller?.name || "Revendedora não informada";
  };

  // Fechar o diálogo
  const handleClose = () => {
    onOpenChange(false);
    if (onRefresh) {
      setTimeout(() => {
        onRefresh();
      }, 100);
    }
  };

  // Abrir diálogo de impressão
  const handlePrint = () => {
    setIsPrintDialogOpen(true);
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  // Formatar método de pagamento
  const formatPaymentMethod = (method?: string) => {
    if (!method) return "Não informado";
    
    const methods: Record<string, string> = {
      'cash': 'Dinheiro',
      'credit': 'Cartão de Crédito',
      'debit': 'Cartão de Débito',
      'pix': 'PIX'
    };
    
    return methods[method] || method;
  };

  // Editar maleta
  const handleEdit = () => {
    if (!suitcase || !onEdit) return;
    
    // Fechar este diálogo
    onOpenChange(false);
    
    // Abrir o diálogo de edição
    setTimeout(() => {
      onEdit(suitcase);
    }, 100);
  };

  if (!suitcase) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto p-0">
          <div className="p-6 pb-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-pink-500" />
                <h2 className="text-xl font-semibold">Detalhes da Maleta {suitcase.code}</h2>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => onOpenChange(false)}
              >
                &times;
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <p>Revendedora: <span className="font-medium text-foreground">{getSellerName()}</span></p>
              
              {promoterInfo && (
                <div className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  <p>Promotora: <span className="font-medium text-foreground">{promoterInfo.name}</span></p>
                </div>
              )}
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b">
              <div className="flex items-center px-6">
                <TabsList className="h-10 bg-transparent">
                  <TabsTrigger
                    value="informacoes"
                    className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-pink-500 data-[state=active]:bg-transparent"
                  >
                    Informações
                  </TabsTrigger>
                  <TabsTrigger
                    value="itens"
                    className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-pink-500 data-[state=active]:bg-transparent"
                  >
                    Itens
                  </TabsTrigger>
                  <TabsTrigger
                    value="historico"
                    className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-pink-500 data-[state=active]:bg-transparent"
                  >
                    Histórico
                  </TabsTrigger>
                </TabsList>
                <div className="ml-auto">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handlePrint} 
                    className="gap-1"
                  >
                    <Printer className="h-4 w-4" />
                    Imprimir
                  </Button>
                </div>
              </div>
            </div>
            
            <TabsContent value="informacoes" className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Dados da Maleta</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-500">Código:</span>
                      <p className="font-medium">{suitcase.code}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Status:</span>
                      <p className="font-medium">{suitcase.status === 'in_use' ? 'Em Uso' : 
                        suitcase.status === 'returned' ? 'Devolvida' : 
                        suitcase.status === 'in_replenishment' ? 'Em Reposição' : 
                        suitcase.status}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Criada em:</span>
                      <p className="font-medium">{new Date(suitcase.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="pt-2">
                      <span className="text-sm text-gray-500 block mb-1">Próximo acerto:</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !nextSettlementDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {nextSettlementDate ? (
                              format(nextSettlementDate, "dd/MM/yyyy")
                            ) : (
                              <span>Definir data</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={nextSettlementDate}
                            onSelect={handleUpdateNextSettlementDate}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                            disabled={(date) => date < new Date()}
                            locale={ptBR}
                          />
                          <div className="p-3 border-t border-border">
                            <Button
                              variant="ghost"
                              className="w-full justify-center text-sm"
                              onClick={() => handleUpdateNextSettlementDate(undefined)}
                            >
                              Limpar
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Dados da Revendedora</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-500">Nome:</span>
                      <p className="font-medium">{suitcase.seller?.name || "Não informado"}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Telefone:</span>
                      <p className="font-medium">{suitcase.seller?.phone || "Não informado"}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Localização:</span>
                      <p className="font-medium">{suitcase.city || "Não informado"}, {suitcase.neighborhood || "Não informado"}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Promotora responsável:</span>
                      <p className="font-medium">
                        {loadingPromoterInfo ? (
                          <span className="inline-block w-24 h-4 bg-gray-200 animate-pulse rounded"></span>
                        ) : (
                          promoterInfo?.name || "Não atribuída"
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="itens" className="p-6 pt-3">
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
                  
                  {searchResults.length > 0 && (
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
                  )}
                  
                  {suitcaseItems.length === 0 ? (
                    <div className="text-center py-8 border rounded-md">
                      <Package className="h-12 w-12 mx-auto text-gray-300" />
                      <p className="mt-2 text-muted-foreground">Nenhum item na maleta ainda</p>
                      <p className="text-sm text-muted-foreground">Adicione itens usando a busca acima</p>
                    </div>
                  ) : (
                    <>
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
                                    <img src={image} alt={item.product?.name} className="w-full h-full object-cover rounded-md" />
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
                    </>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="historico" className="p-6">
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <History className="h-5 w-5 text-pink-500" />
                  <h3 className="text-lg font-medium">Histórico de Acertos</h3>
                </div>
                
                {isLoadingAcertos ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                  </div>
                ) : acertosHistorico.length === 0 ? (
                  <div className="text-center py-6 border rounded-md">
                    <History className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-2 text-muted-foreground">Nenhum acerto realizado</p>
                    <p className="text-sm text-muted-foreground">Os acertos realizados serão exibidos aqui</p>
                  </div>
                ) : (
                  acertosHistorico.map((acerto: Acerto) => (
                    <Card key={acerto.id} className="mb-4">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Clock className="h-4 w-4 text-pink-500" />
                            Acerto de {formatDate(acerto.settlement_date)}
                          </CardTitle>
                          <Badge 
                            variant={acerto.status === 'concluido' ? 'default' : 'outline'}
                            className={acerto.status === 'concluido' 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200 border-green-300' 
                              : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300'}
                          >
                            {acerto.status === 'concluido' ? 'Concluído' : 'Pendente'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Total em vendas:</p>
                            <p className="font-semibold text-lg">{formatPrice(acerto.total_sales)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Comissão da revendedora:</p>
                            <p className="font-semibold text-lg text-green-600">{formatPrice(acerto.commission_amount)}</p>
                          </div>
                        </div>
                        
                        {acerto.items_vendidos && acerto.items_vendidos.length > 0 ? (
                          <div>
                            <h4 className="font-medium mb-2 mt-4 flex items-center gap-1">
                              <Package className="h-4 w-4" />
                              Itens Vendidos ({acerto.items_vendidos.length})
                            </h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {acerto.items_vendidos.map((item) => (
                                <div key={item.id} className="border rounded p-3 flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">{item.product?.name}</p>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                      <span>Código: {item.product?.sku}</span>
                                      <span>Preço: {formatPrice(item.price)}</span>
                                    </div>
                                    <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
                                      {item.customer_name && (
                                        <span className="flex items-center gap-1">
                                          <User className="h-3 w-3" />
                                          Cliente: {item.customer_name}
                                        </span>
                                      )}
                                      {item.payment_method && (
                                        <span className="flex items-center gap-1">
                                          <CreditCard className="h-3 w-3" />
                                          Pagamento: {formatPaymentMethod(item.payment_method)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Nenhum item registrado neste acerto.</p>
                        )}
                        
                        {acerto.receipt_url && (
                          <div className="mt-4">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(acerto.receipt_url, '_blank')}
                              className="w-full sm:w-auto"
                            >
                              <Printer className="h-4 w-4 mr-2" />
                              Visualizar Comprovante
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="p-4 border-t flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Fechar
            </Button>
            
            {isAdmin && (
              <Button onClick={handleEdit} className="bg-pink-500 hover:bg-pink-600">
                Editar Maleta
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de impressão separado */}
      <SuitcasePrintDialog
        open={isPrintDialogOpen}
        onOpenChange={setIsPrintDialogOpen}
        suitcase={suitcase}
        suitcaseItems={suitcaseItems}
        promoterInfo={promoterInfo}
      />
    </>
  );
}
