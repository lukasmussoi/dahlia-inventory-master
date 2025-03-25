import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { SuitcaseGrid } from "./SuitcaseGrid";
import { SuitcaseFormDialog } from "./SuitcaseFormDialog";
import { SuitcaseController } from "@/controllers/suitcaseController";
import { AcertoMaletaDialog } from "./AcertoMaletaDialog";
import { SuitcaseSummary } from "./SuitcaseSummary";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { CombinedSuitcaseController } from "@/controllers/suitcase";
import { DeleteSpecificSuitcaseSection } from "./DeleteSpecificSuitcaseSection";

interface SuitcasesContentProps {
  isAdmin?: boolean;
  userProfile?: any;
}

interface SuitcaseFiltersProps {
  filters: any;
  onChange: (filters: any) => void;
}

function SuitcaseFilters({ filters, onChange }: SuitcaseFiltersProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, search: e.target.value });
  };

  const handleStatusChange = (status: string) => {
    onChange({ ...filters, status: status === "all" ? null : status });
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, city: e.target.value });
  };

  const handleNeighborhoodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, neighborhood: e.target.value });
  };

  return (
    <div className="bg-white rounded-lg p-4">
      <h4 className="text-lg font-semibold text-gray-900 mb-3">Filtrar Maletas</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="search">Pesquisar</Label>
          <Input
            type="text"
            id="search"
            placeholder="Código ou Revendedor"
            value={filters.search || ""}
            onChange={handleSearchChange}
          />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select onValueChange={handleStatusChange} defaultValue={filters.status || "all"}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todos os Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="in_use">Em Uso</SelectItem>
              <SelectItem value="returned">Devolvida</SelectItem>
              <SelectItem value="lost">Perdida</SelectItem>
              <SelectItem value="in_audit">Em Auditoria</SelectItem>
              <SelectItem value="in_replenishment">Em Reposição</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="city">Cidade</Label>
          <Input
            type="text"
            id="city"
            placeholder="Cidade"
            value={filters.city || ""}
            onChange={handleCityChange}
          />
        </div>
        <div>
          <Label htmlFor="neighborhood">Bairro</Label>
          <Input
            type="text"
            id="neighborhood"
            placeholder="Bairro"
            value={filters.neighborhood || ""}
            onChange={handleNeighborhoodChange}
          />
        </div>
      </div>
    </div>
  );
}

export function SuitcasesContent({ isAdmin, userProfile }: SuitcasesContentProps) {
  const [suitcases, setSuitcases] = useState<any[]>([]);
  const [filteredSuitcases, setFilteredSuitcases] = useState<any[]>([]);
  const [filters, setFilters] = useState({ search: "", status: null, city: "", neighborhood: "" });
  const [showCreateSuitcase, setShowCreateSuitcase] = useState(false);
  const [showAcertoDialog, setShowAcertoDialog] = useState(false);
  const [selectedSuitcase, setSelectedSuitcase] = useState<any | null>(null);
  const [summary, setSummary] = useState({ total: 0, in_use: 0, returned: 0, in_replenishment: 0, lost: 0, in_audit: 0 });

  // Buscar maletas
  const { isLoading, refetch } = useQuery({
    queryKey: ['suitcases', filters],
    queryFn: () => SuitcaseController.searchSuitcases(filters),
    onSuccess: (data) => {
      setSuitcases(data);
      setFilteredSuitcases(data);
    }
  });

  // Buscar resumo das maletas
  const fetchSuitcaseSummary = async () => {
    try {
      const summaryData = await SuitcaseController.getSuitcaseSummary();
      setSummary(summaryData);
    } catch (error) {
      console.error("Erro ao buscar resumo das maletas:", error);
    }
  };

  useEffect(() => {
    fetchSuitcaseSummary();
  }, []);

  // Atualizar lista de maletas
  const fetchSuitcases = () => {
    refetch();
    fetchSuitcaseSummary();
  };

  // Função para aplicar os filtros
  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  // Criar nova maleta
  const handleCreateSuitcase = async (suitcaseData: any) => {
    try {
      await SuitcaseController.createSuitcase(suitcaseData);
      toast.success("Maleta criada com sucesso");
      setShowCreateSuitcase(false);
      fetchSuitcases();
    } catch (error) {
      console.error("Erro ao criar maleta:", error);
      toast.error("Erro ao criar maleta");
    }
  };

  // Abrir diálogo de acerto
  const handleOpenAcertoDialog = (suitcase: any) => {
    setSelectedSuitcase(suitcase);
    setShowAcertoDialog(true);
  };

  // Callback após sucesso no acerto
  const handleAcertoSuccess = () => {
    fetchSuitcases();
    fetchSuitcaseSummary();
  };

  // Função para atualizar a lista após exclusão bem-sucedida
  const handleDeleteSuccess = () => {
    fetchSuitcases(); // Recarregar a lista de maletas
    fetchSuitcaseSummary(); // Atualizar o resumo
    toast.success("Lista de maletas atualizada após exclusão");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Maletas</h1>
          <p className="text-gray-600">Gerencie todas as maletas de joias em campo.</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button onClick={() => setShowCreateSuitcase(true)} className="bg-pink-500 hover:bg-pink-600">
            <Plus className="mr-2 h-4 w-4" /> Nova Maleta
          </Button>
        </div>
      </div>

      {/* Seção de exclusão específica - visível apenas para administradores */}
      {isAdmin && (
        <div className="mb-6">
          <DeleteSpecificSuitcaseSection onSuccess={handleDeleteSuccess} />
        </div>
      )}

      {/* Resumo e Filtros */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1">
          <SuitcaseSummary summary={summary} />
        </div>
        <div className="lg:col-span-2">
          <SuitcaseFilters
            filters={filters}
            onChange={handleFiltersChange}
          />
        </div>
      </div>

      {/* Grade de Maletas */}
      <SuitcaseGrid 
        suitcases={filteredSuitcases} 
        isAdmin={isAdmin} 
        onRefresh={fetchSuitcases}
        onOpenAcertoDialog={handleOpenAcertoDialog}
      />

      {/* Diálogos */}
      <SuitcaseFormDialog
        open={showCreateSuitcase}
        onOpenChange={setShowCreateSuitcase}
        onSubmit={handleCreateSuitcase}
        mode="create"
      />

      <AcertoMaletaDialog
        open={showAcertoDialog}
        onOpenChange={setShowAcertoDialog}
        suitcase={selectedSuitcase}
        onSuccess={handleAcertoSuccess}
      />
    </div>
  );
}
