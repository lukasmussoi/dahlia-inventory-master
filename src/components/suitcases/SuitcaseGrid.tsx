
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Edit, Copy, Printer, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ResellerModel } from "@/models/resellerModel";
import { SuitcaseController } from "@/controllers/suitcaseController";
import { ResellerDetails } from "@/components/resellers/ResellerDetails";
import { ResellerFormDialog } from "@/components/resellers/ResellerFormDialog";
import { SuitcaseFormDialog } from "@/components/suitcases/SuitcaseFormDialog";
import { SuitcasePrintDialog } from "@/components/suitcases/SuitcasePrintDialog";
import { SuitcaseDetailsDialog } from "@/components/suitcases/SuitcaseDetailsDialog";
import { Suitcase } from "@/types/suitcase";

interface SuitcaseGridProps {
  suitcases: any[];
  onRefresh: () => void;
}

export function SuitcaseGrid({ suitcases, onRefresh }: SuitcaseGridProps) {
  const [selectedSuitcase, setSelectedSuitcase] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showResellerDetails, setShowResellerDetails] = useState(false);
  const [showEditResellerDialog, setShowEditResellerDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
    } catch (error) {
      console.error("Erro ao formatar a data:", error);
      return "Data inválida";
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado para a área de transferência");
  };

  const handleDeleteSuitcase = async () => {
    if (!selectedSuitcase) return;

    try {
      await SuitcaseController.deleteSuitcase(selectedSuitcase.id);
      toast.success("Maleta excluída com sucesso");
      onRefresh();
    } catch (error) {
      console.error("Erro ao excluir maleta:", error);
      toast.error("Erro ao excluir maleta");
    } finally {
      setShowDeleteDialog(false);
      setSelectedSuitcase(null);
    }
  };

  const handleOpenResellerDetails = async (sellerId: string) => {
    try {
      const reseller = await SuitcaseController.getResellerById(sellerId);
      setSelectedSuitcase(reseller);
      setShowResellerDetails(true);
    } catch (error) {
      console.error("Erro ao buscar detalhes da revendedora:", error);
      toast.error("Erro ao carregar detalhes da revendedora");
    }
  };

  const handleEditSuitcase = async (data: any) => {
    if (!selectedSuitcase) return;

    try {
      await SuitcaseController.updateSuitcase(selectedSuitcase.id, data);
      toast.success("Maleta atualizada com sucesso");
      onRefresh();
    } catch (error) {
      console.error("Erro ao atualizar maleta:", error);
      toast.error("Erro ao atualizar maleta");
    } finally {
      setShowEditDialog(false);
      setSelectedSuitcase(null);
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Revendedora</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Cidade</TableHead>
            <TableHead>Bairro</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suitcases.map((suitcase) => (
            <TableRow key={suitcase.id}>
              <TableCell className="font-medium">{suitcase.code || `ML${suitcase.id.substring(0, 3)}`}</TableCell>
              <TableCell>
                <Button
                  variant="link"
                  onClick={() => handleOpenResellerDetails(suitcase.seller_id)}
                >
                  {suitcase.seller?.name || "Revendedora não especificada"}
                </Button>
              </TableCell>
              <TableCell>
                <Badge
                  className={cn(
                    suitcase.status === "in_use"
                      ? "bg-green-100 text-green-800"
                      : suitcase.status === "returned"
                      ? "bg-blue-100 text-blue-800"
                      : suitcase.status === "in_replenishment"
                      ? "bg-orange-100 text-orange-800"
                      : "bg-gray-100 text-gray-800"
                  )}
                >
                  {SuitcaseController.formatStatus(suitcase.status)}
                </Badge>
              </TableCell>
              <TableCell>{suitcase.city}</TableCell>
              <TableCell>{suitcase.neighborhood}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menu</span>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => {
                        handleCopyCode(suitcase.code || `ML${suitcase.id.substring(0, 3)}`);
                      }}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar código
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedSuitcase(suitcase);
                        setShowDetailsDialog(true);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Ver Detalhes
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedSuitcase(suitcase);
                        setShowEditDialog(true);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedSuitcase(suitcase);
                        setShowPrintDialog(true);
                      }}
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Imprimir
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedSuitcase(suitcase);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá excluir a maleta permanentemente. Tem certeza que
              deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSuitcase}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reseller Details Dialog */}
      <ResellerDetails
        open={showResellerDetails}
        onOpenChange={setShowResellerDetails}
        reseller={selectedSuitcase}
        onEdit={() => {
          setShowResellerDetails(false);
          setShowEditResellerDialog(true);
        }}
      />

      {/* Reseller Edit Dialog */}
      <ResellerFormDialog
        open={showEditResellerDialog}
        onOpenChange={setShowEditResellerDialog}
        reseller={selectedSuitcase}
        onSubmit={async (data) => {
          if (!selectedSuitcase) return;
          try {
            await ResellerModel.update(selectedSuitcase.id, data);
            toast.success("Revendedora atualizada com sucesso");
            onRefresh();
          } catch (error) {
            console.error("Erro ao atualizar revendedora:", error);
            toast.error("Erro ao atualizar revendedora");
          } finally {
            setShowEditResellerDialog(false);
            setSelectedSuitcase(null);
          }
        }}
      />

      {/* Suitcase Edit Dialog */}
      <SuitcaseFormDialog 
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSubmit={handleEditSuitcase}
        initialData={selectedSuitcase}
        mode="edit"
      />

      {/* Suitcase Print Dialog */}
      <SuitcasePrintDialog
        open={showPrintDialog}
        onOpenChange={setShowPrintDialog}
        suitcase={selectedSuitcase}
        suitcaseItems={[]}
      />

      {/* Suitcase Details Dialog */}
      <SuitcaseDetailsDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        suitcaseId={selectedSuitcase?.id || ""}
        onEdit={() => {
          setShowDetailsDialog(false);
          setShowEditDialog(true);
        }}
        onPrint={() => {
          setShowDetailsDialog(false);
          setShowPrintDialog(true);
        }}
      />
    </>
  );
}
