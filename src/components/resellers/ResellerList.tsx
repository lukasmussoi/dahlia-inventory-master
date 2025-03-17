
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Trash2, Search, FilterX, RefreshCw } from "lucide-react";
import { toast } from "sonner";
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
import { ResellerController } from "@/controllers/resellerController";
import { PromoterController } from "@/controllers/promoterController";
import { Reseller } from "@/types/reseller";
import { Promoter } from "@/types/promoter";
import { Badge } from "../ui/badge";

export const ResellerList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [promoterFilter, setPromoterFilter] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);
  const [deleteResellerId, setDeleteResellerId] = useState<string | null>(null);

  // Buscar revendedoras
  const {
    data: resellers = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["resellers", isSearching, searchTerm, statusFilter, promoterFilter],
    queryFn: () =>
      isSearching
        ? ResellerController.searchResellers(searchTerm, statusFilter, promoterFilter)
        : ResellerController.getAllResellers(),
    enabled: true,
  });

  // Buscar promotoras para o filtro
  const { data: promoters = [] } = useQuery({
    queryKey: ["promoters"],
    queryFn: () => PromoterController.getAllPromoters(),
  });

  useEffect(() => {
    console.log("Revendedoras encontradas:", resellers.length);
  }, [resellers]);

  // Função para lidar com a pesquisa
  const handleSearch = () => {
    setIsSearching(true);
    refetch();
  };

  // Função para limpar os filtros
  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setPromoterFilter("");
    setIsSearching(false);
    refetch();
  };

  // Função para excluir revendedora
  const handleDelete = async () => {
    if (!deleteResellerId) return;

    try {
      await ResellerController.deleteReseller(deleteResellerId);
      toast.success("Revendedora excluída com sucesso");
      refetch();
    } catch (error) {
      console.error("Erro ao excluir revendedora:", error);
      toast.error("Erro ao excluir revendedora");
    } finally {
      setDeleteResellerId(null);
    }
  };

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <Input
              placeholder="Buscar revendedora..."
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
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="Ativa">Ativas</SelectItem>
                  <SelectItem value="Inativa">Inativas</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select
              value={promoterFilter}
              onValueChange={setPromoterFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Promotora" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="">Todas as promotoras</SelectItem>
                  {promoters.map((promoter: Promoter) => (
                    <SelectItem key={promoter.id} value={promoter.id}>
                      {promoter.name}
                    </SelectItem>
                  ))}
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
        <div className="text-center py-4">Carregando revendedoras...</div>
      ) : resellers.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
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
              {resellers.map((reseller: Reseller) => (
                <TableRow key={reseller.id}>
                  <TableCell className="font-medium">{reseller.name}</TableCell>
                  <TableCell>{reseller.cpfCnpj}</TableCell>
                  <TableCell>{reseller.phone}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        reseller.status === "Ativa"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : "bg-red-100 text-red-800 hover:bg-red-100"
                      }
                    >
                      {reseller.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{reseller.promoterName}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          window.location.href = `/dashboard/sales/resellers/${reseller.id}`
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteResellerId(reseller.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir a revendedora{" "}
                              <span className="font-semibold">{reseller.name}</span>?
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
          <p className="text-muted-foreground">Nenhuma revendedora encontrada</p>
        </div>
      )}
    </div>
  );
};
