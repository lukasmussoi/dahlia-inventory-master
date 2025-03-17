
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { SuitcaseController } from "@/controllers/suitcaseController";
import { Briefcase, Edit, Printer, Loader2, X, Calendar, MapPin, Plus } from "lucide-react";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { toast } from "sonner";
import { InventoryModel, type InventoryItem } from "@/models/inventoryModel";
import { SuitcaseItem } from "@/models/suitcaseModel";

// Interface estendida para incluir campos de vendas associados a um item da maleta
interface SuitcaseItemWithSales extends SuitcaseItem {
  sales?: Array<{
    customer_name?: string;
    payment_method?: string;
  }>;
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
  const [isAddItemSheetOpen, setIsAddItemSheetOpen] = useState(false);
  const [availableItems, setAvailableItems] = useState<InventoryItem[]>([]);
  const [selectedInventoryId, setSelectedInventoryId] = useState("");
  const [loadingInventory, setLoadingInventory] = useState(false);

  useEffect(() => {
    async function fetchSuitcaseDetails() {
      if (open && suitcaseId) {
        setLoading(true);
        try {
          const suitcaseData = await SuitcaseController.getSuitcaseById(suitcaseId);
          const itemsData = await SuitcaseController.getSuitcaseItems(suitcaseId);
          
          setSuitcase(suitcaseData);
          // Convertemos explicitamente para o tipo esperado
          setSuitcaseItems(itemsData as unknown as SuitcaseItemWithSales[]);
          
          const initialCustomerNames: Record<string, string> = {};
          const initialPaymentMethods: Record<string, string> = {};
          
          itemsData.forEach(item => {
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
      // Convertemos explicitamente para o tipo esperado
      setSuitcaseItems(updatedItems as unknown as SuitcaseItemWithSales[]);
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
      // Convertemos explicitamente para o tipo esperado
      setSuitcaseItems(updatedItems as unknown as SuitcaseItemWithSales[]);
      toast.success("Informações da venda salvas com sucesso");
    } catch (error) {
      console.error("Erro ao salvar venda:", error);
      toast.error("Erro ao salvar informações da venda");
    }
  };

  const fetchAvailableInventoryItems = async () => {
    setLoadingInventory(true);
    try {
      // Buscamos todos os itens disponíveis no inventário, sem filtros
      const items = await InventoryModel.getInventoryItems();
      setAvailableItems(items || []);
    } catch (error) {
      console.error("Erro ao buscar itens do inventário:", error);
      toast.error("Erro ao carregar itens disponíveis");
    } finally {
      setLoadingInventory(false);
    }
  };

  const openAddItemSheet = () => {
    fetchAvailableInventoryItems();
    setIsAddItemSheetOpen(true);
  };

  const handleAddItemToSuitcase = async () => {
    if (!selectedInventoryId) {
      toast.error("Selecione um item para adicionar");
      return;
    }

    try {
      await SuitcaseController.addItemToSuitcase({
        suitcase_id: suitcaseId,
        inventory_id: selectedInventoryId
      });

      const updatedItems = await SuitcaseController.getSuitcaseItems(suitcaseId);
      // Convertemos explicitamente para o tipo esperado
      setSuitcaseItems(updatedItems as unknown as SuitcaseItemWithSales[]);

      setIsAddItemSheetOpen(false);
      setSelectedInventoryId("");
      toast.success("Item adicionado à maleta com sucesso");
    } catch (error) {
      console.error("Erro ao adicionar item à maleta:", error);
      toast.error("Erro ao adicionar item à maleta");
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
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Itens na Maleta</h2>
                <Button onClick={openAddItemSheet} size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Adicionar Item
                </Button>
              </div>

              {suitcaseItems.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                  <h3 className="mt-2 text-lg font-medium">Nenhuma peça na maleta</h3>
                  <p className="text-muted-foreground">
                    Esta maleta não possui nenhuma peça registrada.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {suitcaseItems.map((item) => (
                    <div key={item.id} className="border rounded-md p-4 mb-2">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex items-start gap-3">
                          <div className="h-16 w-16 bg-gray-100 rounded">
                            {item.photo_url && (
                              <img 
                                src={item.photo_url} 
                                alt={item.name} 
                                className="h-full w-full object-cover rounded"
                              />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-lg">{item.name || "Produto não especificado"}</h4>
                            <p className="text-sm text-muted-foreground">
                              Código: {item.sku || "N/A"}
                            </p>
                            <p className="font-medium text-lg">
                              R$ {item.price?.toFixed(2).replace('.', ',') || "0,00"}
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

      <Sheet open={isAddItemSheetOpen} onOpenChange={setIsAddItemSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Adicionar Item à Maleta</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            {loadingInventory ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2">Carregando itens disponíveis...</span>
              </div>
            ) : (
              <>
                {availableItems.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhum item disponível no inventário.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Selecione um item do inventário para adicionar à maleta:
                    </p>
                    <Select 
                      onValueChange={setSelectedInventoryId}
                      value={selectedInventoryId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um item..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableItems.map(item => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} - {item.sku} (R$ {item.price.toFixed(2).replace('.', ',')})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setIsAddItemSheetOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAddItemToSuitcase}
              disabled={!selectedInventoryId || loadingInventory}
            >
              Adicionar Item
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
