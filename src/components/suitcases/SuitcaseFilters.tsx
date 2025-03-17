
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Search, FilterX } from "lucide-react";

interface SuitcaseFiltersProps {
  filters: {
    search: string;
    status: string;
    city: string;
    neighborhood: string;
  };
  onSearch: (filters: any) => void;
  onClear: () => void;
}

export function SuitcaseFilters({ filters, onSearch, onClear }: SuitcaseFiltersProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleChange = (field: string, value: string) => {
    setLocalFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    onSearch(localFilters);
  };

  const handleClear = () => {
    setLocalFilters({
      search: "",
      status: "todos",
      city: "",
      neighborhood: ""
    });
    onClear();
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="col-span-1 lg:col-span-2">
          <Input
            placeholder="Buscar por código ou revendedora..."
            value={localFilters.search}
            onChange={(e) => handleChange('search', e.target.value)}
          />
        </div>

        <div>
          <Select
            value={localFilters.status}
            onValueChange={(value) => handleChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="in_use">Em Uso</SelectItem>
              <SelectItem value="returned">Devolvida</SelectItem>
              <SelectItem value="in_replenishment">Aguardando Reposição</SelectItem>
              <SelectItem value="lost">Perdida</SelectItem>
              <SelectItem value="in_audit">Em Auditoria</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Input
            placeholder="Cidade"
            value={localFilters.city}
            onChange={(e) => handleChange('city', e.target.value)}
          />
        </div>

        <div>
          <Input
            placeholder="Bairro"
            value={localFilters.neighborhood}
            onChange={(e) => handleChange('neighborhood', e.target.value)}
          />
        </div>

        <div className="flex gap-2 lg:col-span-5 md:justify-end">
          <Button onClick={handleSearch} className="flex-1 md:flex-none">
            <Search className="h-4 w-4 mr-2" />
            Buscar
          </Button>
          <Button variant="outline" onClick={handleClear}>
            <FilterX className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        </div>
      </div>
    </div>
  );
}
