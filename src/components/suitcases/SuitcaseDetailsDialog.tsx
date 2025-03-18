
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  BarChart, 
  Package, 
  ShoppingCart, 
  User, 
  Map, 
  Calendar, 
  Phone, 
  Briefcase,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";
import { Suitcase, SuitcaseStatus } from "@/types/suitcase";
import { SuitcaseController } from "@/controllers/suitcaseController";
import { SuitcaseItemList } from "@/components/suitcases/SuitcaseItemList";
import { SuitcaseInventorySearch } from "@/components/suitcases/SuitcaseInventorySearch";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface SuitcaseDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suitcase: Suitcase | null;
  onOpenAcertoDialog?: (suitcase: Suitcase) => void;
  onRefresh?: () => void;
  isAdmin?: boolean;
}

export function SuitcaseDetailsDialog({
  open,
  onOpenChange,
  suitcase,
  onOpenAcertoDialog,
  onRefresh,
  isAdmin = false
}: SuitcaseDetailsDialogProps) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SuitcaseStatus>(suitcase?.status || 'in_use');
  const [activeTab, setActiveTab] = useState("items");
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Atualizar o status quando o suitcase mudar
  useEffect(() => {
    if (suitcase) {
      setStatus(suitcase.status || 'in_use');
    }
  }, [suitcase]);

  // Buscar itens da maleta
  const { data: suitcaseItems = [], refetch: refetchItems } = useQuery({
    queryKey: ['suitcase-items', suitcase?.id],
    queryFn: () => suitcase ? SuitcaseController.getSuitcaseItems(suitcase.id) : Promise.resolve([]),
    enabled: !!suitcase && open,
  });

  // Formatar status para exibição
  const formatStatus = (status: SuitcaseStatus | string): string => {
    const statusMap: Record<string, string> = {
      'in_use': 'Em Uso',
      'returned': 'Devolvida',
      'in_replenishment': 'Em Reposição'
    };
    
    return statusMap[status] || status;
  };

  // Formatar o endereço da revendedora
  const formatSellerAddress = (): string => {
    if (!suitcase?.seller?.address) return 'Endereço não cadastrado';
    
    const address = suitcase.seller.address;
    const parts = [];
    
    if (address.street) parts.push(address.street);
    if (address.number) parts.push(address.number);
    if (address.neighborhood) parts.push(address.neighborhood);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.zipCode) parts.push(address.zipCode);
    
    return parts.join(', ') || 'Endereço não cadastrado';
  };

  // Atualizar o status da maleta
  const handleStatusChange = async (newStatus: string) => {
    if (!suitcase) return;
    
    try {
      setIsUpdating(true);
      
      await SuitcaseController.updateSuitcase(suitcase.id, {
        status: newStatus as SuitcaseStatus
      });
      
      // Atualizar o estado local
      setStatus(newStatus as SuitcaseStatus);
      
      // Invalidar a consulta para forçar recarregamento dos dados
      queryClient.invalidateQueries({queryKey: ['suitcases']});
      queryClient.invalidateQueries({queryKey: ['suitcases-summary']});
      
      if (onRefresh) onRefresh();
      
      toast.success(`Status da maleta atualizado para ${formatStatus(newStatus)}`);
    } catch (error: any) {
      console.error("Erro ao atualizar status da maleta:", error);
      toast.error(error.message || "Erro ao atualizar status da maleta");
    } finally {
      setIsUpdating(false);
    }
  };

  // Excluir a maleta
  const handleDelete = async () => {
    if (!suitcase) return;
    
    try {
      setIsUpdating(true);
      
      await SuitcaseController.deleteSuitcase(suitcase.id);
      
      // Fechar o diálogo
      onOpenChange(false);
      
      // Atualizar a lista de maletas
      if (onRefresh) {
        setTimeout(() => {
          onRefresh();
        }, 100);
      }
      
      toast.success("Maleta excluída com sucesso");
    } catch (error: any) {
      console.error("Erro ao excluir maleta:", error);
      toast.error(error.message || "Erro ao excluir maleta");
    } finally {
      setIsUpdating(false);
      setConfirmDelete(false);
    }
  };

  // Realizar o acerto da maleta
  const handleSettlement = () => {
    if (!suitcase || !onOpenAcertoDialog) return;
    
    // Fechar este diálogo
    onOpenChange(false);
    
    // Abrir o diálogo de acerto
    setTimeout(() => {
      onOpenAcertoDialog(suitcase);
    }, 100);
  };

  // Verificar se a maleta tem itens em posse
  const hasItemsInPossession = suitcaseItems.some(item => item.status === 'in_possession');

  // Verificar se o botão de acerto deve estar desabilitado
  const isSettlementDisabled = !hasItemsInPossession || status !== 'in_use';

  if (!suitcase) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Briefcase className="h-5 w-5 text-pink-500" />
            Maleta {suitcase.code}
            
            <Badge 
              variant="outline" 
              className={`ml-2 ${
                status === 'in_use' 
                  ? 'bg-green-100 text-green-700 border-green-300' 
                  : status === 'returned' 
                    ? 'bg-gray-100 text-gray-700 border-gray-300'
                    : 'bg-blue-100 text-blue-700 border-blue-300'
              }`}
            >
              {formatStatus(status)}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        {/* Dados da Maleta e da Revendedora */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-3">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-pink-500" />
              Dados da Revendedora
            </h3>
            
            <div className="grid grid-cols-1 gap-2">
              <div>
                <span className="text-sm text-gray-500">Nome:</span>
                <p className="font-medium">{suitcase.seller?.name || "Não informado"}</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Telefone:</span>
                <p className="font-medium flex items-center gap-1">
                  <Phone className="h-3 w-3 text-gray-400" />
                  {suitcase.seller?.phone || "Não informado"}
                </p>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Endereço:</span>
                <p className="font-medium flex items-center gap-1">
                  <Map className="h-3 w-3 text-gray-400" />
                  {formatSellerAddress()}
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-pink-500" />
              Dados da Maleta
            </h3>
            
            <div className="grid grid-cols-1 gap-2">
              <div>
                <span className="text-sm text-gray-500">Código:</span>
                <p className="font-medium">{suitcase.code}</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Localização:</span>
                <p className="font-medium">{suitcase.city} • {suitcase.neighborhood}</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Enviada em:</span>
                <p className="font-medium flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-gray-400" />
                  {new Date(suitcase.sent_at || suitcase.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              
              {suitcase.next_settlement_date && (
                <div>
                  <span className="text-sm text-gray-500">Próximo acerto:</span>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    {new Date(suitcase.next_settlement_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        {/* Ações da Maleta */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
          {isAdmin && (
            <Select value={status} onValueChange={handleStatusChange} disabled={isUpdating}>
              <SelectTrigger>
                <SelectValue placeholder="Status da Maleta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_use">Em Uso</SelectItem>
                <SelectItem value="returned">Devolvida</SelectItem>
                <SelectItem value="in_replenishment">Em Reposição</SelectItem>
              </SelectContent>
            </Select>
          )}
          
          <Button 
            variant="outline" 
            className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
            disabled={isSettlementDisabled || isUpdating}
            onClick={handleSettlement}
          >
            <BarChart className="h-4 w-4 mr-2" />
            Realizar Acerto
          </Button>
          
          {isAdmin && (
            <>
              {!confirmDelete ? (
                <Button 
                  variant="outline" 
                  className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
                  onClick={() => setConfirmDelete(true)}
                  disabled={isUpdating}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Excluir Maleta
                </Button>
              ) : (
                <Button 
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isUpdating}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar Exclusão
                </Button>
              )}
            </>
          )}
        </div>
        
        <Separator className="my-4" />
        
        {/* Abas para Itens e Adicionar */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="items" className="flex gap-2 items-center">
              <Package className="h-4 w-4" />
              Itens da Maleta
            </TabsTrigger>
            {status === 'in_use' && (
              <TabsTrigger value="add" className="flex gap-2 items-center">
                <ShoppingCart className="h-4 w-4" />
                Adicionar Itens
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="items" className="space-y-4">
            <SuitcaseItemList 
              suitcaseId={suitcase.id} 
              onItemsChanged={refetchItems}
              readOnly={status !== 'in_use'}
              suitcaseStatus={status}
            />
          </TabsContent>
          
          <TabsContent value="add" className="space-y-4">
            {status === 'in_use' && (
              <SuitcaseInventorySearch 
                suitcaseId={suitcase.id}
                onItemAdded={() => {
                  refetchItems();
                  setActiveTab("items");
                }}
              />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
