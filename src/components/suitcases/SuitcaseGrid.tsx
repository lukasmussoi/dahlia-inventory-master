import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Edit, CheckCircle, XCircle, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import {
  Suitcase,
  SuitcaseFilters,
  SuitcaseItem,
  SuitcaseItemStatus,
  SuitcaseStatus
} from "@/types/suitcase";
import { SuitcaseModel } from "@/models/suitcaseModel";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { InventoryModel } from "@/models/inventoryModel";
import { InventoryItem } from "@/models/inventoryModel";
import { SuitcasePrintDialog } from "./SuitcasePrintDialog";

interface SuitcaseGridProps {
  isAdmin?: boolean;
  onRefresh?: () => void;
}

export function SuitcaseGrid({ isAdmin, onRefresh }: SuitcaseGridProps) {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [filters, setFilters] = useState<SuitcaseFilters>({});
  const [selectedSuitcase, setSelectedSuitcase] = useState<Suitcase | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedSuitcaseForPrint, setSelectedSuitcaseForPrint] = useState<Suitcase | null>(null);
  const [suitcaseItemsForPrint, setSuitcaseItemsForPrint] = useState<SuitcaseItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isItemSubmitting, setIsItemSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Buscar dados das maletas
  const { data: suitcases = [], refetch, isLoading } = useQuery({
    queryKey: ["suitcases", filters],
    queryFn: () => SuitcaseModel.getAllSuitcases(filters),
  });

  // Buscar dados dos itens da maleta
  const { data: suitcaseItems = [], refetch: refetchSuitcaseItems } = useQuery({
    queryKey: ["suitcase-items", selectedSuitcase?.id],
    queryFn: async () => {
      if (!selectedSuitcase?.id) return [];
      
      // Obter itens da maleta
      const items = await SuitcaseModel.getSuitcaseItems(selectedSuitcase.id);
      
      // Retornar os itens diretamente, garantindo que todos os campos necessários estejam presentes
      return items;
    },
    enabled: !!selectedSuitcase?.id,
  });

  // Buscar todos os itens do inventário para adicionar à maleta
  const { data: inventoryItems = [] } = useQuery({
    queryKey: ["inventory-items"],
    queryFn: () => InventoryModel.getAllItems(),
  });

  // Calcular paginação
  const totalPages = Math.ceil(suitcases.length / itemsPerPage);
  const paginatedSuitcases = suitcases.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Formatar data
  const formatDate = (date: string) => {
    return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  // Abrir modal de edição
  const handleEdit = (suitcase: Suitcase) => {
    setSelectedSuitcase(suitcase);
    setIsModalOpen(true);
  };

  // Abrir modal de adicionar item
  const handleAddItem = (suitcase: Suitcase) => {
    setSelectedSuitcase(suitcase);
    setSelectedItem(null);
    setIsItemModalOpen(true);
  };

  const handlePrint = async (suitcase: Suitcase) => {
    setSelectedSuitcaseForPrint(suitcase);
    try {
      const items = await SuitcaseModel.getSuitcaseItems(suitcase.id);
      setSuitcaseItemsForPrint(items);
      setIsPrintModalOpen(true);
    } catch (error) {
      console.error("Erro ao carregar itens da maleta para impressão:", error);
      toast.error("Erro ao carregar itens da maleta para impressão");
    }
  };

  // Salvar maleta
  const handleSave = async (data: any) => {
    setIsSubmitting(true);
    try {
      if (selectedSuitcase) {
        await SuitcaseModel.updateSuitcase(selectedSuitcase.id, data);
        toast.success("Maleta atualizada com sucesso!");
      } else {
        await SuitcaseModel.createSuitcase(data);
        toast.success("Maleta criada com sucesso!");
      }
      closeModal();
      refetch();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Erro ao salvar maleta:", error);
      toast.error("Erro ao salvar maleta");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Adicionar item à maleta
  const handleSaveItem = async (inventoryId: string) => {
    setIsItemSubmitting(true);
    try {
      if (!selectedSuitcase) {
        toast.error("Nenhuma maleta selecionada.");
        return;
      }
      
      // Corrigir uso de addItemToSuitcase
      await SuitcaseModel.addItemToSuitcase({
        suitcase_id: selectedSuitcase.id,
        inventory_id: inventoryId
      });
      
      toast.success("Item adicionado à maleta com sucesso!");
      closeItemModal();
      refetchSuitcaseItems();
    } catch (error) {
      console.error("Erro ao adicionar item à maleta:", error);
      toast.error("Erro ao adicionar item à maleta");
    } finally {
      setIsItemSubmitting(false);
    }
  };

  // Remover item da maleta
  const handleRemoveItem = async (itemId: string) => {
    if (window.confirm("Tem certeza que deseja remover este item da maleta?")) {
      try {
        // Corrigir uso de removeSuitcaseItem
        await SuitcaseModel.removeSuitcaseItem(itemId);
        toast.success("Item removido da maleta com sucesso!");
        refetchSuitcaseItems();
      } catch (error) {
        console.error("Erro ao remover item da maleta:", error);
        toast.error("Erro ao remover item da maleta");
      }
    }
  };

  // Atualizar status do item na maleta
  const handleUpdateItemStatus = async (itemId: string, status: SuitcaseItemStatus) => {
    try {
      // Garantir que só status válidos sejam enviados
      const validStatus: SuitcaseItemStatus[] = ["in_possession", "sold", "returned", "lost"];
      
      if (!validStatus.includes(status)) {
        toast.error(`Status inválido: ${status}`);
        return;
      }
      
      await SuitcaseModel.updateSuitcaseItemStatus(itemId, status);
      toast.success("Status do item atualizado com sucesso!");
      refetchSuitcaseItems();
    } catch (error) {
      console.error("Erro ao atualizar status do item:", error);
      toast.error("Erro ao atualizar status do item");
    }
  };

  // Deletar maleta
  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta maleta?")) {
      try {
        await SuitcaseModel.deleteSuitcase(id);
        toast.success("Maleta excluída com sucesso!");
        refetch();
        if (onRefresh) onRefresh();
      } catch (error) {
        console.error("Erro ao excluir maleta:", error);
        toast.error("Erro ao excluir maleta");
      }
    }
  };

  // Fechar modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSuitcase(null);
  };

  // Fechar modal de item
  const closeItemModal = () => {
    setIsItemModalOpen(false);
    setSelectedItem(null);
  };

  const closePrintModal = () => {
    setIsPrintModalOpen(false);
    setSelectedSuitcaseForPrint(null);
    setSuitcaseItemsForPrint([]);
  };

  // Atualizar filtros
  const handleFilter = (newFilters: SuitcaseFilters) => {
    setFilters(newFilters);
  };

  // Buscar vendedor
  const fetchSeller = async (sellerId: string) => {
    try {
      // Corrigir uso de getSellerById
      const seller = await SuitcaseModel.getSellerById(sellerId);
      return seller;
    } catch (error) {
      console.error("Erro ao buscar vendedor:", error);
      return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Maletas</h1>
          <p className="text-muted-foreground">
            Gerencie as maletas e seus respectivos itens
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsModalOpen(true)} className="bg-gold hover:bg-gold/90">
            <Plus className="h-5 w-5 mr-2" />
            Nova Maleta
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg p-4 shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Buscar</Label>
            <Input
              type="text"
              placeholder="Código da maleta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <Label>Status</Label>
            <Select onValueChange={(value) => handleFilter({ status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="in_use">Em uso</SelectItem>
                <SelectItem value="returned">Devolvida</SelectItem>
                <SelectItem value="in_replenishment">Em reposição</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Cidade</Label>
            <Input
              type="text"
              placeholder="Cidade..."
              onChange={(e) => handleFilter({ city: e.target.value })}
            />
          </div>
          <div>
            <Label>Bairro</Label>
            <Input
              type="text"
              placeholder="Bairro..."
              onChange={(e) => handleFilter({ neighborhood: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Tabela de Maletas */}
      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Vendedor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>Bairro</TableHead>
              <TableHead>Data de Criação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : paginatedSuitcases
                .filter((suitcase) =>
                  suitcase.code?.toLowerCase().includes(searchTerm.toLowerCase()) || ""
                )
                .map((suitcase) => {
                  // Buscar dados do vendedor para cada maleta
                  const { data: reseller, isLoading: isResellerLoading } = useQuery({
                    queryKey: ["reseller", suitcase.seller_id],
                    queryFn: () => fetchSeller(suitcase.seller_id),
                    staleTime: Infinity,
                  });

                  return (
                    <TableRow key={suitcase.id}>
                      <TableCell>{suitcase.code}</TableCell>
                      <TableCell>
                        {isResellerLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            {reseller?.name}
                            {reseller?.phone && (
                              <div className="text-sm text-gray-500">
                                {reseller.phone}
                              </div>
                            )}
                            {reseller?.address && (
                              <div className="text-sm text-gray-500 mt-1">
                                {reseller.address.city || ''}
                                {reseller.address.neighborhood ? `, ${reseller.address.neighborhood}` : ''}
                              </div>
                            )}
                          </>
                        )}
                      </TableCell>
                      <TableCell>
                        {suitcase.status === "in_use"
                          ? "Em uso"
                          : suitcase.status === "returned"
                            ? "Devolvida"
                            : "Em reposição"}
                      </TableCell>
                      <TableCell>{suitcase.city || "-"}</TableCell>
                      <TableCell>{suitcase.neighborhood || "-"}</TableCell>
                      <TableCell>{formatDate(suitcase.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePrint(suitcase)}
                            className="hover:bg-gray-100"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleAddItem(suitcase)}
                            className="hover:bg-gray-100"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(suitcase)}
                                className="hover:bg-gray-100"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(suitcase.id)}
                                className="hover:bg-red-100 hover:text-red-600"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <span>
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Próximo
          </Button>
        </div>
      )}

      {/* Modal de Maleta */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedSuitcase ? "Editar Maleta" : "Nova Maleta"}
            </DialogTitle>
          </DialogHeader>
          <SuitcaseForm
            suitcase={selectedSuitcase}
            onSave={handleSave}
            onClose={closeModal}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de Adicionar Item */}
      <Dialog open={isItemModalOpen} onOpenChange={closeItemModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Adicionar Item à Maleta</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            {inventoryItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border rounded-md"
              >
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                </div>
                <Button
                  onClick={() => handleSaveItem(item.id)}
                  disabled={isItemSubmitting}
                >
                  {isItemSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Adicionar
                </Button>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={closeItemModal}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Impressão */}
      <SuitcasePrintDialog
        open={isPrintModalOpen}
        onOpenChange={closePrintModal}
        suitcase={selectedSuitcaseForPrint}
        suitcaseItems={suitcaseItemsForPrint}
      />

      {/* Drawer de Itens da Maleta */}
      {selectedSuitcase && (
        <Drawer
          open={!!selectedSuitcase}
          onOpenChange={() => setSelectedSuitcase(null)}
        >
          <DrawerContent className="sm:max-w-md">
            <DrawerHeader>
              <DrawerTitle>Itens da Maleta</DrawerTitle>
              <DrawerDescription>
                Gerencie os itens da maleta {selectedSuitcase.code}
              </DrawerDescription>
            </DrawerHeader>
            <div className="relative">
              {suitcaseItems.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-gold" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suitcaseItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product?.name}</TableCell>
                        <TableCell>
                          <Select
                            value={item.status}
                            onValueChange={(value) =>
                              handleUpdateItemStatus(item.id, value as SuitcaseItemStatus)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="in_possession">
                                Em posse
                              </SelectItem>
                              <SelectItem value="sold">Vendido</SelectItem>
                              <SelectItem value="returned">Devolvido</SelectItem>
                              <SelectItem value="lost">Perdido</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(item.id)}
                            className="hover:bg-red-100 hover:text-red-600"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
            <DrawerFooter>
              <Button variant="outline" onClick={() => setSelectedSuitcase(null)}>
                Fechar
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}

interface SuitcaseFormProps {
  suitcase?: Suitcase | null;
  onSave: (data: any) => void;
  onClose: () => void;
  isSubmitting: boolean;
}

function SuitcaseForm({ suitcase, onSave, onClose, isSubmitting }: SuitcaseFormProps) {
  const [sellers, setSellers] = useState([]);

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const data = await SuitcaseModel.getAllSellers();
        setSellers(data);
      } catch (error) {
        console.error("Erro ao buscar vendedores:", error);
        toast.error("Erro ao buscar vendedores");
      }
    };

    fetchSellers();
  }, []);

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = {
      code: formData.get("code"),
      seller_id: formData.get("seller_id"),
      city: formData.get("city"),
      neighborhood: formData.get("neighborhood"),
    };
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="code">Código</Label>
        <Input
          id="code"
          name="code"
          defaultValue={suitcase?.code || ""}
          className="w-full"
          required
        />
      </div>
      <div>
        <Label htmlFor="seller_id">Vendedor</Label>
        <Select
          defaultValue={suitcase?.seller_id || ""}
          onValueChange={(value) => {
            const sellerInput = document.getElementById("seller_id") as HTMLSelectElement;
            if (sellerInput) {
              sellerInput.value = value;
            }
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione um vendedor" />
          </SelectTrigger>
          <SelectContent>
            {sellers.map((seller: any) => (
              <SelectItem key={seller.id} value={seller.id}>
                {seller.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" id="seller_id" name="seller_id" />
      </div>
      <div>
        <Label htmlFor="city">Cidade</Label>
        <Input
          id="city"
          name="city"
          defaultValue={suitcase?.city || ""}
          className="w-full"
        />
      </div>
      <div>
        <Label htmlFor="neighborhood">Bairro</Label>
        <Input
          id="neighborhood"
          name="neighborhood"
          defaultValue={suitcase?.neighborhood || ""}
          className="w-full"
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            "Salvar"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
