
/**
 * Componente de Card de Item de Inventário
 * @file Exibe um card com informações de um item do inventário
 */
import { InventoryItem } from "@/types/inventory";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { 
  Package, 
  Pencil, 
  Trash, 
  AlertTriangle, 
  Archive, 
  RotateCcw, 
  Briefcase
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/utils/formatUtils";

interface InventoryItemCardProps {
  item: InventoryItem;
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  onArchive?: (item: InventoryItem) => void;
  onRestore?: (item: InventoryItem) => void;
  onAddToSuitcase?: (item: InventoryItem) => void;
  readOnly?: boolean;
  isInSearch?: boolean;
  suitcaseInfo?: any;
}

export function InventoryItemCard({
  item,
  onEdit,
  onDelete,
  onArchive,
  onRestore,
  onAddToSuitcase,
  readOnly = false,
  isInSearch = false,
  suitcaseInfo
}: InventoryItemCardProps) {
  // Encontrar a primeira foto ou undefined se não houver
  const firstPhoto = item.photos && item.photos.length > 0 
    ? (typeof item.photos[0] === 'object' && 'photo_url' in item.photos[0] 
      ? item.photos[0].photo_url 
      : undefined)
    : undefined;
  
  // Calcular a quantidade disponível (total - reservada)
  const quantityReserved = item.quantity_reserved || 0;
  const quantityAvailable = Math.max(0, item.quantity - quantityReserved);
  
  // Determinar se está com pouco estoque
  const isLowStock = quantityAvailable <= (item.min_stock || 0);
  
  return (
    <Card className={`overflow-hidden h-full transition-all duration-200 ${isInSearch ? 'border-blue-300 bg-blue-50' : ''}`}>
      <div className="relative">
        {/* Foto ou placeholder */}
        <div className="h-40 bg-gray-100 flex items-center justify-center relative">
          {firstPhoto ? (
            <img 
              src={firstPhoto} 
              alt={item.name}
              className="w-full h-full object-contain" 
            />
          ) : (
            <Package className="h-16 w-16 text-gray-300" />
          )}
          
          {/* Selo de arquivado */}
          {item.archived && (
            <div className="absolute top-0 right-0 bg-gray-800 text-white p-1 text-xs">
              Arquivado
            </div>
          )}
          
          {/* Selo de maleta */}
          {suitcaseInfo?.inSuitcase && (
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="bg-pink-100 text-pink-800 border border-pink-300">
                <Briefcase className="h-3 w-3 mr-1" />
                {suitcaseInfo.suitcase_code || "Maleta"}
              </Badge>
            </div>
          )}
        </div>
        
        {/* Badge de pouco estoque */}
        {isLowStock && (
          <div className="absolute bottom-0 left-0 right-0 bg-amber-500 text-white py-1 px-2 text-xs flex items-center">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Estoque Baixo
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <h3 className="font-medium text-sm line-clamp-2" title={item.name}>
              {item.name}
            </h3>
            <Badge variant="outline" className="text-xs">
              {item.sku || "Sem código"}
            </Badge>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {item.category_name || "Sem categoria"}
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-semibold text-primary">
              {formatMoney(item.price)}
            </span>
            <div className="text-xs font-medium">
              Custo: {formatMoney(item.unit_cost)}
            </div>
          </div>
          
          {/* Nova exibição de estoque com informações de reserva */}
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Estoque total:</span>
              <span className="font-medium">{item.quantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Reservado:</span>
              <span className="font-medium text-amber-600">{quantityReserved}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Disponível:</span>
              <span className={`font-medium ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                {quantityAvailable}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
      
      {!readOnly && (
        <CardFooter className="p-3 pt-0 flex justify-between gap-2">
          {item.archived ? (
            <>
              {onRestore && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1 flex-1" 
                  onClick={() => onRestore(item)}
                >
                  <RotateCcw className="h-3 w-3" />
                  Restaurar
                </Button>
              )}
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1 flex-1"
                onClick={() => onEdit(item)}
              >
                <Pencil className="h-3 w-3" />
                Editar
              </Button>
              
              {onArchive && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1 flex-1"
                  onClick={() => onArchive(item)}
                >
                  <Archive className="h-3 w-3" />
                  Arquivar
                </Button>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1 flex-1 text-red-600 hover:text-red-700"
                onClick={() => onDelete(item)}
              >
                <Trash className="h-3 w-3" />
                Excluir
              </Button>
            </>
          )}
        </CardFooter>
      )}
      
      {/* Botão de adicionar à maleta */}
      {isInSearch && onAddToSuitcase && quantityAvailable > 0 && !suitcaseInfo?.inSuitcase && (
        <div className="p-3 pt-0">
          <Button 
            variant="default" 
            size="sm" 
            className="w-full"
            onClick={() => onAddToSuitcase(item)}
          >
            <Briefcase className="h-3.5 w-3.5 mr-1" />
            Adicionar à Maleta
          </Button>
        </div>
      )}
      
      {/* Informação de maleta */}
      {isInSearch && suitcaseInfo?.inSuitcase && (
        <div className="p-3 pt-0">
          <div className="text-xs text-center text-muted-foreground bg-pink-50 p-2 rounded border border-pink-100">
            Este item já está na maleta <strong>{suitcaseInfo.suitcase_code}</strong>
            {suitcaseInfo.seller_name && <> de {suitcaseInfo.seller_name}</>}
          </div>
        </div>
      )}
    </Card>
  );
}
