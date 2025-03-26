
import { useState } from "react";
import { CombinedSuitcaseController } from "@/controllers/suitcase";

export function useSettlementDates() {
  const [nextSettlementDate, setNextSettlementDate] = useState<Date | null>(null);
  const [isUpdatingDate, setIsUpdatingDate] = useState(false);

  // Atualiza a data do próximo acerto
  const handleUpdateNextSettlementDate = async (suitcaseId: string, date: Date | null | undefined) => {
    if (!suitcaseId || !date) return false;
    
    try {
      setIsUpdatingDate(true);
      
      // Atualizar a data de próximo acerto
      await CombinedSuitcaseController.updateSuitcase(suitcaseId, {
        next_settlement_date: date.toISOString()
      });
      
      // Atualizar estado local
      setNextSettlementDate(date);
      return true;
    } catch (error) {
      console.error("Erro ao atualizar data de próximo acerto:", error);
      return false;
    } finally {
      setIsUpdatingDate(false);
    }
  };

  // Resetar estado
  const resetDateState = () => {
    setNextSettlementDate(null);
    setIsUpdatingDate(false);
  };

  return {
    nextSettlementDate,
    setNextSettlementDate,
    isUpdatingDate,
    handleUpdateNextSettlementDate,
    resetDateState
  };
}
