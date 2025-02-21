
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { InventoryModel } from "@/models/inventoryModel";
import { LabelModel } from "@/models/labelModel";
import { Printer, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { InventoryLabelsList } from "./InventoryLabelsList";
import { InventoryLabelsFilters } from "./InventoryLabelsFilters";
import { generatePPLACommands, sendToPrinter } from "@/utils/printerUtils";

export function InventoryLabels() {
  const [showPrinted, setShowPrinted] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);

  const { data: items, isLoading } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: () => InventoryModel.getAllItems(),
  });

  const { data: labelHistory } = useQuery({
    queryKey: ['label-history'],
    queryFn: () => LabelModel.getAllLabelHistory(),
  });

  const handlePrintLabels = async (itemIds: string[]) => {
    setIsPrinting(true);
    try {
      // Para cada item selecionado
      for (const itemId of itemIds) {
        const item = items?.find(i => i.id === itemId);
        if (!item) continue;

        // Gera os comandos PPLA para o item
        const commands = generatePPLACommands(item);

        // Envia para a impressora
        await sendToPrinter(commands);

        // Registra a impressão no histórico
        await LabelModel.registerLabelPrint(itemId);
      }

      toast.success("Etiquetas impressas com sucesso!");
      setSelectedItems([]); // Limpa a seleção após imprimir
    } catch (error) {
      console.error("Erro ao imprimir etiquetas:", error);
      toast.error("Erro ao imprimir etiquetas. Verifique a conexão com a impressora.");
    } finally {
      setIsPrinting(false);
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
            disabled={isPrinting}
          >
            <Printer className="h-4 w-4" />
            {isPrinting 
              ? "Imprimindo..." 
              : `Imprimir Selecionados (${selectedItems.length})`
            }
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
