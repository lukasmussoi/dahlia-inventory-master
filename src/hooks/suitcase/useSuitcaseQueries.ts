
/**
 * Hook para gerenciar as consultas relacionadas a maletas
 * @file Gerencia queries de maletas, itens e histórico
 * @relacionamento Utilizado pelo useOpenSuitcase para buscar dados
 * @modificação Corrigido bug de travamento, melhorando o gerenciamento do ciclo de vida de queries e limpeza de cache
 */
import { useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CombinedSuitcaseController } from "@/controllers/suitcase";

/**
 * Hook para gerenciar as consultas relacionadas a maletas
 * @param suitcaseId ID da maleta (null quando modal fechada)
 * @param open Status do diálogo (aberto/fechado)
 */
export function useSuitcaseQueries(suitcaseId: string | null, open: boolean) {
  console.log(`[useSuitcaseQueries] Inicializando, suitcaseId: ${suitcaseId}, open: ${open}`);
  const queryClient = useQueryClient();
  
  // Referência ao ID da maleta atual para usar durante limpeza
  const currentSuitcaseIdRef = useRef<string | null>(suitcaseId);
  
  // Atualizar a referência quando o ID da maleta mudar
  if (suitcaseId !== currentSuitcaseIdRef.current) {
    currentSuitcaseIdRef.current = suitcaseId;
  }

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
    gcTime: 1000 * 60, // 1 minuto - reduzido para liberar memória mais rápido após fechar
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
    gcTime: 1000 * 60, // 1 minuto
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
    gcTime: 1000 * 60, // 1 minuto
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
    gcTime: 1000 * 60, // 1 minuto
  });

  // Função melhorada para resetar o estado das queries
  const resetQueryState = useCallback(() => {
    console.log("[useSuitcaseQueries] Iniciando limpeza completa do cache de queries");
    
    const savedSuitcaseId = currentSuitcaseIdRef.current;
    const savedSellerId = suitcase?.seller_id;
    
    if (savedSuitcaseId) {
      // Invalidar as queries em vez de removê-las diretamente
      // Isso garante que o React Query gerencie corretamente o ciclo de vida das queries
      queryClient.invalidateQueries({
        queryKey: ["suitcase", savedSuitcaseId],
        refetchType: 'none', // Não buscar novamente, apenas invalidar
      });
      
      queryClient.invalidateQueries({
        queryKey: ["suitcase-items", savedSuitcaseId],
        refetchType: 'none',
      });
      
      queryClient.invalidateQueries({
        queryKey: ["acertos-historico", savedSuitcaseId],
        refetchType: 'none',
      });
      
      if (savedSellerId) {
        queryClient.invalidateQueries({
          queryKey: ["promoter-for-reseller", savedSellerId],
          refetchType: 'none',
        });
      }
      
      // Cancelar qualquer query pendente para evitar atualizações após desmontagem
      queryClient.cancelQueries({ queryKey: ["suitcase", savedSuitcaseId] });
      queryClient.cancelQueries({ queryKey: ["suitcase-items", savedSuitcaseId] });
      queryClient.cancelQueries({ queryKey: ["acertos-historico", savedSuitcaseId] });
      
      if (savedSellerId) {
        queryClient.cancelQueries({ queryKey: ["promoter-for-reseller", savedSellerId] });
      }
    }
    
    console.log("[useSuitcaseQueries] Cache de queries limpo com sucesso");
  }, [queryClient, suitcase?.seller_id]);

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
