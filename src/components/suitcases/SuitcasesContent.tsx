
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SuitcaseController } from "@/controllers/suitcaseController";
import { SuitcaseFilters } from "@/types/suitcase";
import { SuitcaseGrid } from "./SuitcaseGrid";
import { SuitcaseFilters as SuitcaseFiltersComponent } from "./SuitcaseFilters";
import { SuitcaseFormDialog } from "./SuitcaseFormDialog";
import { SuitcaseSummary } from "./SuitcaseSummary";
import { Button } from "@/components/ui/button";
import { PlusCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AcertoMaletaDialog } from "./settlement/AcertoMaletaDialog";
import { CombinedSuitcaseController } from "@/controllers/suitcase";

interface SuitcasesContentProps {
  isAdmin?: boolean;
  userProfile?: any;
  summary: any; // Resumo das maletas
}

export function SuitcasesContent({ isAdmin = false, userProfile, summary }: SuitcasesContentProps) {
  const [filters, setFilters] = useState<SuitcaseFilters>({});
  const [showNewSuitcaseDialog, setShowNewSuitcaseDialog] = useState(false);
  const [selectedSuitcase, setSelectedSuitcase] = useState<any>(null);
  const [showAcertoDialog, setShowAcertoDialog] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Buscar maletas com filtros
  const { data: suitcases = [], isLoading, refetch } = useQuery({
    queryKey: ['suitcases', filters],
    queryFn: () => SuitcaseController.searchSuitcases(filters),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Função para aplicar filtros
  const handleApplyFilters = (newFilters: SuitcaseFilters) => {
    setFilters(newFilters);
  };

  // Função para criar nova maleta
  const handleCreateSuitcase = async (data: any) => {
    try {
      await SuitcaseController.createSuitcase(data);
      toast.success("Maleta criada com sucesso");
      setShowNewSuitcaseDialog(false);
      refetch();
    } catch (error) {
      console.error("Erro ao criar maleta:", error);
      toast.error("Erro ao criar maleta");
    }
  };

  // Função para abrir diálogo de acerto
  const handleOpenAcertoDialog = (suitcase: any) => {
    setSelectedSuitcase(suitcase);
    setShowAcertoDialog(true);
  };

  // Função para fechar diálogo de acerto
  const handleCloseAcertoDialog = () => {
    setShowAcertoDialog(false);
    setSelectedSuitcase(null);
    refetch();
  };

  // Buscar contagem de itens para todas as maletas
  useEffect(() => {
    if (suitcases && suitcases.length > 0) {
      const fetchItemCounts = async () => {
        try {
          const suitcaseIds = suitcases.map(s => s.id);
          const counts = await CombinedSuitcaseController.getSuitcasesItemCounts(suitcaseIds);
          
          // Atualizar cada maleta com sua contagem de itens
          const updatedSuitcases = suitcases.map(suitcase => ({
            ...suitcase,
            items_count: counts[suitcase.id] || 0
          }));
          
          // Atualizar o cache do React Query
          queryClient.setQueryData(['suitcases', filters], updatedSuitcases);
        } catch (error) {
          console.error("Erro ao buscar contagem de itens:", error);
        }
      };
      
      fetchItemCounts();
    }
  }, [suitcases, queryClient, filters]);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
          <h1 className="text-2xl font-bold">Maletas</h1>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button onClick={() => setShowNewSuitcaseDialog(true)} size="sm">
              <PlusCircle className="h-4 w-4 mr-2" />
              Nova Maleta
            </Button>
          </div>
        </div>

        <SuitcaseSummary summary={summary} />

        <SuitcaseFiltersComponent filters={filters} onFiltersChange={handleApplyFilters} />

        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
          </div>
        ) : (
          <SuitcaseGrid 
            suitcases={suitcases} 
            isAdmin={isAdmin} 
            onRefresh={refetch}
            onOpenAcertoDialog={handleOpenAcertoDialog} 
          />
        )}
      </div>

      {/* Formulário de nova maleta */}
      <SuitcaseFormDialog 
        open={showNewSuitcaseDialog}
        onOpenChange={setShowNewSuitcaseDialog}
        onSubmit={handleCreateSuitcase}
        mode="create"
      />

      {/* Diálogo de acerto */}
      <AcertoMaletaDialog
        open={showAcertoDialog}
        onOpenChange={handleCloseAcertoDialog}
        suitcase={selectedSuitcase}
      />
    </div>
  );
}
