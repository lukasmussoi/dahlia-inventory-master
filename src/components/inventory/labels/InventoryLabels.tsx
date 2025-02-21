
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { InventoryModel } from "@/models/inventoryModel";
import { LabelModel } from "@/models/labelModel";
import { Printer, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { InventoryLabelsList } from "./InventoryLabelsList";
import { InventoryLabelsFilters } from "./InventoryLabelsFilters";

export function InventoryLabels() {
  const [showPrinted, setShowPrinted] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const { data: items, isLoading } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: () => InventoryModel.getAllItems(),
  });

  const { data: labelHistory } = useQuery({
    queryKey: ['label-history'],
    queryFn: () => LabelModel.getAllLabelHistory(),
  });

  const handlePrintLabels = async (itemIds: string[]) => {
    try {
      // TODO: Implementar a lógica de impressão real aqui
      for (const itemId of itemIds) {
        await LabelModel.registerLabelPrint(itemId);
      }
      toast.success("Etiquetas enviadas para impressão com sucesso!");
      setSelectedItems([]); // Limpa a seleção após imprimir
    } catch (error) {
      console.error("Erro ao imprimir etiquetas:", error);
      toast.error("Erro ao imprimir etiquetas");
    }
  };

  const filteredItems = items?.filter(item => {
    if (!showPrinted) return true;
    return labelHistory?.some(history => history.inventory_id === item.id);
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Etiquetas de Produtos</h1>
        {selectedItems.length > 0 && (
          <Button
            onClick={() => handlePrintLabels(selectedItems)}
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Imprimir Selecionados ({selectedItems.length})
          </Button>
        )}
      </div>

      <InventoryLabelsFilters
        showPrinted={showPrinted}
        onShowPrintedChange={setShowPrinted}
      />

      <InventoryLabelsList
        items={filteredItems || []}
        isLoading={isLoading}
        selectedItems={selectedItems}
        onSelectedItemsChange={setSelectedItems}
        onPrintLabel={(itemId) => handlePrintLabels([itemId])}
        labelHistory={labelHistory || []}
      />
    </div>
  );
}
