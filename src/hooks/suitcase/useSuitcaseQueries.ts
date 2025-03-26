
import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CombinedSuitcaseController } from "@/controllers/suitcase";

/**
 * Hook para gerenciar as consultas relacionadas a maletas
 * @param suitcaseId ID da maleta
 * @param open Status do diálogo (aberto/fechado)
 */
export function useSuitcaseQueries(suitcaseId: string | null, open: boolean) {
  const queryClient = useQueryClient();

  // Buscar detalhes da maleta
  const {
    data: suitcase,
    isLoading: isLoadingSuitcase,
    refetch: refetchSuitcase
  } = useQuery({
    queryKey: ["suitcase", suitcaseId],
    queryFn: () => CombinedSuitcaseController.getSuitcaseById(suitcaseId || ""),
    enabled: open && !!suitcaseId,
  });

  // Buscar promotora da revendedora
  const {
    data: promoterInfo,
    isLoading: loadingPromoterInfo
  } = useQuery({
    queryKey: ["promoter-for-reseller", suitcase?.seller_id],
    queryFn: () => CombinedSuitcaseController.getPromoterForReseller(suitcase?.seller_id || ""),
    enabled: open && !!suitcase?.seller_id,
  });

  // Buscar itens da maleta
  const {
    data: suitcaseItems = [],
    isLoading: isLoadingSuitcaseItems,
    refetch: refetchSuitcaseItems
  } = useQuery({
    queryKey: ["suitcase-items", suitcaseId],
    queryFn: () => CombinedSuitcaseController.getSuitcaseItems(suitcaseId || ""),
    enabled: open && !!suitcaseId,
  });

  // Buscar histórico de acertos
  const {
    data: acertosHistorico = [],
    isLoading: isLoadingAcertos
  } = useQuery({
    queryKey: ["acertos-historico", suitcaseId],
    queryFn: () => CombinedSuitcaseController.getHistoricoAcertos(suitcaseId || ""),
    enabled: open && !!suitcaseId,
  });

  // Função para resetar o estado das queries
  const resetQueryState = useCallback(() => {
    // Remover dados do cache para forçar nova requisição na próxima abertura
    if (suitcaseId) {
      queryClient.removeQueries({ queryKey: ["suitcase", suitcaseId] });
      queryClient.removeQueries({ queryKey: ["suitcase-items", suitcaseId] });
      queryClient.removeQueries({ queryKey: ["acertos-historico", suitcaseId] });
      
      if (suitcase?.seller_id) {
        queryClient.removeQueries({ queryKey: ["promoter-for-reseller", suitcase.seller_id] });
      }
    }
  }, [queryClient, suitcaseId, suitcase?.seller_id]);

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
    isLoadingAcertos,
    resetQueryState
  };
}
