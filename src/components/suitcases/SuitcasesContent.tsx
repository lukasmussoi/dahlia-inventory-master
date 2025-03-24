import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SuitcaseController } from "@/controllers/suitcaseController";
import { SuitcaseGrid } from "@/components/suitcases/SuitcaseGrid";
import { SuitcaseFilters } from "@/components/suitcases/SuitcaseFilters";
import { SuitcaseSummary } from "@/components/suitcases/SuitcaseSummary";
import { SuitcaseFormDialog } from "@/components/suitcases/SuitcaseFormDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Briefcase, Calculator } from "lucide-react";
import { toast } from "sonner";
import { AcertoMaletaDialog } from "@/components/suitcases/settlement/AcertoMaletaDialog";
import { AcertosList } from "@/components/suitcases/settlement/AcertosList";
import { AcertoDetailsDialog } from "@/components/suitcases/settlement/AcertoDetailsDialog";
import { Acerto, Suitcase } from "@/types/suitcase";

interface SuitcasesContentProps {
  isAdmin?: boolean;
  userProfile?: any; // Tipagem temporária, será melhorada posteriormente
}

export function SuitcasesContent({ isAdmin, userProfile }: SuitcasesContentProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [showNewSuitcaseDialog, setShowNewSuitcaseDialog] = useState(false);
  const [showAcertoDialog, setShowAcertoDialog] = useState(false);
  const [showAcertoDetailsDialog, setShowAcertoDetailsDialog] = useState(false);
  const [selectedSuitcase, setSelectedSuitcase] = useState<Suitcase | null>(null);
  const [selectedAcerto, setSelectedAcerto] = useState<Acerto | null>(null);
  const [activeTab, setActiveTab] = useState("suitcases");
  const [filters, setFilters] = useState({
    search: "",
    status: "in_use", // Valor padrão é "in_use" (em uso)
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
    queryKey: ['suitcases', filters],
    queryFn: () => {
      // Sempre usar searchSuitcases para aplicar os filtros consistentemente
      return SuitcaseController.searchSuitcases(filters);
    },
  });

  // Buscar resumo das maletas
  const { 
    data: summary = defaultSummary, 
    isLoading: isLoadingSummary,
    refetch: refetchSummary 
  } = useQuery({
    queryKey: ['suitcases-summary'],
    queryFn: () => SuitcaseController.getSuitcaseSummary(),
  });

  // Efetuar a primeira busca com filtro "in_use" ao carregar o componente
  useEffect(() => {
    setIsSearching(true);
  }, []);

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
      status: "in_use", // Limpar para "in_use" em vez de "todos"
      city: "",
      neighborhood: ""
    });
    setIsSearching(true); // Manter o estado de busca ativo, mas com filtros padrão
  };

  // Lidar com criação de nova maleta
  const handleCreateSuitcase = async (data: any) => {
    try {
      await SuitcaseController.createSuitcase(data);
      setShowNewSuitcaseDialog(false);
      refreshData();
      toast.success("Maleta criada com sucesso");
    } catch (error) {
      console.error("Erro ao criar maleta:", error);
      toast.error("Erro ao criar maleta");
    }
  };

  // Abrir o modal de acerto da maleta para uma maleta específica
  const handleOpenAcertoDialog = (suitcase: Suitcase) => {
    setSelectedSuitcase(suitcase);
    setShowAcertoDialog(true);
  };

  // Abrir o modal de detalhes de um acerto
  const handleViewAcertoDetails = (acerto: Acerto) => {
    setSelectedAcerto(acerto);
    setShowAcertoDetailsDialog(true);
  };

  if (isLoadingSuitcases || isLoadingSummary) {
    return (
      <div className="flex-1 p-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-8">
      <div className="flex flex-col gap-8">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1 flex items-center">
              <svg className="w-6 h-6 mr-2 text-pink-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 7H4C2.89543 7 2 7.89543 2 9V17C2 18.1046 2.89543 19 4 19H20C21.1046 19 22 18.1046 22 17V9C22 7.89543 21.1046 7 20 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 12H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 7V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Maletas das Revendedoras
            </h1>
          </div>
          
          <div className="flex flex-col md:flex-row gap-2">
            {activeTab === "suitcases" && (
              <Button 
                onClick={() => setShowNewSuitcaseDialog(true)} 
                className="bg-pink-500 hover:bg-pink-600 text-white whitespace-nowrap"
              >
                <Plus className="h-4 w-4 mr-2" /> 
                Criar Nova Maleta
              </Button>
            )}
          </div>
        </div>

        {/* Cards de Resumo */}
        <SuitcaseSummary summary={summary} />
        
        {/* Abas para alternar entre maletas e acertos */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="suitcases" className="flex gap-2 items-center">
              <Briefcase className="h-4 w-4" />
              Maletas
            </TabsTrigger>
            <TabsTrigger value="settlements" className="flex gap-2 items-center">
              <Calculator className="h-4 w-4" />
              Acertos
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="suitcases" className="mt-0">
            {/* Filtros de Maletas */}
            <SuitcaseFilters 
              filters={filters}
              onSearch={handleSearch}
              onClear={handleClearFilters}
            />
            
            {/* Lista de Maletas */}
            <SuitcaseGrid 
              suitcases={suitcases}
              isAdmin={isAdmin}
              onRefresh={refreshData}
              onOpenAcertoDialog={handleOpenAcertoDialog}
            />
          </TabsContent>
          
          <TabsContent value="settlements" className="mt-0">
            {/* Lista de Acertos */}
            <AcertosList 
              onViewAcerto={handleViewAcertoDetails}
              onRefresh={() => {
                // Atualizar os dados quando a lista de acertos for atualizada
                setActiveTab("settlements");
                refreshData(); // Adicionado refresh para garantir que dados são atualizados
              }}
              isAdmin={isAdmin}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal para criar nova maleta */}
      <SuitcaseFormDialog
        open={showNewSuitcaseDialog}
        onOpenChange={setShowNewSuitcaseDialog}
        onSubmit={handleCreateSuitcase}
        mode="create"
      />
      
      {/* Modal para realizar acerto da maleta */}
      <AcertoMaletaDialog
        open={showAcertoDialog}
        onOpenChange={setShowAcertoDialog}
        suitcase={selectedSuitcase}
        onSuccess={() => {
          refreshData();
          // Mudar para a aba de acertos após concluir um acerto
          setActiveTab("settlements");
        }}
      />
      
      {/* Modal para visualizar detalhes de um acerto */}
      <AcertoDetailsDialog
        open={showAcertoDetailsDialog}
        onOpenChange={setShowAcertoDetailsDialog}
        acertoId={selectedAcerto?.id}
      />
    </div>
  );
}
