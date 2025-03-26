
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Check } from "lucide-react";
import { useLabelHistory } from "@/hooks/useLabelHistory";
import { PrintLabelDialog } from "./labels/PrintLabelDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PrintLabelButtonProps {
  item: any;
}

export function PrintLabelButton({ item }: PrintLabelButtonProps) {
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const { hasPrintHistory, isLoading } = useLabelHistory(item.id);

  const handlePrint = () => {
    setShowPrintDialog(true);
  };

  const handleDialogClose = () => {
    setShowPrintDialog(false);
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrint}
              className={`h-8 w-8 relative ${hasPrintHistory ? "text-green-600 hover:text-green-800 hover:bg-green-100" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}
              aria-label="Imprimir etiqueta"
            >
              <Printer className="h-4 w-4" />
              {hasPrintHistory && (
                <span className="absolute -top-1 -right-1 bg-green-500 rounded-full w-3 h-3 flex items-center justify-center">
                  <Check className="h-2 w-2 text-white" />
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{hasPrintHistory ? "Reimprimir etiqueta" : "Imprimir etiqueta"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {showPrintDialog && (
        <PrintLabelDialog 
          isOpen={showPrintDialog} 
          onClose={handleDialogClose} 
          items={[item]} 
        />
      )}
    </>
  );
}
