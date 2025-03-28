
/**
 * Hook para gerenciar as consultas relacionadas a maletas
 * @file Gerencia queries de maletas, itens e histórico
 * @relacionamento Utilizado pelo useOpenSuitcase para buscar dados
 */
import { useCallback, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CombinedSuitcaseController } from "@/controllers/suitcase";

/**
 * Hook para gerenciar as consultas relacionadas a maletas
 * @param suitcaseId ID da maleta (null quando inativo)
 * @param isActive Status da página/componente (ativo/inativo)
 */
export function useSuitcaseQueries(suitcaseId: string | null, isActive: boolean) {
  console.log(`[useSuitcaseQueries] Inicializando, suitcaseId: ${suitcaseId}, isActive: ${isActive}`);
  const queryClient = useQueryClient();
  
  // Referências para IDs ativos para uso durante limpeza
  const currentSuitcaseIdRef = useRef<string | null>(suitcaseId);
  const currentSellerIdRef = useRef<string | null>(null);
  
  // Efeito para monitorar mudanças no ID da maleta
  useEffect(() => {
    if (suitcaseId !== currentSuitcaseIdRef.current) {
      console.log(`[useSuitcaseQueries] ID da maleta mudou de ${currentSuitcaseIdRef.current} para ${suitcaseId}`);
      currentSuitcaseIdRef.current = suitcaseId;
    }
  }, [suitcaseId]);

  // Buscar detalhes da maleta
  const {
    data: suitcase,
    isLoading: isLoadingSuitcase,
    refetch: refetchSuitcase
  } = useQuery({
    queryKey: ["suitcase", suitcaseId],
    queryFn: () => {
      console.log(`[useSuitcaseQueries] Buscando detalhes da maleta: ${suitcaseId}`);
      return CombinedSuitcaseController.getSuitcaseById(suitcaseId || "");
    },
    enabled: isActive && !!suitcaseId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
  });

  // Atualizar referência do seller_id quando disponível
  useEffect(() => {
    if (suitcase?.seller_id && suitcase.seller_id !== currentSellerIdRef.current) {
      console.log(`[useSuitcaseQueries] ID do vendedor atualizado: ${suitcase.seller_id}`);
      currentSellerIdRef.current = suitcase.seller_id;
    }
  }, [suitcase?.seller_id]);

  // Buscar promotora da revendedora
  const {
    data: promoterInfo,
    isLoading: loadingPromoterInfo
  } = useQuery({
    queryKey: ["promoter-for-reseller", suitcase?.seller_id],
    queryFn: () => {
      console.log(`[useSuitcaseQueries] Buscando promotora para revendedor: ${suitcase?.seller_id}`);
      return CombinedSuitcaseController.getPromoterForReseller(suitcase?.seller_id || "");
    },
    enabled: isActive && !!suitcase?.seller_id,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
  });

  // Buscar itens da maleta
  const {
    data: suitcaseItems = [],
    isLoading: isLoadingSuitcaseItems,
    refetch: refetchSuitcaseItems
  } = useQuery({
    queryKey: ["suitcase-items", suitcaseId],
    queryFn: () => {
      console.log(`[useSuitcaseQueries] Buscando itens da maleta: ${suitcaseId}`);
      return CombinedSuitcaseController.getSuitcaseItems(suitcaseId || "");
    },
    enabled: isActive && !!suitcaseId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
  });

  // Buscar histórico de acertos
  const {
    data: acertosHistorico = [],
    isLoading: isLoadingAcertos
  } = useQuery({
    queryKey: ["acertos-historico", suitcaseId],
    queryFn: () => {
      console.log(`[useSuitcaseQueries] Buscando histórico de acertos: ${suitcaseId}`);
      return CombinedSuitcaseController.getHistoricoAcertos(suitcaseId || "");
    },
    enabled: isActive && !!suitcaseId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
  });

  // Função para cancelar e limpar todas as queries relacionadas
  const resetQueries = useCallback(() => {
    console.log("[useSuitcaseQueries] Iniciando limpeza total do cache de queries");
    
    const savedSuitcaseId = currentSuitcaseIdRef.current;
    const savedSellerId = currentSellerIdRef.current;
    
    if (savedSuitcaseId) {
      console.log(`[useSuitcaseQueries] Removendo queries para maleta: ${savedSuitcaseId}`);
      
      // Primeiro cancelar todas as queries pendentes
      queryClient.cancelQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          // Verificar se a query está relacionada com a maleta atual
          return (
            (Array.isArray(queryKey) && queryKey[0] === "suitcase" && queryKey[1] === savedSuitcaseId) ||
            (Array.isArray(queryKey) && queryKey[0] === "suitcase-items" && queryKey[1] === savedSuitcaseId) ||
            (Array.isArray(queryKey) && queryKey[0] === "acertos-historico" && queryKey[1] === savedSuitcaseId) ||
            (savedSellerId && Array.isArray(queryKey) && queryKey[0] === "promoter-for-reseller" && queryKey[1] === savedSellerId)
          );
        }
      }).then(() => {
        // Remover dados do cache completamente após cancelar as queries
        queryClient.removeQueries({ queryKey: ["suitcase", savedSuitcaseId] });
        queryClient.removeQueries({ queryKey: ["suitcase-items", savedSuitcaseId] });
        queryClient.removeQueries({ queryKey: ["acertos-historico", savedSuitcaseId] });
        
        if (savedSellerId) {
          queryClient.removeQueries({ queryKey: ["promoter-for-reseller", savedSellerId] });
        }
        
        console.log("[useSuitcaseQueries] Queries removidas do cache com sucesso");
      });
    } else {
      console.log("[useSuitcaseQueries] Nenhum ID de maleta para limpar no cache");
    }
    
    // Resetar as referências
    currentSuitcaseIdRef.current = null;
    currentSellerIdRef.current = null;
    
    console.log("[useSuitcaseQueries] Limpeza de cache concluída");
  }, [queryClient]);

  // Efeito para limpar queries quando o componente é desmontado ou quando isActive muda para false
  useEffect(() => {
    // Não limpar ao montar - apenas na desmontagem ou desativação
    if (!isActive) {
      resetQueries();
    }
    
    return () => {
      // Limpeza na desmontagem
      resetQueries();
    };
  }, [isActive, resetQueries]);

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
    resetQueries
  };
}
