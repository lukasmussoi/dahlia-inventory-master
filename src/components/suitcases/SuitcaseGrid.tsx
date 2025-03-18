
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Suitcase, SuitcaseItem, SuitcaseItemStatus } from "@/types/suitcase";
import { SuitcaseModel } from "@/models/suitcaseModel";
import { SuitcaseController } from "@/controllers/suitcaseController";
import { SuitcaseFormDialog } from "@/components/suitcases/SuitcaseFormDialog";
import { SuitcaseDetailsDialog } from "@/components/suitcases/SuitcaseDetailsDialog";
import { SuitcasePrintDialog } from "@/components/suitcases/SuitcasePrintDialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Eye, Printer, Edit, Trash2, MoreVertical, MapPin } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface SuitcaseGridProps {
  suitcases: Suitcase[];
  isAdmin?: boolean;
  onRefresh: () => void;
}

export function SuitcaseGrid({ suitcases, isAdmin, onRefresh }: SuitcaseGridProps) {
  const [showSuitcaseFormDialog, setShowSuitcaseFormDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [selectedSuitcase, setSelectedSuitcase] = useState<Suitcase | null>(null);
  const [suitcaseItemsForPrint, setSuitcaseItemsForPrint] = useState<SuitcaseItem[]>([]);

  // Abrir modal de edição
  const handleEdit = (suitcase: Suitcase) => {
    setSelectedSuitcase(suitcase);
    setShowSuitcaseFormDialog(true);
  };

  // Abrir modal de detalhes
  const handleViewDetails = (suitcase: Suitcase) => {
    setSelectedSuitcase(suitcase);
    setShowDetailsDialog(true);
  };

  // Abrir modal de impressão
  const handlePrint = async (suitcase: Suitcase) => {
    setSelectedSuitcase(suitcase);
    try {
      const items = await SuitcaseModel.getSuitcaseItems(suitcase.id);
      setSuitcaseItemsForPrint(items);
      setShowPrintDialog(true);
    } catch (error) {
      console.error("Erro ao carregar itens da maleta para impressão:", error);
      toast.error("Erro ao carregar itens da maleta para impressão");
    }
  };

  // Excluir maleta
  const handleDelete = async (suitcase: Suitcase) => {
    if (window.confirm(`Tem certeza que deseja excluir a maleta ${suitcase.code}?`)) {
      try {
        await SuitcaseController.deleteSuitcase(suitcase.id);
        toast.success("Maleta excluída com sucesso");
        onRefresh();
      } catch (error) {
        console.error("Erro ao excluir maleta:", error);
        toast.error("Erro ao excluir maleta");
      }
    }
  };

  // Atualizar maleta
  const handleUpdateSuitcase = async (data: any) => {
    try {
      if (!selectedSuitcase) return;
      
      await SuitcaseController.updateSuitcase(selectedSuitcase.id, data);
      toast.success("Maleta atualizada com sucesso");
      setShowSuitcaseFormDialog(false);
      onRefresh();
    } catch (error) {
      console.error("Erro ao atualizar maleta:", error);
      toast.error("Erro ao atualizar maleta");
    }
  };

  // Formatar status para exibição
  const formatStatus = (status: string) => {
    switch (status) {
      case 'in_use': return { text: 'Em uso', className: 'bg-green-100 text-green-800' };
      case 'returned': return { text: 'Devolvida', className: 'bg-blue-100 text-blue-800' };
      case 'in_replenishment': return { text: 'Aguardando Reposição', className: 'bg-orange-100 text-orange-800' };
      default: return { text: status, className: 'bg-gray-100 text-gray-800' };
    }
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "yyyy-MM-dd", { locale: ptBR });
  };

  // Verificar se há maletas para exibir
  if (suitcases.length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-lg font-medium text-gray-900">Nenhuma maleta encontrada</h3>
        <p className="mt-1 text-sm text-gray-500">
          Crie uma nova maleta para começar a gerenciar seus produtos.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {suitcases.map((suitcase) => {
          // Obter contagem de itens e última atualização
          const { data: suitcaseItems = [] } = useQuery({
            queryKey: ['suitcase-items', suitcase.id],
            queryFn: () => SuitcaseModel.getSuitcaseItems(suitcase.id),
            enabled: !!suitcase.id,
          });

          // Formatar status
          const status = formatStatus(suitcase.status);
          
          // Data da última atualização
          const lastUpdate = formatDate(suitcase.updated_at || suitcase.created_at);

          // Informações de localização da maleta
          const hasLocation = suitcase.city && suitcase.neighborhood;
          
          return (
            <Card key={suitcase.id} className="overflow-hidden border border-gray-200">
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-pink-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 7H4C2.89543 7 2 7.89543 2 9V17C2 18.1046 2.89543 19 4 19H20C21.1046 19 22 18.1046 22 17V9C22 7.89543 21.1046 7 20 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 12H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 7V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <h3 className="text-lg font-bold">{suitcase.code}</h3>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.className}`}>
                    {status.text}
                  </span>
                </div>
                
                <h4 className="text-base font-semibold mb-1">{suitcase.seller?.name || "Sem revendedora"}</h4>
                
                {/* Exibir cidade e bairro */}
                {hasLocation && (
                  <p className="text-sm text-pink-500 mb-2 flex items-center">
                    <MapPin className="h-3.5 w-3.5 mr-1" />
                    {suitcase.city} • {suitcase.neighborhood}
                  </p>
                )}
                
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-1">
                    {suitcaseItems.length} itens na maleta
                  </p>
                  <p className="text-xs text-gray-400">
                    Última atualização: {lastUpdate}
                  </p>
                </div>
                
                <div className="mt-3 flex justify-between">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="gap-1"
                    onClick={() => handleViewDetails(suitcase)}
                  >
                    <Eye className="h-4 w-4" />
                    Detalhes
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handlePrint(suitcase)}>
                        <Printer className="h-4 w-4 mr-2" />
                        Imprimir
                      </DropdownMenuItem>
                      {isAdmin && (
                        <>
                          <DropdownMenuItem onClick={() => handleEdit(suitcase)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDelete(suitcase)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Modal de Edição */}
      <SuitcaseFormDialog
        open={showSuitcaseFormDialog}
        onOpenChange={setShowSuitcaseFormDialog}
        onSubmit={handleUpdateSuitcase}
        suitcase={selectedSuitcase}
        mode="edit"
      />

      {/* Modal de Detalhes */}
      <SuitcaseDetailsDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        suitcase={selectedSuitcase}
        onEdit={handleEdit}
      />

      {/* Modal de Impressão */}
      <SuitcasePrintDialog
        open={showPrintDialog}
        onOpenChange={setShowPrintDialog}
        suitcase={selectedSuitcase}
        suitcaseItems={suitcaseItemsForPrint}
      />
    </div>
  );
}
