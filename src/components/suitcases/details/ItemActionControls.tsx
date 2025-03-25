
/**
 * Componente para Controles de Ação de Itens
 * @file Componente que exibe controles para devolver itens ao estoque ou marcá-los como danificados
 * @relacionamento Utilizado no componente SuitcaseItems para gerenciar ações em itens agrupados
 */
import { useState } from "react";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowDownToLine, 
  AlertTriangle, 
  Check,
  X
} from "lucide-react";
import { toast } from "sonner";
import { GroupedSuitcaseItem } from "@/types/suitcase";

interface ItemActionControlsProps {
  groupedItem: GroupedSuitcaseItem;
  onReturnToInventory: (itemIds: string[], quantity: number, isDamaged: boolean) => Promise<void>;
}

export function ItemActionControls({ 
  groupedItem, 
  onReturnToInventory 
}: ItemActionControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [returnQuantity, setReturnQuantity] = useState(0);
  const [damageQuantity, setDamageQuantity] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reseta o estado quando o popover é fechado
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setReturnQuantity(0);
      setDamageQuantity(0);
    }
    setIsOpen(open);
  };

  // Valida as quantidades inseridas
  const validateQuantities = () => {
    const totalSelected = returnQuantity + damageQuantity;
    
    if (totalSelected === 0) {
      toast.error("Selecione pelo menos uma unidade para devolver ou marcar como danificada");
      return false;
    }
    
    if (totalSelected > groupedItem.total_quantity) {
      toast.error(`Você não pode selecionar mais de ${groupedItem.total_quantity} unidades`);
      return false;
    }
    
    return true;
  };

  // Processa as ações de devolução e/ou dano
  const handleSubmit = async () => {
    if (!validateQuantities()) return;
    
    setIsSubmitting(true);
    try {
      // Processar devolução ao estoque
      if (returnQuantity > 0) {
        // Pegar os IDs dos primeiros 'returnQuantity' itens para devolver
        const itemsToReturn = groupedItem.items.slice(0, returnQuantity);
        await onReturnToInventory(
          itemsToReturn.map(item => item.id), 
          returnQuantity, 
          false
        );
      }
      
      // Processar itens danificados
      if (damageQuantity > 0) {
        // Pegar os próximos 'damageQuantity' itens após os já retornados
        const itemsToDamage = groupedItem.items.slice(returnQuantity, returnQuantity + damageQuantity);
        await onReturnToInventory(
          itemsToDamage.map(item => item.id), 
          damageQuantity, 
          true
        );
      }
      
      // Fechar popover
      setIsOpen(false);
      toast.success(`${returnQuantity + damageQuantity} itens processados com sucesso`);
      
    } catch (error) {
      console.error("Erro ao processar itens:", error);
      toast.error("Erro ao processar itens. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="px-2 h-8 border-dashed"
        >
          <ArrowDownToLine className="h-4 w-4 mr-1" />
          Ações
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4">
        <h4 className="font-medium mb-2">Ações para {groupedItem.product_name}</h4>
        <p className="text-sm text-muted-foreground mb-3">
          Total disponível: {groupedItem.total_quantity} unidades
        </p>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-start">
              <Checkbox 
                id={`return-${groupedItem.product_id}`}
                checked={returnQuantity > 0}
                onCheckedChange={(checked) => 
                  setReturnQuantity(checked ? 1 : 0)
                }
              />
              <div className="ml-2">
                <Label 
                  htmlFor={`return-${groupedItem.product_id}`}
                  className="text-sm font-medium"
                >
                  Devolver ao Estoque
                </Label>
                <p className="text-xs text-muted-foreground">
                  Enviar unidades de volta ao estoque
                </p>
              </div>
            </div>
            
            {returnQuantity > 0 && (
              <div className="pl-6">
                <Label htmlFor={`return-qty-${groupedItem.product_id}`} className="text-xs">
                  Quantidade a devolver
                </Label>
                <Input
                  id={`return-qty-${groupedItem.product_id}`}
                  type="number"
                  min={1}
                  max={groupedItem.total_quantity}
                  value={returnQuantity}
                  onChange={(e) => setReturnQuantity(parseInt(e.target.value) || 0)}
                  className="h-8 mt-1"
                />
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-start">
              <Checkbox 
                id={`damage-${groupedItem.product_id}`}
                checked={damageQuantity > 0}
                onCheckedChange={(checked) => 
                  setDamageQuantity(checked ? 1 : 0)
                }
              />
              <div className="ml-2">
                <Label 
                  htmlFor={`damage-${groupedItem.product_id}`}
                  className="text-sm font-medium flex items-center"
                >
                  Marcar como Danificado
                  <AlertTriangle className="h-3 w-3 ml-1 text-amber-500" />
                </Label>
                <p className="text-xs text-muted-foreground">
                  Peças com defeito ou danificadas
                </p>
              </div>
            </div>
            
            {damageQuantity > 0 && (
              <div className="pl-6">
                <Label htmlFor={`damage-qty-${groupedItem.product_id}`} className="text-xs">
                  Quantidade danificada
                </Label>
                <Input
                  id={`damage-qty-${groupedItem.product_id}`}
                  type="number"
                  min={1}
                  max={groupedItem.total_quantity}
                  value={damageQuantity}
                  onChange={(e) => setDamageQuantity(parseInt(e.target.value) || 0)}
                  className="h-8 mt-1"
                />
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting || (returnQuantity + damageQuantity === 0)}
            >
              {isSubmitting ? (
                <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-1"></div>
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              Confirmar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
