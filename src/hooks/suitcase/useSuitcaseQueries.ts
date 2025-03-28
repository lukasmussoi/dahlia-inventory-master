
/**
 * Hook para gerenciar as consultas relacionadas a maletas
 * @file Gerencia queries de maletas, itens e histórico
 * @relacionamento Utilizado pelo useOpenSuitcase para buscar dados
 * @modificação Melhoria na limpeza de cache e queries ao fechar a modal
 */
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
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Buscar promotora da revendedora
  const {
    data: promoterInfo,
    isLoading: loadingPromoterInfo
  } = useQuery({
    queryKey: ["promoter-for-reseller", suitcase?.seller_id],
    queryFn: () => CombinedSuitcaseController.getPromoterForReseller(suitcase?.seller_id || ""),
    enabled: open && !!suitcase?.seller_id,
    staleTime: 1000 * 60 * 5, // 5 minutos
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
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Buscar histórico de acertos
  const {
    data: acertosHistorico = [],
    isLoading: isLoadingAcertos
  } = useQuery({
    queryKey: ["acertos-historico", suitcaseId],
    queryFn: () => CombinedSuitcaseController.getHistoricoAcertos(suitcaseId || ""),
    enabled: open && !!suitcaseId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Função para resetar o estado das queries de forma mais robusta
  const resetQueryState = useCallback(() => {
    console.log("[useSuitcaseQueries] Iniciando limpeza do cache de queries");
    
    // Abordagem 1: Remover queries específicas do cache
    if (suitcaseId) {
      // Removendo queries relacionadas à maleta atual
      queryClient.removeQueries({ queryKey: ["suitcase", suitcaseId] });
      queryClient.removeQueries({ queryKey: ["suitcase-items", suitcaseId] });
      queryClient.removeQueries({ queryKey: ["acertos-historico", suitcaseId] });
      
      if (suitcase?.seller_id) {
        queryClient.removeQueries({ queryKey: ["promoter-for-reseller", suitcase.seller_id] });
      }
    }
    
    // Abordagem 2: Invalidar as queries para forçar refetch na próxima vez
    queryClient.invalidateQueries({ queryKey: ["suitcase"] });
    queryClient.invalidateQueries({ queryKey: ["suitcase-items"] });
    queryClient.invalidateQueries({ queryKey: ["acertos-historico"] });
    queryClient.invalidateQueries({ queryKey: ["promoter-for-reseller"] });
    
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
