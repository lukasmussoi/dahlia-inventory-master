
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface InventoryLabelsFiltersProps {
  showPrinted: boolean;
  onShowPrintedChange: (value: boolean) => void;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  categoryFilter?: string;
  onCategoryFilterChange?: (value: string) => void;
  categories?: Array<{ id: string; name: string }>;
}

export function InventoryLabelsFilters({
  showPrinted,
  onShowPrintedChange,
  searchTerm = "",
  onSearchChange,
  categoryFilter = "all",
  onCategoryFilterChange,
  categories = [],
}: InventoryLabelsFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
      <div className="flex items-center space-x-2 w-full md:w-auto">
        <Switch
          id="show-printed"
          checked={showPrinted}
          onCheckedChange={onShowPrintedChange}
        />
        <Label htmlFor="show-printed">Mostrar apenas itens com etiquetas impressas</Label>
      </div>
      
      {onSearchChange && (
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, SKU..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {onCategoryFilterChange && categories.length > 0 && (
        <div className="w-full md:w-72">
          <Select 
            value={categoryFilter} 
            onValueChange={onCategoryFilterChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
