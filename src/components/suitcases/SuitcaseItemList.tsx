
import { useState, useEffect } from "react";
import { SuitcaseItem, SuitcaseItemStatus, SuitcaseStatus } from "@/types/suitcase";
import { SuitcaseController } from "@/controllers/suitcaseController";
import { SuitcaseModel } from "@/models/suitcaseModel";
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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Trash2, 
  ShoppingBag, 
  Edit,
  Save,
  X,
  RotateCcw
} from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserRole } from "@/models/userRoleModel";

interface SuitcaseItemListProps {
  suitcaseId: string;
  onItemsChanged?: () => void;
  readOnly?: boolean;
  suitcaseStatus?: SuitcaseStatus;
  userRoles?: string[];
}

export function SuitcaseItemList({ 
  suitcaseId, 
  onItemsChanged,
  readOnly = false,
  suitcaseStatus = 'in_use',
  userRoles = []
}: SuitcaseItemListProps) {
  const [items, setItems] = useState<SuitcaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<{ [key: string]: boolean }>({});
  const [editingQuantity, setEditingQuantity] = useState<string | null>(null);
  const [newQuantity, setNewQuantity] = useState<number>(1);
  const [itemToReturn, setItemToReturn] = useState<SuitcaseItem | null>(null);
  const [confirmReturnOpen, setConfirmReturnOpen] = useState(false);

  const isAdminOrPromoter = userRoles.includes('admin') || userRoles.includes('promoter');

  const fetchItems = async () => {
    try {
      setLoading(true);
      const fetchedItems = await SuitcaseController.getSuitcaseItems(suitcaseId);
      const activeItems = fetchedItems.filter(item => item.status === 'in_possession');
      setItems(activeItems);
    } catch (error: any) {
      console.error("Erro ao carregar itens da maleta:", error);
      toast.error("Erro ao carregar itens da maleta");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [suitcaseId]);

  const handleUpdateStatus = async (itemId: string, newStatus: SuitcaseItemStatus) => {
    try {
      setUpdating(prev => ({ ...prev, [itemId]: true }));
      
      await SuitcaseController.updateSuitcaseItemStatus(itemId, newStatus);
      
      await fetchItems();
      
      if (onItemsChanged) onItemsChanged();
      
      toast.success(`Item ${newStatus === 'sold' ? 'marcado como vendido' : newStatus === 'lost' ? 'marcado como perdido' : 'atualizado'} com sucesso`);
    } catch (error: any) {
      console.error("Erro ao atualizar status do item:", error);
      toast.error(error.message || "Erro ao atualizar status do item");
    } finally {
      setUpdating(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      setUpdating(prev => ({ ...prev, [itemId]: true }));
      
      await SuitcaseController.removeItemFromSuitcase(itemId);
      
      await fetchItems();
      
      if (onItemsChanged) onItemsChanged();
      
      toast.success("Item removido da maleta com sucesso");
    } catch (error: any) {
      console.error("Erro ao remover item da maleta:", error);
      toast.error(error.message || "Erro ao remover item da maleta");
    } finally {
      setUpdating(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleStartEditQuantity = (itemId: string, currentQuantity: number = 1) => {
    setEditingQuantity(itemId);
    setNewQuantity(currentQuantity);
  };

  const handleCancelEditQuantity = () => {
    setEditingQuantity(null);
  };

  const handleSaveQuantity = async (itemId: string) => {
    try {
      setUpdating(prev => ({ ...prev, [itemId]: true }));
      
      await SuitcaseModel.updateSuitcaseItemQuantity(itemId, newQuantity);
      
      await fetchItems();
      
      if (onItemsChanged) onItemsChanged();
      
      toast.success("Quantidade atualizada com sucesso");
      setEditingQuantity(null);
    } catch (error: any) {
      console.error("Erro ao atualizar quantidade do item:", error);
      toast.error(error.message || "Erro ao atualizar quantidade do item");
    } finally {
      setUpdating(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleReturnToInventory = (item: SuitcaseItem) => {
    setItemToReturn(item);
    setConfirmReturnOpen(true);
  };

  const confirmReturnToInventory = async () => {
    if (!itemToReturn) return;
    
    try {
      setUpdating(prev => ({ ...prev, [itemToReturn.id]: true }));
      
      const userRolesEnum = userRoles.map(role => {
        if (role === 'admin') return UserRole.ADMIN;
        if (role === 'promoter') return UserRole.PROMOTER;
        if (role === 'reseller') return UserRole.RESELLER;
        return UserRole.USER;
      });
      
      await SuitcaseController.returnItemToInventory(itemToReturn.id, userRolesEnum);
      
      await fetchItems();
      
      if (onItemsChanged) onItemsChanged();
      
      toast.success("Item devolvido ao estoque com sucesso");
    } catch (error: any) {
      console.error("Erro ao devolver item ao estoque:", error);
      toast.error(error.message || "Erro ao devolver item ao estoque");
    } finally {
      setUpdating(prev => ({ ...prev, [itemToReturn.id]: false }));
      setItemToReturn(null);
      setConfirmReturnOpen(false);
    }
  };

  const formatPrice = (price: number | undefined) => {
    if (price === undefined) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(price);
  };

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
            <TableHead className="w-[80px]">Qtd</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            {!readOnly && <TableHead className="w-[150px]">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const statusInfo = formatStatus(item.status);
            const isUpdating = updating[item.id] || false;
            const isEditing = editingQuantity === item.id;
            
            return (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-xs">{item.product?.sku || "N/A"}</TableCell>
                <TableCell>{item.product?.name || "Produto não encontrado"}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatPrice(item.product?.price)}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <div className="flex items-center space-x-1">
                      <Input
                        type="number"
                        value={newQuantity}
                        onChange={(e) => setNewQuantity(parseInt(e.target.value) || 1)}
                        min={1}
                        className="w-14 h-8 p-1 text-center"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSaveQuantity(item.id)}
                        disabled={isUpdating}
                        className="h-6 w-6"
                      >
                        <Save className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCancelEditQuantity}
                        className="h-6 w-6"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span>{item.quantity || 1}</span>
                      {!readOnly && item.status === 'in_possession' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStartEditQuantity(item.id, item.quantity)}
                          className="h-6 w-6 ml-1"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
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
                    <div className="flex space-x-1">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={isUpdating}
                        className="h-8 w-8"
                        title="Remover item"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                      
                      {isAdminOrPromoter && item.status === 'in_possession' && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleReturnToInventory(item)}
                          disabled={isUpdating}
                          className="h-8 w-8"
                          title="Devolver ao estoque"
                        >
                          <RotateCcw className="h-4 w-4 text-blue-500" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      
      {/* Diálogo de confirmação para devolução ao estoque */}
      <AlertDialog open={confirmReturnOpen} onOpenChange={setConfirmReturnOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Devolver item ao estoque?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá devolver {itemToReturn?.quantity || 1} unidade(s) do item "{itemToReturn?.product?.name}" ao estoque. 
              O item será removido da maleta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReturnToInventory}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
