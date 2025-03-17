
import { useReactToPrint as useOriginalReactToPrint } from "react-to-print";
import { type UseReactToPrintOptions } from "react-to-print";

// Hook personalizado com tipagem correta
export function useReactPrint(options: UseReactToPrintOptions) {
  // Usamos o hook original com as opções corretas
  return useOriginalReactToPrint(options);
}
