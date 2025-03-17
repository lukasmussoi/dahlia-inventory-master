
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { suitcaseController } from "@/controllers/suitcaseController";
import { SuitcaseGrid } from "@/components/suitcases/SuitcaseGrid";
import { SuitcaseFilters } from "@/components/suitcases/SuitcaseFilters";
import { SuitcaseSummary } from "@/components/suitcases/SuitcaseSummary";
import { SuitcaseFormDialog } from "@/components/suitcases/SuitcaseFormDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface SuitcasesContentProps {
  isAdmin?: boolean;
  userProfile?: any; // Tipagem temporária, será melhorada posteriormente
}

export function SuitcasesContent({ isAdmin, userProfile }: SuitcasesContentProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [showNewSuitcaseDialog, setShowNewSuitcaseDialog] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    status: "todos",
    city: "",
    neighborhood: ""
  });

  // Default empty summary if data is not yet loaded
  const defaultSummary = {
    total: 0,
    in_use: 0,
    returned: 0,
    in_replenishment: 0
  };

  // Buscar maletas usando React Query
  const { 
    data: suitcases = [], 
    isLoading: isLoadingSuitcases,
    refetch: refetchSuitcases
  } = useQuery({
    queryKey: ['suitcases', isSearching, filters],
    queryFn: () => {
      if (isSearching) {
        return suitcaseController.searchSuitcases(filters);
      } else {
        return suitcaseController.getAllSuitcases();
      }
    },
  });

  // Buscar resumo das maletas
  const { 
    data: summary = defaultSummary, 
    isLoading: isLoadingSummary,
    refetch: refetchSummary 
  } = useQuery({
    queryKey: ['suitcases-summary'],
    queryFn: () => suitcaseController.getSuitcaseSummary(),
  });

  // Refazer consultas quando necessário
  const refreshData = () => {
    refetchSuitcases();
    refetchSummary();
    toast.success("Dados atualizados com sucesso");
  };

  // Lidar com busca
  const handleSearch = (newFilters: any) => {
    setFilters(newFilters);
    setIsSearching(true);
  };

  // Limpar filtros
  const handleClearFilters = () => {
    setFilters({
      search: "",
      status: "todos",
      city: "",
      neighborhood: ""
    });
    setIsSearching(false);
  };

  // Lidar com criação de nova maleta
  const handleCreateSuitcase = async (data: any) => {
    try {
      await suitcaseController.createSuitcase(data);
      setShowNewSuitcaseDialog(false);
      refreshData();
      toast.success("Maleta criada com sucesso");
    } catch (error) {
      console.error("Erro ao criar maleta:", error);
      toast.error("Erro ao criar maleta");
    }
  };

  if (isLoadingSuitcases || isLoadingSummary) {
    return (
      <div className="flex-1 p-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-8">
      <div className="flex flex-col gap-8">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Maletas</h1>
            <p className="text-muted-foreground">
              Gerencie as maletas de produtos das revendedoras
            </p>
          </div>
          
          <Button onClick={() => setShowNewSuitcaseDialog(true)} className="whitespace-nowrap">
            <Plus className="h-4 w-4 mr-2" /> 
            Criar Nova Maleta
          </Button>
        </div>

        {/* Cards de Resumo */}
        <SuitcaseSummary summary={summary} />
        
        {/* Filtros */}
        <SuitcaseFilters 
          filters={filters}
          onSearch={handleSearch}
          onClear={handleClearFilters}
        />
        
        {/* Lista de Maletas */}
        <SuitcaseGrid 
          isAdmin={isAdmin}
          onRefresh={refreshData}
        />
      </div>

      {/* Modal para criar nova maleta */}
      <SuitcaseFormDialog
        open={showNewSuitcaseDialog}
        onOpenChange={setShowNewSuitcaseDialog}
        onSubmit={handleCreateSuitcase}
        mode="create"
      />
    </div>
  );
}
