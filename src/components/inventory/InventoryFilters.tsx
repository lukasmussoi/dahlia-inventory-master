
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
import { InventoryFilters as Filters, InventoryCategory } from "@/models/inventoryModel";

interface InventoryFiltersProps {
  categories: InventoryCategory[];
  onFilter: (filters: Filters) => void;
}

export function InventoryFilters({ categories, onFilter }: InventoryFiltersProps) {
  // Estado local para os filtros
  const [filters, setFilters] = useState<Filters>({
    search: '',
    category_id: undefined,
    min_price: undefined,
    max_price: undefined,
    status: undefined,
    minQuantity: undefined,
    maxQuantity: undefined,
    searchTerm: '',
    category: undefined,
    showArchived: false
  });

  // Atualizar filtros e notificar componente pai
  const updateFilters = (updates: Partial<Filters>) => {
    console.log("Atualizando filtros:", updates);
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  // Limpar todos os filtros
  const clearFilters = () => {
    console.log("Limpando todos os filtros");
    const clearedFilters: Filters = {
      search: '',
      category_id: undefined,
      min_price: undefined,
      max_price: undefined,
      status: undefined,
      minQuantity: undefined,
      maxQuantity: undefined,
      searchTerm: '',
      category: undefined,
      showArchived: false
    };
    setFilters(clearedFilters);
    onFilter(clearedFilters);
  };

  const statusOptions = [
    { value: "all", label: "Todos" },
    { value: "in_stock", label: "Em estoque" },
    { value: "out_of_stock", label: "Sem estoque" },
    { value: "low_stock", label: "Estoque baixo" },
    { value: "archived", label: "Arquivados" }
  ];

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Busca por texto */}
        <div className="space-y-2">
          <Label>Buscar</Label>
          <Input
            type="text"
            placeholder="Nome ou código..."
            value={filters.search || ''}
            onChange={(e) => updateFilters({ 
              search: e.target.value, 
              searchTerm: e.target.value
            })}
          />
        </div>

        {/* Filtro por categoria */}
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select
            value={filters.category_id || ''}
            onValueChange={(value) => updateFilters({ 
              category_id: value === 'all' ? undefined : value,
              category: value === 'all' ? undefined : value
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas as categorias" />
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

        {/* Filtro por quantidade */}
        <div className="space-y-2">
          <Label>Quantidade</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Mín"
              min={0}
              value={filters.minQuantity ?? ''}
              onChange={(e) => updateFilters({ 
                minQuantity: e.target.value ? Number(e.target.value) : undefined 
              })}
            />
            <Input
              type="number"
              placeholder="Máx"
              min={0}
              value={filters.maxQuantity ?? ''}
              onChange={(e) => updateFilters({ 
                maxQuantity: e.target.value ? Number(e.target.value) : undefined 
              })}
            />
          </div>
        </div>

        {/* Filtro por status */}
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={filters.status || ''}
            onValueChange={(value) => {
              if (value === 'archived') {
                console.log("Selecionando visualização de itens arquivados");
                updateFilters({ 
                  status: value, 
                  showArchived: true 
                });
              } else {
                console.log("Selecionando outro status (não arquivados):", value);
                updateFilters({ 
                  status: value === 'all' ? undefined : value,
                  showArchived: false 
                });
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
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
