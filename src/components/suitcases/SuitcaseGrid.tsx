
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PackagePlus, UserPlus, Edit, Trash2, FileDown, CheckCircle, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Suitcase, SuitcaseStatus } from "@/types/suitcase";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { suitcaseController } from "@/controllers/suitcaseController";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SuitcaseDetailsDialog } from "@/components/suitcases/SuitcaseDetailsDialog";
import { SuitcaseAcertoDialog } from "@/components/suitcases/SuitcaseAcertoDialog";

interface SuitcaseGridProps {
  suitcases: Suitcase[];
  isAdmin: boolean | undefined;
  onRefresh: () => void;
  onOpenAcertoDialog: (suitcase: Suitcase) => void;
}

export function SuitcaseGrid({ suitcases, isAdmin, onRefresh, onOpenAcertoDialog }: SuitcaseGridProps) {
  const [deleteSuitcaseId, setDeleteSuitcaseId] = useState<string | null>(null);
  const [openAcertoDialog, setOpenAcertoDialog] = useState(false);
  const [selectedSuitcase, setSelectedSuitcase] = useState<Suitcase | null>(null);

  const queryClient = useQueryClient();

  // Corrigindo a mutação para usar a sintaxe correta
  const deleteSuitcaseMutation = useMutation({
    mutationFn: (id: string) => suitcaseController.deleteSuitcase(id),
    onSuccess: () => {
      toast.success("Maleta excluída com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['suitcases'] });
      setDeleteSuitcaseId(null);
      onRefresh();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Erro ao excluir a maleta.");
    },
  });

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
  };

  const formatStatus = (status: SuitcaseStatus): { label: string, color: string } => {
    switch (status) {
      case 'in_use':
        return { label: 'Em Uso', color: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' };
      case 'returned':
        return { label: 'Devolvida', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100' };
      case 'in_replenishment':
        return { label: 'Em Reposição', color: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' };
      case 'lost':
        return { label: 'Perdida', color: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' };
      case 'in_audit':
        return { label: 'Em Auditoria', color: 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100' };
      default:
        return { label: 'Desconhecido', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100' };
    }
  };

  const handleOpenDeleteConfirmation = (suitcaseId: string) => {
    setDeleteSuitcaseId(suitcaseId);
  };

  const handleCloseDeleteConfirmation = () => {
    setDeleteSuitcaseId(null);
  };

  const handleDeleteSuitcase = async () => {
    if (deleteSuitcaseId) {
      deleteSuitcaseMutation.mutate(deleteSuitcaseId);
    }
  };

  const handleOpenAcertoDialog = (suitcase: Suitcase) => {
    setSelectedSuitcase(suitcase);
    setOpenAcertoDialog(true);
  };

  const handleCloseAcertoDialog = () => {
    setSelectedSuitcase(null);
    setOpenAcertoDialog(false);
  };

  const handleEdit = (suitcase: Suitcase) => {
    // Implemente a lógica para editar a maleta aqui
    toast.info(`Editar maleta ${suitcase.code}`);
  };

  if (!suitcases || suitcases.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Nenhuma maleta encontrada.</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Cidade</TableHead>
            <TableHead>Bairro</TableHead>
            <TableHead>Data de Envio</TableHead>
            <TableHead>Próximo Acerto</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suitcases.map((suitcase) => {
            const statusInfo = formatStatus(suitcase.status);

            return (
              <TableRow key={suitcase.id}>
                <TableCell className="font-medium">{suitcase.code}</TableCell>
                <TableCell>
                  <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                </TableCell>
                <TableCell>{suitcase.city}</TableCell>
                <TableCell>{suitcase.neighborhood}</TableCell>
                <TableCell>{suitcase.sent_at ? formatDate(suitcase.sent_at) : 'Não Enviada'}</TableCell>
                <TableCell>{suitcase.next_settlement_date ? formatDate(suitcase.next_settlement_date) : 'Nenhuma data definida'}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onOpenAcertoDialog(suitcase)}>
                        <FileDown className="mr-2 h-4 w-4" />
                        Registrar Acerto
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {isAdmin && (
                        <>
                          <DropdownMenuItem onClick={() => handleEdit(suitcase)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenDeleteConfirmation(suitcase.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <AlertDialog open={!!deleteSuitcaseId} onOpenChange={(open) => {
        if (!open) handleCloseDeleteConfirmation();
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá excluir a maleta permanentemente. Tem certeza que deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseDeleteConfirmation}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={deleteSuitcaseMutation.isPending} onClick={handleDeleteSuitcase}>
              {deleteSuitcaseMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedSuitcase && (
        <SuitcaseAcertoDialog
          open={openAcertoDialog}
          onOpenChange={setOpenAcertoDialog}
          suitcase={selectedSuitcase}
          onRefresh={onRefresh}
          onClose={handleCloseAcertoDialog}
        />
      )}

      {/* Pass only suitcaseId to SuitcaseDetailsDialog */}
      {suitcases.map((suitcase) => (
        <SuitcaseDetailsDialog
          key={suitcase.id}
          suitcaseId={suitcase.id}
        />
      ))}
    </>
  );
}
