
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { LabelModel } from "@/models/labelModel";

/**
 * Hook para buscar e verificar o histórico de impressão de etiquetas
 */
export function useLabelHistory(inventoryItemId?: string) {
  const [hasPrintHistory, setHasPrintHistory] = useState<boolean>(false);
  
  // Consulta que busca o histórico de etiquetas para um item específico
  const { data: labelHistory, isLoading, error } = useQuery({
    queryKey: ['item-label-history', inventoryItemId],
    queryFn: () => inventoryItemId ? LabelModel.getItemLabelHistory(inventoryItemId) : Promise.resolve([]),
    enabled: !!inventoryItemId,
  });

  // Atualiza o estado com base nos dados retornados
  useEffect(() => {
    if (labelHistory && labelHistory.length > 0) {
      setHasPrintHistory(true);
    } else {
      setHasPrintHistory(false);
    }
  }, [labelHistory]);

  return {
    hasPrintHistory,
    labelHistory,
    isLoading,
    error
  };
}
