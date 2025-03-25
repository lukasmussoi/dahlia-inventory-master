
/**
 * Componente de Item Selecionado para Abastecimento
 * @file Este componente renderiza um item selecionado para abastecimento com controles de quantidade
 * @relacionamento Utilizado pelo componente SuitcaseSupplyDialog
 */
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Minus, Plus, X } from "lucide-react";
import { ItemImage } from "./ItemImage";

interface SelectedItemCardProps {
  item: {
    id: string;
    name: string;
    sku: string;
    price: number;
    quantity: number;
    photo_url?: string | { photo_url: string }[];
    from_suitcase?: boolean;
  };
  onRemove: (id: string) => void;
  onIncrease: (id: string) => void;
  onDecrease: (id: string) => void;
  formatMoney: (value: number) => string;
}

export function SelectedItemCard({ 
  item, 
  onRemove, 
  onIncrease, 
  onDecrease,
  formatMoney
}: SelectedItemCardProps) {
  const totalPrice = item.price * item.quantity;
  
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
              <p className="text-xs text-gray-600">
                {formatMoney(item.price)} x {item.quantity} = {formatMoney(totalPrice)}
              </p>
              {item.from_suitcase && (
                <span className="text-xs font-medium text-blue-600">
                  Já na maleta
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center shrink-0 ml-2">
            <Button
              size="icon"
              variant="outline"
              onClick={() => onDecrease(item.id)}
              disabled={item.quantity <= 1}
              className="h-8 w-8"
              aria-label="Diminuir quantidade"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center text-sm">{item.quantity}</span>
            <Button
              size="icon"
              variant="outline"
              onClick={() => onIncrease(item.id)}
              className="h-8 w-8"
              aria-label="Aumentar quantidade"
            >
              <Plus className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onRemove(item.id)}
              className="h-8 w-8 ml-2"
              aria-label="Remover item"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
