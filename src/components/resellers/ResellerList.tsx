
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ResellerController } from "@/controllers/resellerController";
import { Reseller, ResellerStatus } from "@/types/reseller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Search, Filter, X, User, Phone } from "lucide-react";
import { ResellerForm } from "./ResellerForm";
import { formatPhone } from "@/utils/formatUtils";

export function ResellerList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [promoterFilter, setPromoterFilter] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedReseller, setSelectedReseller] = useState<Reseller | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [resellerToDelete, setResellerToDelete] = useState<Reseller | null>(null);

  // Buscar revendedoras
  const { 
    data: resellers, 
    isLoading: isLoadingResellers,
    refetch: refetchResellers
  } = useQuery({
    queryKey: ['resellers'],
    queryFn: () => ResellerController.getAllResellers(),
  });

  // Buscar promotoras para o filtro
  const { 
    data: promoters, 
    isLoading: isLoadingPromoters 
  } = useQuery({
    queryKey: ['promoters'],
    queryFn: () => ResellerController.getAllPromoters(),
  });

  // Filtrar revendedoras
  const filteredResellers = resellers?.filter(reseller => {
    // Filtro de busca por texto
    if (searchTerm && 
        !reseller.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !reseller.cpfCnpj.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Filtro por status
    if (statusFilter !== "all" && reseller.status !== statusFilter) {
      return false;
    }

    // Filtro por promotora
    if (promoterFilter !== "all" && reseller.promoterId !== promoterFilter) {
      return false;
    }

    return true;
  });

  // Abrir formulário para edição
  const handleEdit = (reseller: Reseller) => {
    setSelectedReseller(reseller);
    setIsFormOpen(true);
  };

  // Abrir diálogo de confirmação para exclusão
  const handleDeleteClick = (reseller: Reseller) => {
    setResellerToDelete(reseller);
    setIsDeleteDialogOpen(true);
  };

  // Executar exclusão
  const confirmDelete = async () => {
    if (!resellerToDelete) return;
    try {
      await ResellerController.deleteReseller(resellerToDelete.id);
      toast.success("Revendedora excluída com sucesso!");
      refetchResellers();
    } catch (error) {
      console.error("Erro ao excluir revendedora:", error);
      toast.error("Erro ao excluir revendedora. Tente novamente.");
    } finally {
      setIsDeleteDialogOpen(false);
      setResellerToDelete(null);
    }
  };

  // Callback para após salvar no formulário
  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedReseller(null);
    refetchResellers();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Revendedoras</h2>
        <Button 
          onClick={() => {
            setSelectedReseller(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Nova Revendedora
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou CPF/CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span>Status</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="Ativa">Ativas</SelectItem>
                  <SelectItem value="Inativa">Inativas</SelectItem>
                </SelectContent>
              </Select>

              <Select value={promoterFilter} onValueChange={setPromoterFilter}>
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Promotora</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Promotoras</SelectItem>
                  {promoters?.map(promoter => (
                    <SelectItem key={promoter.id} value={promoter.id}>
                      {promoter.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(searchTerm || statusFilter !== "all" || promoterFilter !== "all") && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setPromoterFilter("all");
                  }}
                >
                  <X className="h-4 w-4 mr-2" /> Limpar Filtros
                </Button>
              )}
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF/CNPJ</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Promotora</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingResellers ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredResellers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Nenhuma revendedora encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredResellers?.map((reseller) => (
                    <TableRow key={reseller.id}>
                      <TableCell className="font-medium">{reseller.name}</TableCell>
                      <TableCell>{reseller.cpfCnpj}</TableCell>
                      <TableCell>{formatPhone(reseller.phone)}</TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          reseller.status === 'Ativa'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {reseller.status}
                        </div>
                      </TableCell>
                      <TableCell>{reseller.promoterName}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(reseller)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDeleteClick(reseller)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Cadastro/Edição */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedReseller ? "Editar Revendedora" : "Nova Revendedora"}
            </DialogTitle>
          </DialogHeader>
          <ResellerForm 
            reseller={selectedReseller}
            onCancel={() => setIsFormOpen(false)}
            onSuccess={handleFormSuccess}
          />
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a revendedora "{resellerToDelete?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
