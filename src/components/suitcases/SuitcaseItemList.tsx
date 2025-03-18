
import { useState, useEffect } from "react";
import { SuitcaseItem, SuitcaseItemStatus, SuitcaseStatus } from "@/types/suitcase";
import { SuitcaseController } from "@/controllers/suitcaseController";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Trash2, 
  ShoppingBag, 
  ArrowLeftRight,
  AlertTriangle
} from "lucide-react";

interface SuitcaseItemListProps {
  suitcaseId: string;
  onItemsChanged?: () => void;
  readOnly?: boolean;
  suitcaseStatus?: SuitcaseStatus;
}

export function SuitcaseItemList({ 
  suitcaseId, 
  onItemsChanged,
  readOnly = false,
  suitcaseStatus = 'in_use'
}: SuitcaseItemListProps) {
  const [items, setItems] = useState<SuitcaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<{ [key: string]: boolean }>({});

  // Carregar itens
  const fetchItems = async () => {
    try {
      setLoading(true);
      const fetchedItems = await SuitcaseController.getSuitcaseItems(suitcaseId);
      setItems(fetchedItems);
    } catch (error: any) {
      console.error("Erro ao carregar itens da maleta:", error);
      toast.error("Erro ao carregar itens da maleta");
    } finally {
      setLoading(false);
    }
  };

  // Carregar itens ao montar o componente
  useEffect(() => {
    fetchItems();
  }, [suitcaseId]);

  // Atualizar status de um item
  const handleUpdateStatus = async (itemId: string, newStatus: SuitcaseItemStatus) => {
    try {
      setUpdating(prev => ({ ...prev, [itemId]: true }));
      
      await SuitcaseController.updateSuitcaseItemStatus(itemId, newStatus);
      
      // Atualizar a lista de itens
      await fetchItems();
      
      // Notificar o componente pai
      if (onItemsChanged) onItemsChanged();
      
      toast.success(`Item ${newStatus === 'sold' ? 'marcado como vendido' : newStatus === 'lost' ? 'marcado como perdido' : 'atualizado'} com sucesso`);
    } catch (error: any) {
      console.error("Erro ao atualizar status do item:", error);
      toast.error(error.message || "Erro ao atualizar status do item");
    } finally {
      setUpdating(prev => ({ ...prev, [itemId]: false }));
    }
  };

  // Remover um item da maleta
  const handleRemoveItem = async (itemId: string) => {
    try {
      setUpdating(prev => ({ ...prev, [itemId]: true }));
      
      await SuitcaseController.removeItemFromSuitcase(itemId);
      
      // Atualizar a lista de itens
      await fetchItems();
      
      // Notificar o componente pai
      if (onItemsChanged) onItemsChanged();
      
      toast.success("Item removido da maleta com sucesso");
    } catch (error: any) {
      console.error("Erro ao remover item da maleta:", error);
      toast.error(error.message || "Erro ao remover item da maleta");
    } finally {
      setUpdating(prev => ({ ...prev, [itemId]: false }));
    }
  };

  // Formatar preço
  const formatPrice = (price: number | undefined) => {
    if (price === undefined) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(price);
  };

  // Formatador de status
  const formatStatus = (status: SuitcaseItemStatus): { label: string, color: string } => {
    switch (status) {
      case 'in_possession':
        return { label: 'Em Posse', color: 'bg-green-100 text-green-800 border-green-300' };
      case 'sold':
        return { label: 'Vendido', color: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'returned':
        return { label: 'Devolvido', color: 'bg-gray-100 text-gray-800 border-gray-300' };
      case 'lost':
        return { label: 'Perdido', color: 'bg-red-100 text-red-800 border-red-300' };
      default:
        return { label: 'Desconhecido', color: 'bg-gray-100 text-gray-800 border-gray-300' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum item na maleta</h3>
        <p className="mt-1 text-sm text-gray-500">
          {suitcaseStatus === 'in_use' 
            ? "Adicione itens para iniciar as vendas."
            : "Esta maleta não possui itens."}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">SKU</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead className="text-right">Preço</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            {!readOnly && <TableHead className="w-[100px]">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const statusInfo = formatStatus(item.status);
            const isUpdating = updating[item.id] || false;
            
            return (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-xs">{item.product?.sku || "N/A"}</TableCell>
                <TableCell>{item.product?.name || "Produto não encontrado"}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatPrice(item.product?.price)}
                </TableCell>
                <TableCell>
                  {readOnly ? (
                    <Badge variant="outline" className={statusInfo.color}>
                      {statusInfo.label}
                    </Badge>
                  ) : (
                    <Select 
                      value={item.status} 
                      onValueChange={(value) => handleUpdateStatus(item.id, value as SuitcaseItemStatus)}
                      disabled={isUpdating}
                    >
                      <SelectTrigger className="w-full h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in_possession">Em Posse</SelectItem>
                        <SelectItem value="sold">Vendido</SelectItem>
                        <SelectItem value="returned">Devolvido</SelectItem>
                        <SelectItem value="lost">Perdido</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                
                {!readOnly && (
                  <TableCell>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={isUpdating}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
