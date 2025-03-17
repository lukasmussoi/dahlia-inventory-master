
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Trash2, Search, FilterX, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PromoterController } from "@/controllers/promoterController";
import { Promoter } from "@/types/promoter";
import { Badge } from "../ui/badge";

export const PromoterList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [isSearching, setIsSearching] = useState(false);
  const [deletePromoterId, setDeletePromoterId] = useState<string | null>(null);
  const [showingDeleted, setShowingDeleted] = useState<string | null>(null);

  // Buscar promotoras
  const {
    data: promoters = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["promoters", isSearching, searchTerm, statusFilter],
    queryFn: () =>
      isSearching
        ? PromoterController.searchPromoters(
            searchTerm, 
            statusFilter !== "todos" ? statusFilter : undefined
          )
        : PromoterController.getAllPromoters(),
  });

  useEffect(() => {
    console.log("Promotoras encontradas:", promoters.length);
  }, [promoters]);

  // Função para lidar com a pesquisa
  const handleSearch = () => {
    setIsSearching(true);
    refetch();
  };

  // Função para limpar os filtros
  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("todos");
    setIsSearching(false);
    refetch();
  };

  // Função para excluir promotora
  const handleDelete = async () => {
    if (!deletePromoterId) return;

    try {
      await PromoterController.deletePromoter(deletePromoterId);
      toast.success("Promotora excluída com sucesso");
      setShowingDeleted(deletePromoterId);
      setTimeout(() => {
        setShowingDeleted(null);
      }, 2000);
      refetch();
    } catch (error: any) {
      console.error("Erro ao excluir promotora:", error);
      toast.error(error.message || "Erro ao excluir promotora");
    } finally {
      setDeletePromoterId(null);
    }
  };

  // Função para editar promotora
  const handleEdit = (promoter: Promoter) => {
    navigate(`/dashboard/sales/promoters/${promoter.id}`);
  };

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <Input
              placeholder="Buscar promotora..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="Ativa">Ativas</SelectItem>
                  <SelectItem value="Inativa">Inativas</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSearch} className="flex-1">
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
            <Button variant="outline" onClick={handleClearFilters}>
              <FilterX className="h-4 w-4 mr-2" />
              Limpar
            </Button>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-4">Carregando promotoras...</div>
      ) : promoters.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF/CNPJ</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promoters.map((promoter: Promoter) => (
                <TableRow 
                  key={promoter.id}
                  className={showingDeleted === promoter.id ? "bg-red-50 transition-colors" : ""}
                >
                  <TableCell className="font-medium">{promoter.name}</TableCell>
                  <TableCell>{promoter.cpfCnpj}</TableCell>
                  <TableCell>{promoter.phone}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        promoter.status === "Ativa"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : "bg-red-100 text-red-800 hover:bg-red-100"
                      }
                    >
                      {promoter.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(promoter)}
                        title="Editar promotora"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletePromoterId(promoter.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir a promotora{" "}
                              <span className="font-semibold">{promoter.name}</span>?
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDelete}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-8 bg-white rounded-lg shadow-sm">
          <p className="text-muted-foreground">Nenhuma promotora encontrada</p>
        </div>
      )}
    </div>
  );
};
