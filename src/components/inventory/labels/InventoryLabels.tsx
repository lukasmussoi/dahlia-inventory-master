
import { useState } from "react";
import { InventoryLabelsFilters } from "./InventoryLabelsFilters";
import { InventoryLabelsList } from "./InventoryLabelsList";
import { Button } from "@/components/ui/button";
import { PrinterIcon, SettingsIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function InventoryLabels() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const navigate = useNavigate();

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
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
          <Button disabled className="flex items-center gap-2">
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
      />

      <InventoryLabelsList
        searchTerm={searchTerm}
        categoryId={categoryFilter}
      />
    </div>
  );
}
