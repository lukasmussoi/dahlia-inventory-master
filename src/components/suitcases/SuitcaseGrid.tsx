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
import { useRouter } from "next/navigation";
import { Suitcase } from "@/types/suitcase";
import { deleteSuitcase } from "@/services/suitcaseService";
import { toast } from "sonner";
import { MoreDropdown } from "@/components/ui/more-dropdown";
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
import { SuitcaseForm } from "./SuitcaseForm";
import { SearchBar } from "@/components/ui/search-bar";
import {
  Pagination,
  usePagination,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { SuitcaseItem } from "@/types/suitcase";
import { getSuitcaseItems } from "@/services/suitcaseItemService";
import { SuitcasePrintDialog } from "./SuitcasePrintDialog";
import { promoterController } from "@/controllers/promoterController";

interface SuitcaseGridProps {
  initialData: Suitcase[];
}

export function SuitcaseGrid({ initialData }: SuitcaseGridProps) {
  const router = useRouter();
  const [data, setData] = useState<Suitcase[]>(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSuitcase, setSelectedSuitcase] = useState<Suitcase | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [suitcaseItems, setSuitcaseItems] = useState<SuitcaseItem[]>([]);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [promoterInfo, setPromoterInfo] = useState<any>(null);

  // Pagination
  const {
    currentPage,
    itemsPerPage,
    totalItems,
    setCurrentPage,
    setVisibleRange,
  } = usePagination({
    initialItemsPerPage: 10,
    initialTotalItems: data.length,
  });

  const paginatedData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setVisibleRange();
  }, [currentPage, itemsPerPage, setVisibleRange]);

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
  }, [filteredData, setCurrentPage]);

  const handleDelete = async () => {
    if (!selectedSuitcase) return;

    try {
      await deleteSuitcase(selectedSuitcase.id);
      setData(data.filter((suitcase) => suitcase.id !== selectedSuitcase.id));
      toast.success("Maleta excluída com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir maleta:", error);
      toast.error("Erro ao excluir maleta. Tente novamente.");
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedSuitcase(null);
      router.refresh();
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
      const items = await getSuitcaseItems(suitcase.id);
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
    router.refresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <SearchBar onSearch={onSearch} placeholder="Buscar maleta..." />
        <Button onClick={() => router.push("/suitcases/new")}>
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
                  <MoreDropdown>
                    <button
                      onClick={() => handleEditClick(suitcase)}
                      className="flex items-center space-x-2 hover:bg-gray-100 px-3 py-1.5 rounded-md text-sm"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => handleDeleteClick(suitcase)}
                      className="flex items-center space-x-2 hover:bg-gray-100 px-3 py-1.5 rounded-md text-sm"
                    >
                      <Trash className="h-4 w-4" />
                      <span>Excluir</span>
                    </button>
                    <button
                      onClick={() => handlePrintClick(suitcase)}
                      className="flex items-center space-x-2 hover:bg-gray-100 px-3 py-1.5 rounded-md text-sm"
                    >
                      <Printer className="h-4 w-4" />
                      <span>Imprimir</span>
                    </button>
                  </MoreDropdown>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className={cn("flex items-center justify-between py-4", data.length === 0 && "hidden")}>
        <div className="flex-1 text-sm text-muted-foreground">
          {totalItems > 0 ? `${setVisibleRange().start} - ${setVisibleRange().end} de ${totalItems} ` : "Nenhum resultado encontrado"}
        </div>
        {data.length > 0 && (
          <Pagination
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Maleta</DialogTitle>
          </DialogHeader>
          {selectedSuitcase ? (
            <SuitcaseForm suitcase={selectedSuitcase} onClose={onClose} />
          ) : (
            <div>Carregando...</div>
          )}
        </DialogContent>
      </Dialog>

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
