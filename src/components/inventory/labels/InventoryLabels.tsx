
import { useState, useEffect } from "react";
import { InventoryLabelsFilters } from "./InventoryLabelsFilters";
import { InventoryLabelsList } from "./InventoryLabelsList";
import { Button } from "@/components/ui/button";
import { PrinterIcon, SettingsIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { InventoryItem } from "@/models/inventoryModel";
import { LabelHistory } from "@/models/labelModel";

export function InventoryLabels() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showPrinted, setShowPrinted] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const navigate = useNavigate();

  // Simulate fetching items - replace with actual API calls when ready
  const { data: items = [], isLoading: isLoadingItems } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: async () => {
      // Mock data - Replace with actual API call
      return [
        { id: '1', name: 'Brinco Floral', sku: 'BR001', category_id: '1' },
        { id: '2', name: 'Colar Delicado', sku: 'CO001', category_id: '2' },
        { id: '3', name: 'Pulseira Dourada', sku: 'PU001', category_id: '3' }
      ] as InventoryItem[];
    }
  });

  // Simulate fetching label history - replace with actual API calls when ready
  const { data: labelHistory = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['label-history'],
    queryFn: async () => {
      // Mock data - Replace with actual API call
      return [
        { id: '1', inventory_id: '1', quantity: 5, printed_at: '2023-05-10T14:30:00Z' },
        { id: '2', inventory_id: '2', quantity: 3, printed_at: '2023-05-11T09:15:00Z' }
      ] as LabelHistory[];
    }
  });

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
  };

  const handleShowPrintedChange = (value: boolean) => {
    setShowPrinted(value);
  };

  const handleSelectedItemsChange = (items: string[]) => {
    setSelectedItems(items);
  };

  const handlePrintLabel = (itemId: string) => {
    toast.info(`Preparando impressão para item ${itemId}`);
    // Implementar lógica de impressão
  };

  const handlePrintSelected = () => {
    if (selectedItems.length === 0) {
      toast.warning("Nenhum item selecionado para impressão");
      return;
    }
    
    toast.info(`Preparando impressão para ${selectedItems.length} item(s)`);
    // Implementar lógica de impressão em massa
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Etiquetas</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => navigate('/dashboard/inventory/etiquetas-custom')}
          >
            <SettingsIcon className="h-4 w-4" />
            Etiquetas Customizadas
          </Button>
          <Button 
            disabled={selectedItems.length === 0} 
            className="flex items-center gap-2"
            onClick={handlePrintSelected}
          >
            <PrinterIcon className="h-4 w-4" />
            Imprimir Selecionadas
          </Button>
        </div>
      </div>

      <InventoryLabelsFilters
        searchTerm={searchTerm}
        categoryId={categoryFilter}
        onSearchChange={handleSearchChange}
        onCategoryChange={handleCategoryChange}
        showPrinted={showPrinted}
        onShowPrintedChange={handleShowPrintedChange}
      />

      <InventoryLabelsList
        items={items}
        isLoading={isLoadingItems || isLoadingHistory}
        selectedItems={selectedItems}
        onSelectedItemsChange={handleSelectedItemsChange}
        onPrintLabel={handlePrintLabel}
        labelHistory={labelHistory}
        searchTerm={searchTerm}
        categoryId={categoryFilter}
      />
    </div>
  );
}
