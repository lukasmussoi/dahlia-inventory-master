
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Pencil, Trash2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { ResellerController } from "@/controllers/resellerController";
import { PromoterController } from "@/controllers/promoterController";
import { ResellerForm } from "./ResellerForm";
import { Reseller } from "@/types/reseller";
import { Promoter } from "@/types/promoter";
import { LoadingIndicator } from "@/components/shared/LoadingIndicator";

export function ResellerList() {
  const navigate = useNavigate();
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [promoterFilter, setPromoterFilter] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedResellerId, setSelectedResellerId] = useState<string | null>(null);
  const [deleteResellerId, setDeleteResellerId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [paginatedResellers, setPaginatedResellers] = useState<Reseller[]>([]);

  // Buscar revendedoras
  const fetchResellers = async () => {
    try {
      setIsLoading(true);
      console.log("Buscando revendedoras com filtros:", { searchQuery, statusFilter, promoterFilter });
      const data = await ResellerController.searchResellers(
        searchQuery,
        statusFilter,
        promoterFilter
      );
      console.log("Revendedoras encontradas:", data.length);
      setResellers(data);
    } catch (error) {
      console.error("Erro ao buscar revendedoras:", error);
      toast.error("Erro ao carregar revendedoras");
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar promotoras
  const fetchPromoters = async () => {
    try {
      console.log("Buscando promotoras...");
      const data = await PromoterController.getAllPromoters();
      console.log("Promotoras encontradas:", data.length);
      setPromoters(data);
    } catch (error) {
      console.error("Erro ao buscar promotoras:", error);
      toast.error("Erro ao carregar promotoras");
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    console.log("Carregando dados iniciais da lista de revendedoras...");
    fetchResellers();
    fetchPromoters();
  }, []);

  // Atualizar quando os filtros mudarem
  useEffect(() => {
    console.log("Filtros atualizados, buscando revendedoras...");
    fetchResellers();
  }, [searchQuery, statusFilter, promoterFilter]);

  // Atualizar paginação
  useEffect(() => {
    setTotalPages(Math.ceil(resellers.length / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedResellers(resellers.slice(startIndex, endIndex));
  }, [resellers, currentPage]);

  // Gerenciar edição
  const handleEdit = (id: string) => {
    setSelectedResellerId(id);
    setIsEditDialogOpen(true);
  };

  // Abrir diálogo de exclusão
  const handleDeleteClick = (id: string) => {
    setDeleteResellerId(id);
    setIsDeleteDialogOpen(true);
  };

  // Confirmar exclusão
  const confirmDelete = async () => {
    if (!deleteResellerId) return;
    
    try {
      await ResellerController.deleteReseller(deleteResellerId);
      toast.success("Revendedora excluída com sucesso!");
      fetchResellers();
      setIsDeleteDialogOpen(false);
      setDeleteResellerId(null);
    } catch (error) {
      console.error("Erro ao excluir revendedora:", error);
      toast.error("Erro ao excluir revendedora");
    }
  };

  // Gerenciar mudança de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Lidar com pesquisa em tempo real
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Voltar para a primeira página ao pesquisar
  };

  if (isLoading && resellers.length === 0) {
    return <LoadingIndicator message="Carregando lista de revendedoras..." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <div className="flex items-center gap-2 w-full sm:w-64">
            <div className="relative w-full">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar revendedora..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-8"
              />
            </div>
          </div>
          
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="Ativa">Ativas</SelectItem>
              <SelectItem value="Inativa">Inativas</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={promoterFilter}
            onValueChange={setPromoterFilter}
          >
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Promotora" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              {promoters.map(promoter => (
                <SelectItem key={promoter.id} value={promoter.id}>
                  {promoter.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead className="hidden md:table-cell">CPF/CNPJ</TableHead>
              <TableHead className="hidden md:table-cell">Promotora</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : paginatedResellers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  Nenhuma revendedora encontrada
                </TableCell>
              </TableRow>
            ) : (
              paginatedResellers.map((reseller) => (
                <TableRow key={reseller.id}>
                  <TableCell className="font-medium">{reseller.name}</TableCell>
                  <TableCell>{reseller.phone}</TableCell>
                  <TableCell className="hidden md:table-cell">{reseller.cpfCnpj}</TableCell>
                  <TableCell className="hidden md:table-cell">{reseller.promoterName}</TableCell>
                  <TableCell>
                    <Badge variant={reseller.status === "Ativa" ? "default" : "secondary"}>
                      {reseller.status === "Ativa" ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {reseller.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(reseller.id)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(reseller.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Excluir</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) handlePageChange(currentPage - 1);
                }}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNumber;
              if (totalPages <= 5) {
                pageNumber = i + 1;
              } else if (currentPage <= 3) {
                pageNumber = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + i;
              } else {
                pageNumber = currentPage - 2 + i;
              }
              
              return (
                <PaginationItem key={i}>
                  <PaginationLink
                    href="#"
                    isActive={pageNumber === currentPage}
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(pageNumber);
                    }}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(totalPages);
                    }}
                  >
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}
            
            <PaginationItem>
              <PaginationNext 
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) handlePageChange(currentPage + 1);
                }}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Diálogo de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Editar Revendedora</DialogTitle>
            <DialogDescription>
              Edite as informações da revendedora.
            </DialogDescription>
          </DialogHeader>
          {selectedResellerId && (
            <ResellerForm
              resellerId={selectedResellerId}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                fetchResellers();
              }}
              isDialog={true}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Revendedora</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta revendedora? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
