
/**
 * Componente de Detalhes de Item do Inventário
 * @file Exibe detalhes completos de um item do inventário
 */
import { InventoryItem } from "@/types/inventory";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/utils/formatUtils";
import { Package, AlertTriangle } from "lucide-react";

interface InventoryItemDetailsProps {
  item: InventoryItem;
}

export function InventoryItemDetails({ item }: InventoryItemDetailsProps) {
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
    <Card>
      <CardContent className="p-6 space-y-6">
        {/* Cabeçalho com foto */}
        <div className="flex gap-6">
          {/* Foto ou placeholder */}
          <div className="w-32 h-32 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
            {firstPhoto ? (
              <img 
                src={firstPhoto} 
                alt={item.name}
                className="w-full h-full object-contain" 
              />
            ) : (
              <Package className="h-16 w-16 text-gray-300" />
            )}
          </div>
          
          {/* Informações principais */}
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-medium">{item.name}</h2>
              <Badge variant="outline">{item.sku || "Sem código"}</Badge>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Categoria: {item.category_name || "Sem categoria"}
              {item.supplier_name && <> • Fornecedor: {item.supplier_name}</>}
            </div>
            
            <div className="flex gap-4 mt-4">
              <div>
                <div className="text-sm text-muted-foreground">Preço de Venda</div>
                <div className="text-lg font-medium">{formatMoney(item.price)}</div>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground">Custo Unitário</div>
                <div className="text-lg font-medium">{formatMoney(item.unit_cost)}</div>
              </div>
              
              {item.raw_cost !== undefined && (
                <div>
                  <div className="text-sm text-muted-foreground">Custo do Bruto</div>
                  <div className="text-lg font-medium">{formatMoney(item.raw_cost)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Seção de estoque */}
        <div className="grid grid-cols-3 gap-4">
          {/* Total em estoque */}
          <Card className="overflow-hidden">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Estoque Total</div>
              <div className="text-2xl font-semibold mt-1">{item.quantity}</div>
              <div className="text-xs text-muted-foreground mt-2">
                Mínimo: {item.min_stock || 0} unidades
              </div>
            </CardContent>
          </Card>
          
          {/* Quantidade reservada */}
          <Card className="overflow-hidden">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Reservado</div>
              <div className="text-2xl font-semibold mt-1 text-amber-600">{quantityReserved}</div>
              <div className="text-xs text-muted-foreground mt-2">
                Em maletas de revendedoras
              </div>
            </CardContent>
          </Card>
          
          {/* Quantidade disponível */}
          <Card className="overflow-hidden">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Disponível</div>
              <div className={`text-2xl font-semibold mt-1 ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                {quantityAvailable}
              </div>
              {isLowStock && (
                <div className="text-xs text-amber-600 mt-2 flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Estoque baixo
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Detalhes adicionais */}
        <div className="grid grid-cols-2 gap-6">
          {/* Informações físicas */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Informações Físicas</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {item.weight && (
                <div>
                  <div className="text-muted-foreground">Peso</div>
                  <div>{item.weight}g</div>
                </div>
              )}
              
              {item.material_weight && (
                <div>
                  <div className="text-muted-foreground">Peso do Material</div>
                  <div>{item.material_weight}g</div>
                </div>
              )}
              
              {item.width && (
                <div>
                  <div className="text-muted-foreground">Largura</div>
                  <div>{item.width}mm</div>
                </div>
              )}
              
              {item.height && (
                <div>
                  <div className="text-muted-foreground">Altura</div>
                  <div>{item.height}mm</div>
                </div>
              )}
              
              {item.depth && (
                <div>
                  <div className="text-muted-foreground">Profundidade</div>
                  <div>{item.depth}mm</div>
                </div>
              )}
            </div>
          </div>
          
          {/* Informações comerciais */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Informações Comerciais</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {item.suggested_price !== undefined && (
                <div>
                  <div className="text-muted-foreground">Preço Sugerido</div>
                  <div>{formatMoney(item.suggested_price)}</div>
                </div>
              )}
              
              {item.reseller_commission !== undefined && (
                <div>
                  <div className="text-muted-foreground">Comissão</div>
                  <div>{(item.reseller_commission * 100).toFixed(0)}%</div>
                </div>
              )}
              
              {item.markup_percentage !== undefined && (
                <div>
                  <div className="text-muted-foreground">Markup</div>
                  <div>{item.markup_percentage.toFixed(0)}%</div>
                </div>
              )}
              
              {item.packaging_cost !== undefined && (
                <div>
                  <div className="text-muted-foreground">Custo de Embalagem</div>
                  <div>{formatMoney(item.packaging_cost)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
