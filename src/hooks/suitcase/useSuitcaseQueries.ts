
import { useQuery } from "@tanstack/react-query";
import { SuitcaseController } from "@/controllers/suitcaseController";

/**
 * Hook para gerenciar as consultas relacionadas a maletas
 * @param suitcaseId ID da maleta
 * @param open Status do diálogo (aberto/fechado)
 */
export function useSuitcaseQueries(suitcaseId: string | null, open: boolean) {
  // Buscar detalhes da maleta
  const {
    data: suitcase,
    isLoading: isLoadingSuitcase,
    refetch: refetchSuitcase
  } = useQuery({
    queryKey: ["suitcase", suitcaseId],
    queryFn: () => SuitcaseController.getSuitcaseById(suitcaseId || ""),
    enabled: open && !!suitcaseId,
  });

  // Buscar promotora da revendedora
  const {
    data: promoterInfo,
    isLoading: loadingPromoterInfo
  } = useQuery({
    queryKey: ["promoter-for-reseller", suitcase?.seller_id],
    queryFn: () => SuitcaseController.getPromoterForReseller(suitcase?.seller_id || ""),
    enabled: open && !!suitcase?.seller_id,
  });

  // Buscar itens da maleta
  const {
    data: suitcaseItems = [],
    isLoading: isLoadingSuitcaseItems,
    refetch: refetchSuitcaseItems
  } = useQuery({
    queryKey: ["suitcase-items", suitcaseId],
    queryFn: () => SuitcaseController.getSuitcaseItems(suitcaseId || ""),
    enabled: open && !!suitcaseId,
  });

  // Buscar histórico de acertos
  const {
    data: acertosHistorico = [],
    isLoading: isLoadingAcertos
  } = useQuery({
    queryKey: ["acertos-historico", suitcaseId],
    queryFn: () => SuitcaseController.createPendingSettlement(suitcaseId || "", new Date()),
    enabled: open && !!suitcaseId,
  });

  return {
    suitcase,
    isLoadingSuitcase,
    refetchSuitcase,
    promoterInfo,
    loadingPromoterInfo,
    suitcaseItems,
    isLoadingSuitcaseItems,
    refetchSuitcaseItems,
    acertosHistorico,
    isLoadingAcertos
  };
}
