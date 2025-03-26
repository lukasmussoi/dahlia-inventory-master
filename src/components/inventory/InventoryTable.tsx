
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, AlertTriangle, Image as ImageIcon, Briefcase, Pencil, Archive, RotateCcw } from "lucide-react";
import { InventoryItem } from "@/models/inventoryModel";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { InventoryModel } from "@/models/inventoryModel";
import { Badge } from "@/components/ui/badge";
import { CombinedSuitcaseController } from "@/controllers/suitcase";
import { PrintLabelButton } from "./PrintLabelButton";
import { ItemImage } from "@/components/suitcases/supply/ItemImage";

interface InventoryTableProps {
  items: InventoryItem[];
  isLoading: boolean;
  onEdit?: (item: InventoryItem) => void;
  onDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
  onRestore?: (id: string) => void;
  showArchivedControls?: boolean;
}

export function InventoryTable({ 
  items, 
  isLoading, 
  onEdit, 
  onDelete,
  onArchive,
  onRestore,
  showArchivedControls = false
}: InventoryTableProps) {
  console.log("InventoryTable - recebeu items:", items.length, "showArchivedControls:", showArchivedControls);

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

  const TableRowWithPhotos = ({ item }: { item: InventoryItem & { suitcase_info?: any } }) => {
    const { data: photos } = useQuery({
      queryKey: ['item-photos', item.id],
      queryFn: () => InventoryModel.getItemPhotos(item.id),
    });

    const { data: suitcaseInfo } = useQuery({
      queryKey: ['item-suitcase', item.id],
      queryFn: () => CombinedSuitcaseController.getItemSuitcaseInfo(item.id),
      enabled: item.quantity === 1,
    });

    const primaryPhoto = photos?.find(photo => photo.is_primary) || photos?.[0];

    return (
      <TableRow>
        <TableCell>
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
            {primaryPhoto ? (
              <ItemImage 
                photoUrl={primaryPhoto.photo_url} 
                alt={item.name}
                className="w-full h-full"
              />
            ) : (
              <ImageIcon className="w-6 h-6 text-gray-400" />
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="space-y-1">
            <div className="font-medium">{item.name}</div>
            <div className="text-sm text-gray-500">{item.sku}</div>
            {(item.suitcase_info || suitcaseInfo) && (
              <Badge variant="outline" className="flex items-center gap-1 mt-1 text-xs">
                <Briefcase className="h-3 w-3" />
                <span>
                  Maleta: {(item.suitcase_info || suitcaseInfo)?.suitcase_code} ({(item.suitcase_info || suitcaseInfo)?.seller_name})
                </span>
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell>{item.category_name}</TableCell>
        <TableCell>{item.supplier_name || '-'}</TableCell>
        <TableCell className="text-right">
          <div className="space-y-1">
            <div>{item.quantity}</div>
            {item.quantity <= item.min_stock && (
              <Tooltip>
                <TooltipTrigger>
                  <AlertTriangle className="h-4 w-4 text-amber-500 inline-block" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Estoque abaixo do mínimo ({item.min_stock})</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </TableCell>
        <TableCell className="text-right">
          {formatCurrency(item.unit_cost)}
        </TableCell>
        <TableCell className="text-right">
          <div className="space-y-1">
            <div>{formatCurrency(item.price)}</div>
            {item.suggested_price > 0 && item.suggested_price !== item.price && (
              <div className="text-sm text-gray-500">
                Sugerido: {formatCurrency(item.suggested_price)}
              </div>
            )}
          </div>
        </TableCell>
        <TableCell>
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
        {(onEdit || onDelete || onArchive || onRestore) && (
          <TableCell className="text-right">
            <div className="flex justify-end space-x-2">
              {/* Botão de impressão de etiqueta */}
              <PrintLabelButton item={item} />
              
              {onEdit && !showArchivedControls && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(item)}
                  className="h-8 w-8"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              
              {onArchive && !showArchivedControls && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onArchive(item.id)}
                  className="h-8 w-8 text-amber-600 hover:text-amber-800 hover:bg-amber-100"
                >
                  <Archive className="h-4 w-4" />
                </Button>
              )}
              
              {onRestore && showArchivedControls && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRestore(item.id)}
                  className="h-8 w-8 text-green-600 hover:text-green-800 hover:bg-green-100"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
              
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(item.id)}
                  className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-100"
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
    <div className="border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Foto</TableHead>
            <TableHead>SKU/Nome</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Fornecedor</TableHead>
            <TableHead className="text-right">Quantidade</TableHead>
            <TableHead className="text-right">Custo</TableHead>
            <TableHead className="text-right">Preço</TableHead>
            <TableHead>Status</TableHead>
            {(onEdit || onDelete || onArchive || onRestore) && <TableHead className="text-right">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRowWithPhotos key={item.id} item={item} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
