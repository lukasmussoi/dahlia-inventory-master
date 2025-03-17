
import { useReactToPrint as useOriginalReactToPrint } from "react-to-print";

// Hook personalizado com tipagem correta
export function useReactPrint(options: {
  documentTitle?: string;
  onPrintError?: (errorLocation: string, error: Error) => void;
  onAfterPrint?: () => void;
  removeAfterPrint?: boolean;
  printTimeout?: number;
}) {
  // Usamos o hook original com as opções corretas
  return useOriginalReactToPrint(options);
}
