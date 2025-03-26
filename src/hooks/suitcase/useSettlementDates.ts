
/**
 * Hook para Gerenciamento de Datas de Acerto
 * @file Gerencia estado e operações relacionadas às datas de acerto da maleta
 * @relacionamento Utilizado pelo hook useSuitcaseDetails
 */
import { useState, useCallback } from "react";
import { CombinedSuitcaseController } from "@/controllers/suitcase";
import { toast } from "sonner";

export function useSettlementDates() {
  const [nextSettlementDate, setNextSettlementDate] = useState<Date | null>(null);
  
  const handleUpdateNextSettlementDate = async (suitcaseId: string, date?: Date | null) => {
    try {
      await CombinedSuitcaseController.updateSuitcase(suitcaseId, { next_settlement_date: date || nextSettlementDate });
      if (date) {
        setNextSettlementDate(date);
      }
      toast.success("Data do próximo acerto atualizada");
      return true;
    } catch (error) {
      console.error("Erro ao atualizar data do próximo acerto:", error);
      toast.error("Erro ao atualizar data do próximo acerto");
      return false;
    }
  };
  
  // Função de reset
  const resetDateState = useCallback(() => {
    setNextSettlementDate(null);
  }, []);
  
  return {
    nextSettlementDate,
    setNextSettlementDate,
    handleUpdateNextSettlementDate,
    resetDateState
  };
}
