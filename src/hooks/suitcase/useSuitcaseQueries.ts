
/**
 * Hook para gerenciar as consultas relacionadas a maletas
 * @file Gerencia queries de maletas, itens e histórico
 * @relacionamento Utilizado pelo useOpenSuitcase para buscar dados
 * @modificação Melhoria na limpeza de cache e evitar consultas desnecessárias quando modal está fechada
 */
import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CombinedSuitcaseController } from "@/controllers/suitcase";

/**
 * Hook para gerenciar as consultas relacionadas a maletas
 * @param suitcaseId ID da maleta (null quando modal fechada)
 * @param open Status do diálogo (aberto/fechado)
 */
export function useSuitcaseQueries(suitcaseId: string | null, open: boolean) {
  const queryClient = useQueryClient();

  // Buscar detalhes da maleta apenas quando o diálogo estiver aberto e houver um ID válido
  const {
    data: suitcase,
    isLoading: isLoadingSuitcase,
    refetch: refetchSuitcase
  } = useQuery({
    queryKey: ["suitcase", suitcaseId],
    queryFn: () => CombinedSuitcaseController.getSuitcaseById(suitcaseId || ""),
    enabled: open && !!suitcaseId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Buscar promotora da revendedora apenas quando necessário
  const {
    data: promoterInfo,
    isLoading: loadingPromoterInfo
  } = useQuery({
    queryKey: ["promoter-for-reseller", suitcase?.seller_id],
    queryFn: () => CombinedSuitcaseController.getPromoterForReseller(suitcase?.seller_id || ""),
    enabled: open && !!suitcase?.seller_id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Buscar itens da maleta apenas quando necessário
  const {
    data: suitcaseItems = [],
    isLoading: isLoadingSuitcaseItems,
    refetch: refetchSuitcaseItems
  } = useQuery({
    queryKey: ["suitcase-items", suitcaseId],
    queryFn: () => CombinedSuitcaseController.getSuitcaseItems(suitcaseId || ""),
    enabled: open && !!suitcaseId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Buscar histórico de acertos apenas quando necessário
  const {
    data: acertosHistorico = [],
    isLoading: isLoadingAcertos
  } = useQuery({
    queryKey: ["acertos-historico", suitcaseId],
    queryFn: () => CombinedSuitcaseController.getHistoricoAcertos(suitcaseId || ""),
    enabled: open && !!suitcaseId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Função melhorada para resetar o estado das queries
  const resetQueryState = useCallback(() => {
    console.log("[useSuitcaseQueries] Iniciando limpeza completa do cache de queries");
    
    if (suitcaseId) {
      // Removendo queries específicas do cache
      queryClient.removeQueries({ queryKey: ["suitcase", suitcaseId] });
      queryClient.removeQueries({ queryKey: ["suitcase-items", suitcaseId] });
      queryClient.removeQueries({ queryKey: ["acertos-historico", suitcaseId] });
      
      if (suitcase?.seller_id) {
        queryClient.removeQueries({ queryKey: ["promoter-for-reseller", suitcase.seller_id] });
      }
      
      // Forçando invalidação para garantir que os dados sejam recarregados na próxima abertura
      queryClient.invalidateQueries({ queryKey: ["suitcase"] });
      queryClient.invalidateQueries({ queryKey: ["suitcase-items"] });
      queryClient.invalidateQueries({ queryKey: ["acertos-historico"] });
      queryClient.invalidateQueries({ queryKey: ["promoter-for-reseller"] });
    }
    
    console.log("[useSuitcaseQueries] Cache de queries limpo com sucesso");
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
