
/**
 * Componente de Card de Item Selecionado
 * @file Exibe um item selecionado para abastecimento de maleta, com controles de quantidade
 * @relacionamento Utilizado pelo componente SuitcaseSupplyDialog
 */
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MinusCircle, PlusCircle, X } from "lucide-react";

interface SelectedItemCardProps {
  item: {
    id: string;
    name: string;
    sku: string;
    price: number;
    quantity: number;
    max_quantity?: number;
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
  // Extrair a URL da foto do item
  const getPhotoUrl = () => {
    if (!item.photo_url) return null;
    
    if (typeof item.photo_url === 'string') {
      return item.photo_url;
    }
    
    if (Array.isArray(item.photo_url)) {
      return item.photo_url[0]?.photo_url || null;
    }
    
    return (item.photo_url as { photo_url: string }).photo_url || null;
  };

  const photoUrl = getPhotoUrl();
  const totalPrice = item.price * item.quantity;
  const isFromSuitcase = item.from_suitcase || false;

  // Função para lidar com cliques nos botões que não devem propagar o evento
  const handleButtonClick = (callback: Function) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    callback();
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          {/* Miniatura do produto (substituída a implementação do next/image) */}
          <div className="flex-shrink-0 h-14 w-14 relative rounded bg-gray-50 overflow-hidden border">
            {photoUrl ? (
              <div 
                className="h-full w-full bg-center bg-no-repeat bg-contain" 
                style={{ backgroundImage: `url(${photoUrl})` }}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400">
                Sem imagem
              </div>
            )}
          </div>
          
          {/* Informações do produto */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{item.name}</h4>
            <p className="text-xs text-gray-500">{item.sku}</p>
            
            <div className="flex items-center justify-between mt-1">
              <div className="text-sm font-semibold text-primary">
                {formatMoney(item.price)}
              </div>
              
              {isFromSuitcase && (
                <Badge variant="outline" className="text-xs">
                  Já na maleta
                </Badge>
              )}
            </div>
          </div>
          
          {/* Controles de quantidade */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleButtonClick(() => onDecrease(item.id))}
              disabled={item.quantity <= 1}
            >
              <MinusCircle className="h-4 w-4" />
            </Button>
            
            <span className="mx-1 w-6 text-center">
              {item.quantity}
            </span>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleButtonClick(() => onIncrease(item.id))}
              disabled={!isFromSuitcase && item.max_quantity !== undefined && item.quantity >= item.max_quantity}
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Botão remover */}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-400 hover:text-red-500"
            onClick={handleButtonClick(() => onRemove(item.id))}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
