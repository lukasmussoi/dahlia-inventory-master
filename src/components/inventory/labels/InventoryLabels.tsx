
import { useState, useEffect } from "react";
import { InventoryLabelsFilters } from "./InventoryLabelsFilters";
import { InventoryLabelsList } from "./InventoryLabelsList";
import { Button } from "@/components/ui/button";
import { PrinterIcon, SettingsIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { InventoryModel, InventoryItem } from "@/models/inventoryModel";
import { LabelModel, LabelHistory } from "@/models/labelModel";

export function InventoryLabels() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showPrinted, setShowPrinted] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const navigate = useNavigate();

  // Buscar todos os itens do inventário
  const { data: items = [], isLoading: isLoadingItems } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: async () => {
      try {
        console.log('Buscando itens do inventário para etiquetas...');
        return await InventoryModel.getAllItems();
      } catch (error) {
        console.error('Erro ao buscar itens do inventário:', error);
        toast.error('Erro ao carregar itens do inventário');
        return [];
      }
    }
  });

  // Buscar histórico de impressão de etiquetas
  const { data: labelHistory = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['label-history'],
    queryFn: async () => {
      try {
        console.log('Buscando histórico de etiquetas...');
        return await LabelModel.getAllLabelHistory();
      } catch (error) {
        console.error('Erro ao buscar histórico de etiquetas:', error);
        toast.error('Erro ao carregar histórico de etiquetas');
        return [];
      }
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

  const handlePrintLabel = async (itemId: string) => {
    try {
      toast.info(`Preparando impressão para item ${itemId}`);
      
      // Registrar impressão no histórico
      await LabelModel.registerLabelPrint(itemId, 1);
      
      // Recarregar histórico de etiquetas
      // Aqui você pode adicionar a lógica para a impressão física da etiqueta
      toast.success('Etiqueta enviada para impressão com sucesso!');
    } catch (error) {
      console.error('Erro ao imprimir etiqueta:', error);
      toast.error('Erro ao processar impressão da etiqueta');
    }
  };

  const handlePrintSelected = async () => {
    if (selectedItems.length === 0) {
      toast.warning("Nenhum item selecionado para impressão");
      return;
    }
    
    try {
      toast.info(`Preparando impressão para ${selectedItems.length} item(s)`);
      
      // Registrar impressão para cada item selecionado
      for (const itemId of selectedItems) {
        await LabelModel.registerLabelPrint(itemId, 1);
      }
      
      // Recarregar histórico de etiquetas
      // Aqui você pode adicionar a lógica para a impressão física das etiquetas em massa
      toast.success('Etiquetas enviadas para impressão com sucesso!');
      
      // Limpar seleção após impressão
      setSelectedItems([]);
    } catch (error) {
      console.error('Erro ao imprimir etiquetas em massa:', error);
      toast.error('Erro ao processar impressão das etiquetas');
    }
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
