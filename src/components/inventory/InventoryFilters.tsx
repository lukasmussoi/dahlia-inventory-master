
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InventoryFilters as Filters } from "@/models/inventoryModel";

interface InventoryFiltersProps {
  categories: string[];
  onFilter: (filters: Filters) => void;
}

export function InventoryFilters({ categories, onFilter }: InventoryFiltersProps) {
  // Estado local para os filtros
  const [filters, setFilters] = useState<Filters>({
    searchTerm: '',
    category: undefined,
    minQuantity: undefined,
    maxQuantity: undefined,
    status: undefined,
  });

  // Atualizar filtros e notificar componente pai
  const updateFilters = (updates: Partial<Filters>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  // Limpar todos os filtros
  const clearFilters = () => {
    const clearedFilters = {
      searchTerm: '',
      category: undefined,
      minQuantity: undefined,
      maxQuantity: undefined,
      status: undefined,
    };
    setFilters(clearedFilters);
    onFilter(clearedFilters);
  };

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Busca por texto */}
        <div className="space-y-2">
          <Label>Buscar</Label>
          <Input
            type="text"
            placeholder="Nome ou categoria..."
            value={filters.searchTerm || ''}
            onChange={(e) => updateFilters({ searchTerm: e.target.value })}
          />
        </div>

        {/* Filtro por categoria */}
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select
            value={filters.category}
            onValueChange={(value) => updateFilters({ category: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas as categorias</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtro por quantidade */}
        <div className="space-y-2">
          <Label>Quantidade</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Mín"
              min={0}
              value={filters.minQuantity || ''}
              onChange={(e) => updateFilters({ minQuantity: e.target.value ? Number(e.target.value) : undefined })}
            />
            <Input
              type="number"
              placeholder="Máx"
              min={0}
              value={filters.maxQuantity || ''}
              onChange={(e) => updateFilters({ maxQuantity: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
        </div>

        {/* Filtro por status */}
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={filters.status}
            onValueChange={(value: 'available' | 'out_of_stock' | undefined) => 
              updateFilters({ status: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os status</SelectItem>
              <SelectItem value="available">Disponível</SelectItem>
              <SelectItem value="out_of_stock">Em falta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Botão para limpar filtros */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={clearFilters}
          className="hover:bg-gray-100"
        >
          Limpar Filtros
        </Button>
      </div>
    </div>
  );
}
