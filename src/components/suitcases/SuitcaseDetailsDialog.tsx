
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { SuitcaseController } from "@/controllers/suitcaseController";
import { Briefcase, Edit, Printer, Loader2, Calendar, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
  const [activeTab, setActiveTab] = useState("informacoes");
  const [suitcase, setSuitcase] = useState<any>(null);
  const [suitcaseItems, setSuitcaseItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerNames, setCustomerNames] = useState<Record<string, string>>({});
  const [paymentMethods, setPaymentMethods] = useState<Record<string, string>>({});

  // Buscar detalhes da maleta
  useEffect(() => {
    async function fetchSuitcaseDetails() {
      if (open && suitcaseId) {
        setLoading(true);
        try {
          const suitcaseData = await SuitcaseController.getSuitcaseById(suitcaseId);
          const itemsData = await SuitcaseController.getSuitcaseItems(suitcaseId);
          
          console.log("Dados da maleta:", suitcaseData);
          setSuitcase(suitcaseData);
          setSuitcaseItems(itemsData);
          
          // Inicializar estados para nomes de clientes e métodos de pagamento
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
        } finally {
          setLoading(false);
        }
      }
    }

    fetchSuitcaseDetails();
  }, [open, suitcaseId]);

  // Manipular mudança de status de item
  const handleItemStatusChange = async (item: any, checked: boolean) => {
    try {
      const newStatus = checked ? 'sold' : 'in_possession';
      const saleInfo = checked
        ? { customer_name: customerNames[item.id], payment_method: paymentMethods[item.id] }
        : undefined;
      
      await SuitcaseController.updateSuitcaseItemStatus(item.id, newStatus, saleInfo);
      
      // Atualizar a lista de itens após a alteração
      const updatedItems = await SuitcaseController.getSuitcaseItems(suitcaseId);
      setSuitcaseItems(updatedItems);
    } catch (error) {
      console.error("Erro ao atualizar status do item:", error);
    }
  };

  // Manipular mudança no nome do cliente
  const handleCustomerNameChange = (itemId: string, name: string) => {
    setCustomerNames(prev => ({ ...prev, [itemId]: name }));
  };

  // Manipular mudança no método de pagamento
  const handlePaymentMethodChange = (itemId: string, method: string) => {
    setPaymentMethods(prev => ({ ...prev, [itemId]: method }));
  };

  // Manipular salvamento de venda
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
      
      // Atualizar a lista de itens após a alteração
      const updatedItems = await SuitcaseController.getSuitcaseItems(suitcaseId);
      setSuitcaseItems(updatedItems);
    } catch (error) {
      console.error("Erro ao salvar venda:", error);
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

  // Formatar código da maleta
  const code = suitcase.code || `ML${suitcase.id.substring(0, 3)}`;
  
  // Obter nome da revendedora corretamente
  const resellerName = suitcase.seller && suitcase.seller.name 
    ? suitcase.seller.name 
    : "Revendedora não especificada";
  
  // Formatar datas
  const createdAt = suitcase.created_at 
    ? format(new Date(suitcase.created_at), 'dd/MM/yyyy')
    : "Data não disponível";
  
  const updatedAt = suitcase.updated_at 
    ? format(new Date(suitcase.updated_at), 'dd/MM/yyyy HH:mm')
    : "Data não disponível";
  
  // Formatar data do próximo acerto
  const nextSettlementDate = suitcase.next_settlement_date
    ? format(new Date(suitcase.next_settlement_date), 'dd/MM/yyyy')
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" /> Detalhes da Maleta {code}
          </DialogTitle>
          <DialogDescription>
            Informações detalhadas sobre a maleta da revendedora {resellerName}.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="informacoes">Informações</TabsTrigger>
            <TabsTrigger value="itens">Itens</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          {/* Aba de Informações */}
          <TabsContent value="informacoes" className="space-y-4">
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
                <h3 className="text-sm font-medium text-muted-foreground">Quantidade de Itens</h3>
                <p className="text-lg font-medium">{suitcaseItems.length}</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Data de Criação</h3>
                <p className="text-lg font-medium flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-muted-foreground" /> {createdAt}
                </p>
              </div>

              {nextSettlementDate && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Próximo Acerto</h3>
                  <p className="text-lg font-medium flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-muted-foreground" /> {nextSettlementDate}
                  </p>
                </div>
              )}

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

          {/* Aba de Itens */}
          <TabsContent value="itens" className="space-y-4">
            {suitcaseItems.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                <h3 className="mt-2 text-lg font-medium">Nenhum item na maleta</h3>
                <p className="text-muted-foreground">
                  Esta maleta não possui nenhum item registrado.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {suitcaseItems.map((item) => (
                  <div key={item.id} className="border rounded-md p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-gray-100 rounded">
                          {item.product?.photo_url && (
                            <img 
                              src={item.product.photo_url} 
                              alt={item.product.name} 
                              className="h-full w-full object-cover rounded"
                            />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium">{item.product?.name || "Produto não especificado"}</h4>
                          <p className="text-sm text-muted-foreground">
                            Código: {item.product?.sku || "N/A"}
                          </p>
                          <p className="font-medium">
                            R$ {item.product?.price.toFixed(2).replace('.', ',') || "0,00"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`item-${item.id}-sold`}
                            checked={item.status === 'sold'}
                            onCheckedChange={(checked) => 
                              handleItemStatusChange(item, checked as boolean)
                            }
                          />
                          <label 
                            htmlFor={`item-${item.id}-sold`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Vendido
                          </label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Input
                          placeholder="Nome do cliente"
                          value={customerNames[item.id] || ''}
                          onChange={(e) => handleCustomerNameChange(item.id, e.target.value)}
                          disabled={item.status !== 'sold'}
                        />
                        <Select
                          value={paymentMethods[item.id] || ''}
                          onValueChange={(value) => handlePaymentMethodChange(item.id, value)}
                          disabled={item.status !== 'sold'}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Forma de pagamento" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dinheiro">Dinheiro</SelectItem>
                            <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                            <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                            <SelectItem value="pix">PIX</SelectItem>
                            <SelectItem value="boleto">Boleto</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {item.status === 'sold' && (
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={() => handleSaveSale(item)}
                          >
                            Salvar Informações
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Aba de Histórico */}
          <TabsContent value="historico" className="space-y-4">
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

              {/* Aqui poderia ser adicionado mais eventos do histórico real da maleta */}
            </div>
          </TabsContent>
        </Tabs>

        <Separator />

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onPrint()}>
            <Printer className="h-4 w-4 mr-2" /> Imprimir
          </Button>
          <Button size="sm" onClick={() => onEdit()}>
            <Edit className="h-4 w-4 mr-2" /> Editar Maleta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
