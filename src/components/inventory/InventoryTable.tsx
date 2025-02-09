
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { InventoryItem } from "@/models/inventoryModel";

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

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead className="text-right">Quantidade</TableHead>
            <TableHead className="text-right">Preço</TableHead>
            {(onEdit || onDelete) && <TableHead className="text-right">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.category}</TableCell>
              <TableCell className="text-right">{item.quantity}</TableCell>
              <TableCell className="text-right">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(item.price)}
              </TableCell>
              {(onEdit || onDelete) && (
                <TableCell className="text-right">
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
