
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface InventoryLabelsFiltersProps {
  showPrinted: boolean;
  onShowPrintedChange: (value: boolean) => void;
}

export function InventoryLabelsFilters({
  showPrinted,
  onShowPrintedChange,
}: InventoryLabelsFiltersProps) {
  return (
    <div className="flex items-center space-x-4 bg-white p-4 rounded-lg shadow-sm">
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
