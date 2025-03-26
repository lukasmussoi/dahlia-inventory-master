
/**
 * PrintLabelButton - Componente para o botão de impressão de etiquetas no inventário
 * 
 * Exibe um botão de impressão com status visual que indica se o item já teve
 * etiqueta impressa anteriormente.
 * 
 * Relaciona-se com:
 * - InventoryTable.tsx (chamador)
 * - PrintLabelDialog.tsx (abre quando clicado)
 * - LabelModel.ts (verifica histórico de impressão)
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Check, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PrintLabelDialog } from "./labels/PrintLabelDialog";
import { useQuery } from "@tanstack/react-query";
import { LabelModel } from "@/models/labelModel";

interface PrintLabelButtonProps {
  item: any;
}

export function PrintLabelButton({ item }: PrintLabelButtonProps) {
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  
  // Buscar histórico de impressão para o item
  const { data: labelHistory } = useQuery({
    queryKey: ['label-history', item.id],
    queryFn: () => LabelModel.getItemLabelHistory(item.id),
  });
  
  // Verificar se o item já teve etiqueta impressa
  const hasPrintedLabel = (labelHistory && labelHistory.length > 0);
  
  // Manipulador para abrir o diálogo de impressão
  const handlePrintClick = () => {
    setIsPrintDialogOpen(true);
  };
  
  // Manipulador para fechar o diálogo de impressão
  const handlePrintDialogClose = () => {
    setIsPrintDialogOpen(false);
  };
  
  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrintClick}
            className={`h-8 w-8 relative ${
              hasPrintedLabel 
                ? "text-green-600 hover:text-green-800 hover:bg-green-100" 
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
            }`}
          >
            <Printer className="h-4 w-4" />
            {hasPrintedLabel ? (
              <span className="absolute -top-1 -right-1 text-xs bg-green-100 text-green-700 w-4 h-4 flex items-center justify-center rounded-full">
                <Check className="h-3 w-3" />
              </span>
            ) : (
              <span className="absolute -top-1 -right-1 text-xs bg-gray-100 text-gray-700 w-4 h-4 flex items-center justify-center rounded-full">
                <X className="h-3 w-3" />
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {hasPrintedLabel 
            ? "Etiqueta já impressa. Clique para reimprimir." 
            : "Etiqueta não impressa. Clique para imprimir."}
        </TooltipContent>
      </Tooltip>
      
      {/* Diálogo de impressão de etiquetas */}
      <PrintLabelDialog
        isOpen={isPrintDialogOpen}
        onClose={handlePrintDialogClose}
        items={[item]}
      />
    </>
  );
}
