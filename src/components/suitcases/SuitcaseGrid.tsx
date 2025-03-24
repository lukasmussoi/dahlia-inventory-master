
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Suitcase } from "@/types/suitcase";
import { SuitcaseDetailsDialog } from "./SuitcaseDetailsDialog";
import { SuitcasePrintDialog } from "./SuitcasePrintDialog";
import { SuitcaseFormDialog } from "./SuitcaseFormDialog";
import { SuitcaseController } from "@/controllers/suitcaseController";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Archive, RotateCcw, Calculator, Check, EllipsisVertical, Eye, Pencil, Printer, Truck } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface SuitcaseGridProps {
  suitcases: Suitcase[];
  isAdmin?: boolean;
  onRefresh: () => void;
  onOpenAcertoDialog: (suitcase: Suitcase) => void;
}

export function SuitcaseGrid({ suitcases, isAdmin = false, onRefresh, onOpenAcertoDialog }: SuitcaseGridProps) {
  const [selectedSuitcase, setSelectedSuitcase] = useState<Suitcase | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState<{ [key: string]: boolean }>({});
  const navigate = useNavigate();

  // Status badge color
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'in_use':
        return 'bg-green-100 text-green-800';
      case 'returned':
        return 'bg-blue-100 text-blue-800';
      case 'lost':
        return 'bg-red-100 text-red-800';
      case 'in_audit':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_replenishment':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_use':
        return 'Em Uso';
      case 'returned':
        return 'Devolvida';
      case 'lost':
        return 'Perdida';
      case 'in_audit':
        return 'Em Auditoria';
      case 'in_replenishment':
        return 'Em Reposição';
      default:
        return status;
    }
  };

  // Format date
  const formatDate = (date: string | null | undefined) => {
    if (!date) return "-";
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  // View details
  const handleViewDetails = (suitcase: Suitcase) => {
    setSelectedSuitcase(suitcase);
    setShowDetailsDialog(true);
  };

  // Print dialog
  const handleOpenPrintDialog = (suitcase: Suitcase) => {
    setSelectedSuitcase(suitcase);
    setShowPrintDialog(true);
  };

  // Edit suitcase
  const handleEditSuitcase = (suitcase: Suitcase) => {
    setSelectedSuitcase(suitcase);
    setShowEditDialog(true);
  };

  // Handle update suitcase
  const handleUpdateSuitcase = async (suitcaseId: string, updatedData: any) => {
    try {
      await SuitcaseController.updateSuitcase(suitcaseId, updatedData);
      
      toast.success("Maleta atualizada com sucesso");
      setShowEditDialog(false);
      onRefresh();
    } catch (error) {
      console.error("Erro ao atualizar maleta:", error);
      toast.error("Erro ao atualizar maleta");
    }
  };

  // Update status
  const handleUpdateStatus = async (suitcase: Suitcase, newStatus: string) => {
    setIsUpdating(prev => ({ ...prev, [suitcase.id]: true }));
    try {
      await SuitcaseController.updateSuitcase(suitcase.id, { status: newStatus });
      toast.success(`Status da maleta atualizado com sucesso`);
      onRefresh();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status da maleta");
    } finally {
      setIsUpdating(prev => ({ ...prev, [suitcase.id]: false }));
    }
  };

  if (suitcases.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-lg p-8 text-center">
        <div>
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">Nenhuma maleta encontrada</h3>
          <p className="mt-1 text-sm text-gray-500">Tente ajustar os filtros ou criar uma nova maleta.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
        {suitcases.map((suitcase) => {
          const isUpdatingThis = isUpdating[suitcase.id] || false;
          
          return (
            <Card key={suitcase.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-white p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-grow">
                    <div className="flex items-center justify-between">
                      <div className="flex-grow">
                        <h3 className="text-lg font-semibold text-gray-900 inline-flex items-center">
                          <svg className="w-5 h-5 mr-1 text-pink-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 7H4C2.89543 7 2 7.89543 2 9V17C2 18.1046 2.89543 19 4 19H20C21.1046 19 22 18.1046 22 17V9C22 7.89543 21.1046 7 20 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 12H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M16 7V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          {suitcase.code || `Maleta #${suitcase.id.substring(0, 8)}`}
                        </h3>
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(suitcase.status)}`}>
                          {getStatusLabel(suitcase.status)}
                        </div>
                      </div>
                      <div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <EllipsisVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(suitcase)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => handleOpenPrintDialog(suitcase)}>
                              <Printer className="mr-2 h-4 w-4" />
                              Imprimir
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => handleEditSuitcase(suitcase)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => onOpenAcertoDialog(suitcase)}>
                              <Calculator className="mr-2 h-4 w-4" />
                              Fazer Acerto
                            </DropdownMenuItem>
                            
                            {isAdmin && (
                              <>
                                {suitcase.status === 'in_use' && (
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(suitcase, 'returned')}>
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Marcar como Devolvida
                                  </DropdownMenuItem>
                                )}
                                
                                {suitcase.status === 'returned' && (
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(suitcase, 'in_use')}>
                                    <Truck className="mr-2 h-4 w-4" />
                                    Marcar como Em Uso
                                  </DropdownMenuItem>
                                )}
                                
                                {suitcase.status !== 'in_replenishment' && (
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(suitcase, 'in_replenishment')}>
                                    <Archive className="mr-2 h-4 w-4" />
                                    Marcar Em Reposição
                                  </DropdownMenuItem>
                                )}
                                
                                {suitcase.status === 'in_replenishment' && (
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(suitcase, 'in_use')}>
                                    <Check className="mr-2 h-4 w-4" />
                                    Concluir Reposição
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-700">
                      <div><span className="font-medium">Revendedora:</span> {suitcase.seller?.name || '-'}</div>
                      <div><span className="font-medium">Local:</span> {suitcase.neighborhood}, {suitcase.city}</div>
                      <div><span className="font-medium">Desde:</span> {formatDate(suitcase.sent_at)}</div>
                      {suitcase.next_settlement_date && (
                        <div><span className="font-medium">Próximo acerto:</span> {formatDate(suitcase.next_settlement_date)}</div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewDetails(suitcase)}
                  >
                    <Eye className="mr-1 h-4 w-4" />
                    Detalhes
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onOpenAcertoDialog(suitcase)}
                  >
                    <Calculator className="mr-1 h-4 w-4" />
                    Acerto
                  </Button>
                  
                  {isUpdatingThis && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled
                    >
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-pink-500"></div>
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Dialog de Detalhes */}
      <SuitcaseDetailsDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        suitcaseId={selectedSuitcase?.id || null}
        onRefresh={onRefresh}
        isAdmin={isAdmin}
      />

      {/* Dialog de Impressão */}
      <SuitcasePrintDialog
        open={showPrintDialog}
        onOpenChange={setShowPrintDialog}
        suitcase={selectedSuitcase}
      />

      {/* Dialog de Edição */}
      <SuitcaseFormDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSubmit={(data) => handleUpdateSuitcase(selectedSuitcase?.id || "", data)}
        suitcase={selectedSuitcase}
        mode="edit"
      />
    </div>
  );
}
