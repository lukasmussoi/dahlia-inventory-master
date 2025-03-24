
import { useState } from "react";
import { format } from "date-fns";
import { SuitcaseController } from "@/controllers/suitcaseController";
import { toast } from "sonner";

export function useSettlementDates() {
  const [nextSettlementDate, setNextSettlementDate] = useState<Date | undefined>(undefined);

  // Atualizar a data do próximo acerto
  const handleUpdateNextSettlementDate = async (suitcaseId: string, date?: Date | null) => {
    if (!suitcaseId) return;
    
    try {
      // Usando null quando a data não for fornecida
      const formattedDate = date ? format(date, "yyyy-MM-dd") : null;
      await SuitcaseController.updateSuitcase(suitcaseId, {
        next_settlement_date: formattedDate
      });
      
      setNextSettlementDate(date || undefined);
      toast.success("Data do próximo acerto atualizada com sucesso");
      return true;
    } catch (error) {
      console.error("Erro ao atualizar data de acerto:", error);
      toast.error("Erro ao atualizar data do próximo acerto");
      return false;
    }
  };

  return {
    nextSettlementDate,
    setNextSettlementDate,
    handleUpdateNextSettlementDate
  };
}
