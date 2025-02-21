
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { LabelHistory } from "@/models/labelModel";
import { InventoryItem } from "@/models/inventoryModel";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface InventoryLabelsListProps {
  items: InventoryItem[];
  isLoading: boolean;
  selectedItems: string[];
  onSelectedItemsChange: (items: string[]) => void;
  onPrintLabel: (itemId: string) => void;
  labelHistory: LabelHistory[];
}

export function InventoryLabelsList({
  items,
  isLoading,
  selectedItems,
  onSelectedItemsChange,
  onPrintLabel,
  labelHistory,
}: InventoryLabelsListProps) {
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

  const getLastPrintedDate = (itemId: string) => {
    const lastPrint = labelHistory
      .filter(history => history.inventory_id === itemId)
      .sort((a, b) => new Date(b.printed_at || '').getTime() - new Date(a.printed_at || '').getTime())
      [0];

    return lastPrint
      ? format(new Date(lastPrint.printed_at || ''), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
      : "Nunca impresso";
  };

  const getTotalPrinted = (itemId: string) => {
    return labelHistory
      .filter(history => history.inventory_id === itemId)
      .reduce((sum, history) => sum + history.quantity, 0);
  };

  const handleSelectAll = (checked: boolean) => {
    onSelectedItemsChange(checked ? items.map(item => item.id) : []);
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelection = selectedItems.includes(itemId)
      ? selectedItems.filter(id => id !== itemId)
      : [...selectedItems, itemId];
    onSelectedItemsChange(newSelection);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={items.length > 0 && selectedItems.length === items.length}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>Nome/SKU</TableHead>
            <TableHead>Última Impressão</TableHead>
            <TableHead>Total Impresso</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Checkbox
                  checked={selectedItems.includes(item.id)}
                  onCheckedChange={() => toggleItemSelection(item.id)}
                />
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-500">{item.sku}</div>
                </div>
              </TableCell>
              <TableCell>{getLastPrintedDate(item.id)}</TableCell>
              <TableCell>{getTotalPrinted(item.id)}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onPrintLabel(item.id)}
                  className="hover:bg-gray-100"
                >
                  <Printer className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
