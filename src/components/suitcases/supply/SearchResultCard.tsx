
/**
 * Componente de Resultado de Busca para Abastecimento
 * @file Este componente renderiza um item encontrado na busca para ser adicionado à maleta
 * @relacionamento Utilizado pelo componente SuitcaseSupplyDialog
 */
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { ItemImage } from "./ItemImage";

interface SearchResultCardProps {
  item: {
    id: string;
    name: string;
    sku: string;
    price: number;
    quantity: number;
    photo_url?: string | { photo_url: string }[];
  };
  onAdd: (item: any) => void;
  formatMoney: (value: number) => string;
}

export function SearchResultCard({ item, onAdd, formatMoney }: SearchResultCardProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <ItemImage 
              photoUrl={item.photo_url} 
              alt={item.name}
              className="h-10 w-10"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium truncate">{item.name}</h4>
              <p className="text-xs text-gray-500">{item.sku}</p>
              <p className="text-xs text-gray-500">Estoque: {item.quantity}</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <p className="text-sm font-medium text-pink-600">
              {formatMoney(item.price)}
            </p>
            <Button
              size="sm"
              onClick={() => onAdd(item)}
              className="h-8"
              aria-label="Adicionar item"
            >
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
