
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InventoryLabelsFiltersProps {
  showPrinted: boolean;
  onShowPrintedChange: (value: boolean) => void;
  searchTerm: string;
  categoryId: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
}

export function InventoryLabelsFilters({
  showPrinted,
  onShowPrintedChange,
  searchTerm,
  categoryId,
  onSearchChange,
  onCategoryChange,
}: InventoryLabelsFiltersProps) {
  return (
    <div className="flex flex-col gap-4 bg-white p-4 rounded-lg shadow-sm">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Buscar por nome ou SKU"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        <Select value={categoryId} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas as categorias</SelectItem>
            <SelectItem value="1">Brincos</SelectItem>
            <SelectItem value="2">Colares</SelectItem>
            <SelectItem value="3">Pulseiras</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="show-printed"
          checked={showPrinted}
          onCheckedChange={onShowPrintedChange}
        />
        <Label htmlFor="show-printed">Mostrar apenas itens com etiquetas impressas</Label>
      </div>
    </div>
  );
}
