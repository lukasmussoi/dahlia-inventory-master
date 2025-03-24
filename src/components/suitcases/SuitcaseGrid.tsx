
import { useState, useMemo } from "react";
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
import { 
  Eye, 
  Printer, 
  Edit, 
  Trash2, 
  MoreVertical, 
  MapPin, 
  Calculator, 
  Package, 
  Plus, 
  Clock, 
  History 
} from "lucide-react";
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
  onOpenAcertoDialog?: (suitcase: Suitcase) => void;
}

export function SuitcaseGrid({ suitcases, isAdmin, onRefresh, onOpenAcertoDialog }: SuitcaseGridProps) {
  const [showSuitcaseFormDialog, setShowSuitcaseFormDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [selectedSuitcase, setSelectedSuitcase] = useState<Suitcase | null>(null);
  const [suitcaseItemsForPrint, setSuitcaseItemsForPrint] = useState<SuitcaseItem[]>([]);
  const [promoterInfo, setPromoterInfo] = useState<any>(null);

  const suitcaseIds = useMemo(() => suitcases.map(suitcase => suitcase.id), [suitcases]);
  
  const { data: allSuitcaseItems = {} } = useQuery({
    queryKey: ['all-suitcase-items', suitcaseIds.join(',')],
    queryFn: async () => {
      if (suitcaseIds.length === 0) return {};
      
      const result: Record<string, SuitcaseItem[]> = {};
      await Promise.all(
        suitcaseIds.map(async (id) => {
          try {
            // Buscar todos os itens da maleta
            const items = await SuitcaseModel.getSuitcaseItems(id);
            // Filtrar apenas itens em posse (não vendidos)
            result[id] = items.filter(item => item.status === 'in_possession');
          } catch (error) {
            console.error(`Erro ao buscar itens da maleta ${id}:`, error);
            result[id] = [];
          }
        })
      );
      return result;
    },
    enabled: suitcaseIds.length > 0,
  });

  const handleEdit = (suitcase: Suitcase) => {
    setSelectedSuitcase(suitcase);
    setShowSuitcaseFormDialog(true);
  };

  const handleViewDetails = (suitcase: Suitcase) => {
    setSelectedSuitcase(suitcase);
    setShowDetailsDialog(true);
  };

  const handlePrint = async (suitcase: Suitcase) => {
    setSelectedSuitcase(suitcase);
    try {
      // Buscar todos os itens da maleta
      const allItems = await SuitcaseModel.getSuitcaseItems(suitcase.id);
      // Filtrar apenas itens em posse (não vendidos)
      const items = allItems.filter(item => item.status === 'in_possession');
      setSuitcaseItemsForPrint(items);
      
      if (suitcase.seller_id) {
        const promoter = await SuitcaseController.getPromoterForReseller(suitcase.seller_id);
        setPromoterInfo(promoter);
      } else {
        setPromoterInfo(null);
      }
      
      setShowPrintDialog(true);
    } catch (error) {
      console.error("Erro ao carregar itens da maleta para impressão:", error);
      toast.error("Erro ao carregar itens da maleta para impressão");
    }
  };

  const handleSettlement = (suitcase: Suitcase) => {
    if (onOpenAcertoDialog) {
      onOpenAcertoDialog(suitcase);
    }
  };

  const handleDelete = async (suitcase: Suitcase) => {
    if (window.confirm(`Tem certeza que deseja excluir a maleta ${suitcase.code}?`)) {
      try {
        await SuitcaseController.deleteSuitcase(suitcase.id);
        toast.success("Maleta excluída com sucesso");
        onRefresh();
      } catch (error: any) {
        console.error("Erro ao excluir maleta:", error);
        toast.error(error.message || "Erro ao excluir maleta");
      }
    }
  };

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

  const formatStatus = (status: string) => {
    switch (status) {
      case 'in_use': return { text: 'Em uso', className: 'bg-green-100 text-green-800 px-2 py-1 text-xs font-medium rounded-full' };
      case 'returned': return { text: 'Devolvida', className: 'bg-blue-100 text-blue-800 px-2 py-1 text-xs font-medium rounded-full' };
      case 'in_replenishment': return { text: 'Aguardando Reposição', className: 'bg-orange-100 text-orange-800 px-2 py-1 text-xs font-medium rounded-full' };
      default: return { text: status, className: 'bg-gray-100 text-gray-800 px-2 py-1 text-xs font-medium rounded-full' };
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "yyyy-MM-dd", { locale: ptBR });
  };

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {suitcases.map((suitcase) => {
          const suitcaseItems = allSuitcaseItems[suitcase.id] || [];
          const status = formatStatus(suitcase.status);
          const lastUpdate = formatDate(suitcase.updated_at || suitcase.created_at);
          const hasLocation = suitcase.city && suitcase.neighborhood;
          
          return (
            <Card key={suitcase.id} className="overflow-hidden border border-gray-200">
              <div className="p-4">
                {/* Cabeçalho com código da maleta e status */}
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <Package className="w-5 h-5 mr-2 text-green-500" />
                    <h3 className="text-lg font-bold">{suitcase.code}</h3>
                  </div>
                  <span className={status.className}>
                    {status.text}
                  </span>
                </div>
                
                {/* Nome da revendedora */}
                <h4 className="text-base font-semibold mb-1">{suitcase.seller?.name || "Sem revendedora"}</h4>
                
                {/* Localização */}
                {hasLocation && (
                  <p className="text-sm text-rose-500 mb-1">
                    {suitcase.city} • {suitcase.neighborhood}
                  </p>
                )}
                
                {/* Quantidade de itens */}
                <p className="text-sm text-gray-700 mb-1">
                  {suitcaseItems.length} itens na maleta
                </p>
                
                {/* Data da última atualização */}
                <p className="text-xs text-gray-500 mb-3">
                  Última atualização: {lastUpdate}
                </p>
                
                {/* Botões de ação */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {/* Botão Abrir */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleViewDetails(suitcase)}
                    className="flex items-center justify-center gap-1 bg-green-50 text-green-700 border-green-100 hover:bg-green-100 hover:text-green-800"
                  >
                    <Package className="h-4 w-4" />
                    Abrir
                  </Button>
                  
                  {/* Botão Abastecer */}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewDetails(suitcase)}
                    className="flex items-center justify-center gap-1 bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100 hover:text-blue-800"
                  >
                    <Plus className="h-4 w-4" />
                    Abastecer
                  </Button>
                  
                  {/* Botão Acerto */}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleSettlement(suitcase)}
                    className="flex items-center justify-center gap-1 bg-yellow-50 text-yellow-700 border-yellow-100 hover:bg-yellow-100 hover:text-yellow-800"
                  >
                    <Clock className="h-4 w-4" />
                    Acerto
                  </Button>
                  
                  {/* Botão Histórico */}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewDetails(suitcase)}
                    className="flex items-center justify-center gap-1 bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100 hover:text-purple-800"
                  >
                    <History className="h-4 w-4" />
                    Histórico
                  </Button>
                </div>
                
                {/* Menu de opções (três pontos) */}
                <div className="absolute top-3 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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

      <SuitcaseFormDialog
        open={showSuitcaseFormDialog}
        onOpenChange={setShowSuitcaseFormDialog}
        onSubmit={handleUpdateSuitcase}
        suitcase={selectedSuitcase}
        mode="edit"
      />

      <SuitcaseDetailsDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        suitcase={selectedSuitcase}
        onOpenAcertoDialog={onOpenAcertoDialog}
        onRefresh={onRefresh}
        isAdmin={isAdmin}
        onEdit={handleEdit}
      />

      <SuitcasePrintDialog
        open={showPrintDialog}
        onOpenChange={setShowPrintDialog}
        suitcase={selectedSuitcase}
        suitcaseItems={suitcaseItemsForPrint}
        promoterInfo={promoterInfo}
      />
    </div>
  );
}
