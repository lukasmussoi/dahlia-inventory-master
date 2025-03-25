
/**
 * Componente de Controles de Ação para Itens
 * @file Fornece controles para gerenciar ações em itens agrupados (devolução/danificação)
 * @relacionamento Utilizado pelo componente SuitcaseItems para interação com itens
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { MoreHorizontal, ArrowLeft, AlertTriangle } from "lucide-react";
import { GroupedSuitcaseItem } from "@/types/suitcase";
import { toast } from "sonner";

interface ItemActionControlsProps {
  groupedItem: GroupedSuitcaseItem;
  onReturnToInventory: (itemIds: string[], quantity: number, isDamaged: boolean) => Promise<void>;
}

export function ItemActionControls({ 
  groupedItem, 
  onReturnToInventory 
}: ItemActionControlsProps) {
  const [open, setOpen] = useState(false);
  const [returnQuantity, setReturnQuantity] = useState(1);
  const [isDamaged, setIsDamaged] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Garantir que a quantidade é válida
  const handleQuantityChange = (value: string) => {
    const parsedValue = parseInt(value, 10);
    
    if (isNaN(parsedValue) || parsedValue < 1) {
      setReturnQuantity(1);
    } else if (parsedValue > groupedItem.total_quantity) {
      setReturnQuantity(groupedItem.total_quantity);
    } else {
      setReturnQuantity(parsedValue);
    }
  };

  const handleReturnItems = async () => {
    if (returnQuantity < 1 || returnQuantity > groupedItem.total_quantity) {
      toast.error("Quantidade inválida para devolução");
      return;
    }

    try {
      setIsProcessing(true);
      
      // Selecionar apenas a quantidade solicitada de IDs
      const itemIdsToProcess = groupedItem.items
        .slice(0, returnQuantity)
        .map(item => item.id);
      
      await onReturnToInventory(itemIdsToProcess, returnQuantity, isDamaged);
      
      setOpen(false);
      setIsDamaged(false);
      setReturnQuantity(1);
    } catch (error) {
      console.error("Erro ao processar devolução:", error);
      toast.error("Ocorreu um erro ao processar a devolução");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Ações para este item</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          <h4 className="font-medium">Ações para {groupedItem.product_name}</h4>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="return-inventory"
                checked={!isDamaged}
                onCheckedChange={() => setIsDamaged(false)}
              />
              <label 
                htmlFor="return-inventory"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                <div className="flex items-center gap-1">
                  <ArrowLeft className="h-3.5 w-3.5 text-teal-600" />
                  Devolver ao Estoque
                </div>
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="mark-damaged"
                checked={isDamaged}
                onCheckedChange={() => setIsDamaged(true)}
              />
              <label 
                htmlFor="mark-damaged"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-orange-600" />
                  Marcar como Danificado
                </div>
              </label>
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="quantity" className="text-sm font-medium">
              Quantidade a processar:
            </label>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={groupedItem.total_quantity}
              value={returnQuantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Máximo disponível: {groupedItem.total_quantity}
            </p>
          </div>
          
          <div className="flex justify-end">
            <Button 
              onClick={handleReturnItems} 
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
              ) : null}
              {isDamaged ? "Marcar como Danificado" : "Devolver ao Estoque"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
