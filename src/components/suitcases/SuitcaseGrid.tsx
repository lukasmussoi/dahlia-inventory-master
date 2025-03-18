
import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Suitcase } from "@/types/suitcase";
import { toast } from "sonner";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { SuitcaseItem } from "@/types/suitcase";
import { SuitcasePrintDialog } from "./SuitcasePrintDialog";
import { promoterController } from "@/controllers/promoterController";
import { suitcaseController } from "@/controllers/suitcaseController";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

interface SuitcaseGridProps {
  initialData: Suitcase[];
  onRefresh?: () => void;
}

export function SuitcaseGrid({ initialData, onRefresh }: SuitcaseGridProps) {
  const navigate = useNavigate();
  const [data, setData] = useState<Suitcase[]>(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSuitcase, setSelectedSuitcase] = useState<Suitcase | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [suitcaseItems, setSuitcaseItems] = useState<SuitcaseItem[]>([]);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [promoterInfo, setPromoterInfo] = useState<any>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(data.length);

  useEffect(() => {
    setData(initialData);
    setTotalItems(initialData.length);
  }, [initialData]);

  const calculateVisibleRange = () => {
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalItems);
    return { start, end };
  };

  const onSearch = (text: string) => {
    setSearchQuery(text);
  };

  const filteredData = searchQuery
    ? data.filter((suitcase) =>
        suitcase.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : data;

  useEffect(() => {
    // Update pagination when data changes
    setCurrentPage(1);
    setTotalItems(filteredData.length);
  }, [filteredData]);

  const handleDelete = async () => {
    if (!selectedSuitcase) return;

    try {
      await suitcaseController.deleteSuitcase(selectedSuitcase.id);
      setData(data.filter((suitcase) => suitcase.id !== selectedSuitcase.id));
      toast.success("Maleta excluída com sucesso!");
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Erro ao excluir maleta:", error);
      toast.error("Erro ao excluir maleta. Tente novamente.");
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedSuitcase(null);
    }
  };

  const handleEditClick = (suitcase: Suitcase) => {
    setSelectedSuitcase(suitcase);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (suitcase: Suitcase) => {
    setSelectedSuitcase(suitcase);
    setIsDeleteDialogOpen(true);
  };

  const handlePrintClick = async (suitcase: Suitcase) => {
    setSelectedSuitcase(suitcase);
    setPrintDialogOpen(true);

    try {
      const items = await suitcaseController.getSuitcaseItems(suitcase.id);
      setSuitcaseItems(items);
    } catch (error) {
      console.error("Erro ao buscar itens da maleta:", error);
      toast.error("Erro ao buscar itens da maleta");
    }

    // Buscar informações da promotora associada à revendedora da maleta
    if (suitcase.seller_id) {
      try {
        const promoter = await promoterController.getPromoterByResellerId(suitcase.seller_id);
        setPromoterInfo(promoter);
      } catch (error) {
        console.error("Erro ao buscar informações da promotora:", error);
        toast.error("Erro ao buscar informações da promotora");
        setPromoterInfo(null);
      }
    } else {
      setPromoterInfo(null);
    }
  };

  const onClose = () => {
    setIsEditDialogOpen(false);
    setSelectedSuitcase(null);
    if (onRefresh) {
      onRefresh();
    }
  };

  // Calculate the paginated data
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="w-full max-w-sm">
          <Input
            placeholder="Buscar maleta..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => navigate("/dashboard/suitcases/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Maleta
        </Button>
      </div>

      <div className="border rounded-md mt-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Revendedor</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((suitcase) => (
              <TableRow key={suitcase.id}>
                <TableCell>{suitcase.code}</TableCell>
                <TableCell>{suitcase.status}</TableCell>
                <TableCell>{suitcase.seller?.name || "—"}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditClick(suitcase)}>
                        <Edit className="h-4 w-4 mr-2" />
                        <span>Editar</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteClick(suitcase)}>
                        <Trash className="h-4 w-4 mr-2" />
                        <span>Excluir</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePrintClick(suitcase)}>
                        <Printer className="h-4 w-4 mr-2" />
                        <span>Imprimir</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className={cn("flex items-center justify-between py-4", data.length === 0 && "hidden")}>
        <div className="flex-1 text-sm text-muted-foreground">
          {totalItems > 0 ? `${calculateVisibleRange().start} - ${calculateVisibleRange().end} de ${totalItems} ` : "Nenhum resultado encontrado"}
        </div>
        {data.length > 0 && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <div className="text-sm">
              Página {currentPage} de {Math.ceil(totalItems / itemsPerPage)}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalItems / itemsPerPage)))}
              disabled={currentPage >= Math.ceil(totalItems / itemsPerPage)}
            >
              Próxima
            </Button>
          </div>
        )}
      </div>

      {/* Delete Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedSuitcase && (
        <SuitcasePrintDialog
          open={printDialogOpen}
          onOpenChange={setPrintDialogOpen}
          suitcase={selectedSuitcase}
          suitcaseItems={suitcaseItems}
          promoterInfo={promoterInfo}
        />
      )}
    </div>
  );
}
