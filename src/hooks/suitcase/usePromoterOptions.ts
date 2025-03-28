
/**
 * Hook para gerenciar opções de promotoras
 * @file Fornece listagem de promotoras para formulários de maletas
 * @relacionamento Utilizado em componentes de maletas
 */
import { useQuery } from "@tanstack/react-query";
import { PromoterModel } from "@/models/promoterModel";

export function usePromoterOptions() {
  const { data: promoters = [], isLoading } = useQuery({
    queryKey: ["promoters"],
    queryFn: async () => {
      try {
        const promotersList = await PromoterModel.getAll();
        return promotersList.map(promoter => ({
          value: promoter.id,
          label: promoter.name
        }));
      } catch (error) {
        console.error("Erro ao buscar promotoras:", error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
  });

  return {
    promoterOptions: promoters,
    isLoading
  };
}
