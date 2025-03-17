
import { useState } from "react";
import { format } from "date-fns";
import { Briefcase, Calendar, User, MapPin, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { SuitcaseController } from "@/controllers/suitcaseController";
import { SuitcaseDetailsDialog } from "@/components/suitcases/SuitcaseDetailsDialog";
import { SuitcaseFormDialog } from "@/components/suitcases/SuitcaseFormDialog";
import { SuitcasePrintDialog } from "@/components/suitcases/SuitcasePrintDialog";
import { toast } from "sonner";

type SuitcaseGridProps = {
  suitcases: any[];
  onRefresh: () => void;
};

export function SuitcaseGrid({ suitcases, onRefresh }: SuitcaseGridProps) {
  const [selectedSuitcase, setSelectedSuitcase] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [suitcaseData, setSuitcaseData] = useState<any>(null);

  // Manipular clique em "Editar"
  const handleEdit = async (id: string) => {
    try {
      const data = await SuitcaseController.getSuitcaseById(id);
      setSelectedSuitcase(id);
      setSuitcaseData(data);
      setEditOpen(true);
    } catch (error) {
      console.error("Erro ao buscar dados da maleta:", error);
      toast.error("Erro ao carregar dados da maleta");
    }
  };

  // Manipular clique em "Detalhes"
  const handleDetails = (id: string) => {
    setSelectedSuitcase(id);
    setDetailsOpen(true);
  };

  // Manipular clique em "Imprimir"
  const handlePrint = (id: string) => {
    setSelectedSuitcase(id);
    setPrintOpen(true);
  };

  // Manipular exclusão de maleta
  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta maleta?")) {
      try {
        await SuitcaseController.deleteSuitcase(id);
        onRefresh();
      } catch (error) {
        console.error("Erro ao excluir maleta:", error);
        toast.error("Erro ao excluir maleta");
      }
    }
  };

  // Manipular atualização de maleta
  const handleSubmitEdit = async (data: any) => {
    try {
      if (selectedSuitcase) {
        await SuitcaseController.updateSuitcase(selectedSuitcase, data);
        toast.success("Maleta atualizada com sucesso");
        setEditOpen(false);
        onRefresh();
      }
    } catch (error) {
      console.error("Erro ao atualizar maleta:", error);
      toast.error("Erro ao atualizar maleta");
    }
  };

  // Se não houver maletas, exibir mensagem
  if (suitcases.length === 0) {
    return (
      <div className="text-center py-16">
        <Briefcase className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
        <h3 className="mt-4 text-lg font-medium">Nenhuma maleta encontrada</h3>
        <p className="text-muted-foreground">
          Não encontramos nenhuma maleta com os filtros atuais.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {suitcases.map((suitcase) => {
        // Formatar código da maleta
        const code = suitcase.code || `ML${suitcase.id.substring(0, 3)}`;
        
        // Obter nome da revendedora
        const resellerName = suitcase.seller?.name || "Revendedora não especificada";
        
        // Formatar data de criação
        const createdAt = format(new Date(suitcase.created_at), 'dd/MM/yyyy');
        
        // Formatar última atualização
        const updatedAt = format(new Date(suitcase.updated_at), 'dd/MM/yyyy');

        // Formatar data do próximo acerto, se existir
        const nextSettlementDate = suitcase.next_settlement_date 
          ? format(new Date(suitcase.next_settlement_date), 'dd/MM/yyyy')
          : null;
        
        return (
          <div
            key={suitcase.id}
            className="bg-card border rounded-md overflow-hidden"
          >
            <div className="p-4">
              <div className="flex justify-between">
                <div className="flex items-center">
                  <Badge
                    className={`
                      ${suitcase.status === 'in_use' ? 'bg-green-100 text-green-800' : 
                        suitcase.status === 'returned' ? 'bg-blue-100 text-blue-800' : 
                        suitcase.status === 'in_replenishment' ? 'bg-orange-100 text-orange-800' : 
                        'bg-gray-100 text-gray-800'}
                    `}
                  >
                    {SuitcaseController.formatStatus(suitcase.status)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto"
                    asChild
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDetails(suitcase.id)}>
                          Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(suitcase.id)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePrint(suitcase.id)}>
                          Imprimir
                        </DropdownMenuItem>
                        <Separator className="my-1" />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(suitcase.id)}
                        >
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </Button>
                </div>
              </div>
              
              <h3 className="text-xl font-semibold mt-2">{code}</h3>
              
              <div className="flex items-center mt-1">
                <User className="h-4 w-4 mr-1 text-muted-foreground" />
                <span>{resellerName}</span>
              </div>
              
              <div className="flex items-center mt-1">
                <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                <span>{suitcase.city} - {suitcase.neighborhood}</span>
              </div>
              
              <div className="flex flex-col gap-1 mt-3">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Criado em: {createdAt}</span>
                </div>
                
                {nextSettlementDate && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Próximo acerto: {nextSettlementDate}</span>
                  </div>
                )}
                
                <p className="text-sm text-muted-foreground">
                  Última atualização: {updatedAt}
                </p>
              </div>
            </div>
            
            <div className="bg-muted/50 p-2 flex justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDetails(suitcase.id)}
              >
                Detalhes
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(suitcase.id)}
              >
                Editar
              </Button>
            </div>
          </div>
        );
      })}

      {/* Diálogos para detalhes, edição e impressão */}
      {selectedSuitcase && (
        <>
          <SuitcaseDetailsDialog
            open={detailsOpen}
            onOpenChange={setDetailsOpen}
            suitcaseId={selectedSuitcase}
            onEdit={() => {
              setDetailsOpen(false);
              handleEdit(selectedSuitcase);
            }}
            onPrint={() => {
              setDetailsOpen(false);
              setPrintOpen(true);
            }}
          />
          <SuitcaseFormDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            onSubmit={handleSubmitEdit}
            suitcaseId={selectedSuitcase}
            onSuccess={onRefresh}
            initialData={suitcaseData}
            mode="edit"
          />
          <SuitcasePrintDialog
            open={printOpen}
            onOpenChange={setPrintOpen}
            suitcaseId={selectedSuitcase}
          />
        </>
      )}
    </div>
  );
}
