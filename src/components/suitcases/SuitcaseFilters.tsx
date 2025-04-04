
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { SuitcaseFilters as SuitcaseFiltersType } from "@/types/suitcase";

// Atualizar a interface para usar onFiltersChange
interface SuitcaseFiltersProps {
  filters: SuitcaseFiltersType;
  onFiltersChange: (filters: SuitcaseFiltersType) => void;
}

export function SuitcaseFilters({ 
  filters,
  onFiltersChange
}: SuitcaseFiltersProps) {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [status, setStatus] = useState(filters.status || 'todos');

  // Atualizar valores quando os filtros mudam
  useEffect(() => {
    setSearchTerm(filters.search || '');
    setStatus(filters.status || 'todos');
  }, [filters]);

  // Aplicar filtros
  const handleApplyFilters = () => {
    onFiltersChange({
      ...filters,
      search: searchTerm,
      status: status
    });
  };

  // Limpar filtros
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatus('todos');
    onFiltersChange({
      search: '',
      status: 'todos'
    });
  };

  // Pesquisar ao pressionar Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyFilters();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="relative flex-1">
        <Input
          type="text"
          placeholder="Buscar por nome ou código..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>
      
      <div className="w-full sm:w-64">
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value);
            // Aplicar filtro imediatamente ao mudar o status
            onFiltersChange({
              ...filters,
              search: searchTerm,
              status: value
            });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="in_use">Em uso</SelectItem>
            <SelectItem value="returned">Devolvida</SelectItem>
            <SelectItem value="in_replenishment">Aguardando Reposição</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleApplyFilters}>
          <Search className="h-4 w-4 mr-2" />
          Buscar
        </Button>
        
        <Button variant="ghost" onClick={handleClearFilters}>
          <X className="h-4 w-4 mr-2" />
          Limpar
        </Button>
      </div>
    </div>
  );
}
