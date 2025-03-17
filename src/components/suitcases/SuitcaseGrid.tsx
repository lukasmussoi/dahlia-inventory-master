
import { useState } from "react";
import { 
  MoreVertical, 
  Briefcase, 
  Edit, 
  Trash2, 
  Eye, 
  Printer,
  Calendar 
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { SuitcaseController } from "@/controllers/suitcaseController";
import { SuitcaseDetailsDialog } from "@/components/suitcases/SuitcaseDetailsDialog";
import { SuitcaseFormDialog } from "@/components/suitcases/SuitcaseFormDialog";
import { SuitcasePrintDialog } from "@/components/suitcases/SuitcasePrintDialog";

interface SuitcaseGridProps {
  suitcases: any[];
  onRefresh: () => void;
}

export function SuitcaseGrid({ suitcases, onRefresh }: SuitcaseGridProps) {
  const [suitcaseToDelete, setSuitcaseToDelete] = useState<string | null>(null);
  const [suitcaseToEdit, setSuitcaseToEdit] = useState<any | null>(null);
  const [suitcaseToView, setSuitcaseToView] = useState<any | null>(null);
  const [suitcaseToPrint, setSuitcaseToPrint] = useState<any | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_use': return "bg-green-500";
      case 'returned': return "bg-blue-500";
      case 'in_replenishment': return "bg-orange-500";
      case 'in_audit': return "bg-yellow-500";
      case 'lost': return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const handleDelete = async () => {
    if (suitcaseToDelete) {
      await SuitcaseController.deleteSuitcase(suitcaseToDelete);
      setSuitcaseToDelete(null);
      onRefresh();
    }
  };

  const handleEdit = async (data) => {
    if (suitcaseToEdit) {
      await SuitcaseController.updateSuitcase(suitcaseToEdit.id, data);
      setSuitcaseToEdit(null);
      onRefresh();
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    try {
      return format(parseISO(dateStr), 'dd/MM/yyyy');
    } catch (e) {
      console.error("Erro ao formatar data:", e);
      return null;
    }
  };

  if (suitcases.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/60" />
        <h3 className="mt-4 text-lg font-medium">Nenhuma maleta encontrada</h3>
        <p className="mt-2 text-muted-foreground">
          Não há maletas cadastradas ou correspondentes aos filtros aplicados.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {suitcases.map((suitcase) => {
          // Formatar o código da maleta (se existir) ou usar os primeiros 6 caracteres do ID como código
          const code = suitcase.code || `ML${suitcase.id.substring(0, 3)}`;
          
          // Obter o nome da revendedora corretamente
          const resellerName = suitcase.seller && suitcase.seller.name 
            ? suitcase.seller.name 
            : "Revendedora não especificada";
          
          // Formatar a data de atualização
          const updatedAt = suitcase.updated_at 
            ? format(new Date(suitcase.updated_at), 'dd/MM/yyyy HH:mm')
            : "Data não disponível";
            
          // Formatar a data do próximo acerto
          const nextSettlementDate = formatDate(suitcase.next_settlement_date);
          
          return (
            <Card key={suitcase.id} className="overflow-hidden border border-muted">
              <div className={`h-2 ${getStatusColor(suitcase.status)}`}></div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-md ${getStatusColor(suitcase.status)} bg-opacity-20`}>
                      <Briefcase className={`h-5 w-5 text-${suitcase.status === 'in_use' ? 'green' : suitcase.status === 'returned' ? 'blue' : suitcase.status === 'in_replenishment' ? 'orange' : 'gray'}-700`} />
                    </div>
                    <div>
                      <h3 className="font-medium">{code}</h3>
                      <Badge
                        variant="outline"
                        className={`mt-1 ${
                          suitcase.status === 'in_use'
                            ? 'bg-green-100 text-green-800 hover:bg-green-100'
                            : suitcase.status === 'returned'
                            ? 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                            : suitcase.status === 'in_replenishment'
                            ? 'bg-orange-100 text-orange-800 hover:bg-orange-100'
                            : 'bg-gray-100'
                        }`}
                      >
                        {SuitcaseController.formatStatus(suitcase.status)}
                      </Badge>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 rounded-md hover:bg-muted">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => setSuitcaseToView(suitcase)}>
                        <Eye className="h-4 w-4 mr-2" /> Ver detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSuitcaseToEdit(suitcase)}>
                        <Edit className="h-4 w-4 mr-2" /> Editar maleta
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSuitcaseToPrint(suitcase)}>
                        <Printer className="h-4 w-4 mr-2" /> Imprimir etiqueta
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setSuitcaseToDelete(suitcase.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Excluir maleta
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="mt-4">
                  <div className="text-sm">
                    <p className="font-medium">{resellerName}</p>
                    <p className="text-muted-foreground mt-1">
                      {suitcase.city && suitcase.neighborhood
                        ? `${suitcase.city} - ${suitcase.neighborhood}`
                        : "Localização não especificada"}
                    </p>
                    
                    {nextSettlementDate && (
                      <div className="flex items-center mt-2 text-xs text-gray-600">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>Próximo acerto: {nextSettlementDate}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-border flex justify-between text-xs text-muted-foreground">
                    <span>Atualizado: {updatedAt}</span>
                  </div>

                  <button 
                    className="mt-3 w-full py-1 px-2 text-sm bg-muted hover:bg-muted/80 rounded-md transition-colors"
                    onClick={() => setSuitcaseToView(suitcase)}
                  >
                    Detalhes
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog de confirmação para excluir maleta */}
      <AlertDialog open={!!suitcaseToDelete} onOpenChange={(open) => !open && setSuitcaseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta maleta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog para editar maleta */}
      {suitcaseToEdit && (
        <SuitcaseFormDialog
          open={!!suitcaseToEdit}
          onOpenChange={(open) => !open && setSuitcaseToEdit(null)}
          onSubmit={handleEdit}
          initialData={suitcaseToEdit}
          mode="edit"
        />
      )}

      {/* Dialog para ver detalhes da maleta */}
      {suitcaseToView && (
        <SuitcaseDetailsDialog
          open={!!suitcaseToView}
          onOpenChange={(open) => !open && setSuitcaseToView(null)}
          suitcaseId={suitcaseToView.id}
          onEdit={() => {
            setSuitcaseToEdit(suitcaseToView);
            setSuitcaseToView(null);
          }}
          onPrint={() => {
            setSuitcaseToPrint(suitcaseToView);
            setSuitcaseToView(null);
          }}
        />
      )}

      {/* Dialog para imprimir maleta */}
      {suitcaseToPrint && (
        <SuitcasePrintDialog
          open={!!suitcaseToPrint}
          onOpenChange={(open) => !open && setSuitcaseToPrint(null)}
          suitcaseId={suitcaseToPrint.id}
        />
      )}
    </>
  );
}
