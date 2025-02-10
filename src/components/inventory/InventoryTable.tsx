
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, AlertTriangle, Image as ImageIcon } from "lucide-react";
import { InventoryItem } from "@/models/inventoryModel";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { InventoryModel } from "@/models/inventoryModel";

interface InventoryTableProps {
  items: InventoryItem[];
  isLoading: boolean;
  onEdit?: (item: InventoryItem) => void;
  onDelete?: (id: string) => void;
}

export function InventoryTable({ items, isLoading, onEdit, onDelete }: InventoryTableProps) {
  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Nenhum item encontrado.</p>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const TableRowWithPhotos = ({ item }: { item: InventoryItem }) => {
    const { data: photos } = useQuery({
      queryKey: ['item-photos', item.id],
      queryFn: () => InventoryModel.getItemPhotos(item.id),
    });

    const primaryPhoto = photos?.find(photo => photo.isPrimary) || photos?.[0];

    return (
      <TableRow>
        <TableCell className="w-16">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
            {primaryPhoto ? (
              <img 
                src={primaryPhoto.url} 
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-6 h-6 text-gray-400" />
            )}
          </div>
        </TableCell>
        <TableCell className="max-w-[200px]">
          <div className="space-y-1 truncate">
            <div className="font-medium truncate">{item.name}</div>
            <div className="text-sm text-gray-500 truncate">{item.sku}</div>
          </div>
        </TableCell>
        <TableCell className="max-w-[150px]">
          <div className="truncate">{item.category_name}</div>
        </TableCell>
        <TableCell className="max-w-[150px]">
          <div className="truncate">{item.supplier_name || '-'}</div>
        </TableCell>
        <TableCell className="text-right whitespace-nowrap">
          <div className="space-y-1">
            <div>{item.quantity}</div>
            {item.quantity <= item.min_stock && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertTriangle className="h-4 w-4 text-amber-500 inline-block" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Estoque abaixo do mínimo ({item.min_stock})</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </TableCell>
        <TableCell className="text-right whitespace-nowrap">
          {formatCurrency(item.unit_cost)}
        </TableCell>
        <TableCell className="text-right whitespace-nowrap">
          <div className="space-y-1">
            <div>{formatCurrency(item.price)}</div>
            {item.suggested_price > 0 && item.suggested_price !== item.price && (
              <div className="text-sm text-gray-500">
                Sugerido: {formatCurrency(item.suggested_price)}
              </div>
            )}
          </div>
        </TableCell>
        <TableCell className="whitespace-nowrap">
          <span className={`px-2 py-1 rounded-full text-sm ${
            item.quantity === 0 
              ? 'bg-red-100 text-red-800' 
              : item.quantity <= item.min_stock
              ? 'bg-amber-100 text-amber-800'
              : 'bg-green-100 text-green-800'
          }`}>
            {item.quantity === 0 
              ? 'Em falta' 
              : item.quantity <= item.min_stock
              ? 'Estoque baixo'
              : 'Disponível'}
          </span>
        </TableCell>
        {(onEdit || onDelete) && (
          <TableCell className="text-right whitespace-nowrap">
            <div className="flex justify-end gap-2">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(item)}
                  className="hover:bg-gray-100"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(item.id)}
                  className="hover:bg-red-100 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </TableCell>
        )}
      </TableRow>
    );
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="max-w-[calc(100vw-2rem)] overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Foto</TableHead>
              <TableHead className="max-w-[200px]">SKU/Nome</TableHead>
              <TableHead className="max-w-[150px]">Categoria</TableHead>
              <TableHead className="max-w-[150px]">Fornecedor</TableHead>
              <TableHead className="text-right whitespace-nowrap">Quantidade</TableHead>
              <TableHead className="text-right whitespace-nowrap">Custo</TableHead>
              <TableHead className="text-right whitespace-nowrap">Preço</TableHead>
              <TableHead className="whitespace-nowrap">Status</TableHead>
              {(onEdit || onDelete) && <TableHead className="text-right whitespace-nowrap">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRowWithPhotos key={item.id} item={item} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
