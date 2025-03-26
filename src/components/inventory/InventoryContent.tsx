import { useState, useEffect } from "react";
import { InventoryTable } from "./InventoryTable";
import { InventoryForm } from "./InventoryForm";
import { JewelryForm } from "./JewelryForm";
import { InventoryFilters } from "./InventoryFilters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlusIcon, FileText, ArrowLeft, ExternalLink, Archive, RotateCcw } from "lucide-react";
import { inventoryController } from "@/controllers/inventoryController";
import { toast } from "sonner";
import { useInView } from "react-intersection-observer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CategoryForm } from "./CategoryForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { InventoryReports } from "./reports/InventoryReports";
import { InventoryLabels } from "./labels/InventoryLabels";

interface InventoryContentProps {
  isAdmin: boolean;
  onItemModified?: (item: any) => void;
}

export function InventoryContent({ isAdmin, onItemModified }: InventoryContentProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [activeForm, setActiveForm] = useState<"default" | "jewelry">("default");
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const queryClient = useQueryClient();

  const { ref, inView } = useInView();

  // Buscar categorias
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["inventory-categories"],
    queryFn: () => inventoryController.getAllItems({ archived: showArchived, category: categoryFilter, supplier: supplierFilter, sortField, sortOrder, page, pageSize, search: searchTerm }),
  });

  // Buscar fornecedores
  const { data: suppliers, isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ["inventory-suppliers"],
    queryFn: () => inventoryController.getAllItems({ archived: showArchived, category: categoryFilter, supplier: supplierFilter, sortField, sortOrder, page, pageSize, search: searchTerm }),
  });

  // Construir filtros
  useEffect(() => {
    const newFilters: any = { archived: showArchived };
    if (categoryFilter) newFilters.category = categoryFilter;
    if (supplierFilter) newFilters.supplier = supplierFilter;
    if (searchTerm) newFilters.search = searchTerm;

    setFilters(newFilters);
    setPage(1); // Resetar a página ao alterar os filtros
  }, [showArchived, categoryFilter, supplierFilter, searchTerm]);

  // Buscar itens do inventário
  const {
    data: items,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["inventory-items", filters, sortField, sortOrder, page, pageSize],
    queryFn: () => inventoryController.getAllItems({ ...filters, sortField, sortOrder, page, pageSize }),
    keepPreviousData: true,
  });

  // Função para preparar os dados do item antes de salvar
  const prepareItemData = (formData: any) => {
    const preparedData: any = {
      name: formData.name,
      sku: formData.sku,
      barcode: formData.barcode,
      category_id: formData.category_id,
      quantity: formData.quantity,
      price: formData.price,
      unit_cost: formData.unit_cost,
      suggested_price: formData.suggested_price,
      weight: formData.weight,
      width: formData.width,
      height: formData.height,
      depth: formData.depth,
      min_stock: formData.min_stock,
      supplier_id: formData.supplier_id,
      popularity: formData.popularity,
      reseller_commission: formData.reseller_commission,
      markup_percentage: formData.markup_percentage,
      plating_type_id: formData.plating_type_id,
      material_weight: formData.material_weight,
      packaging_cost: formData.packaging_cost,
      gram_value: formData.gram_value,
      profit_margin: formData.profit_margin,
    };

    // Remover campos vazios
    Object.keys(preparedData).forEach(key => {
      if (preparedData[key] === null || preparedData[key] === undefined || preparedData[key] === "") {
        delete preparedData[key];
      }
    });

    return preparedData;
  };

  // Modificamos apenas estas duas funções para adicionar a chamada ao evento onItemModified
  const onSaveItem = async (formData: any) => {
    try {
      console.log("Iniciando submissão do formulário", formData);
      
      // Preparar dados para salvamento
      const preparedData = prepareItemData(formData);
      console.log("Dados preparados para salvamento:", preparedData);
      
      let savedItem;
      
      if (editingItem) {
        console.log("Atualizando item existente");
        savedItem = await inventoryController.updateItem(editingItem.id, preparedData);
      } else {
        console.log("Criando novo item");
        savedItem = await inventoryController.createItem(preparedData);
      }
      
      // Invalidar a query para recarregar os dados
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      
      // Fechar o formulário
      setIsFormOpen(false);
      setEditingItem(null);
      setActiveForm("default");
      
      toast.success(`Item ${editingItem ? "atualizado" : "criado"} com sucesso`);
      
      // Notificar que um item foi modificado (adicionado ou editado)
      if (onItemModified) {
        onItemModified(savedItem);
      }
      
      // Recarregar os itens
      refetch();
    } catch (error) {
      console.error("Erro ao salvar item:", error);
      toast.error("Erro ao salvar item. Verifique os dados e tente novamente.");
    }
  };
  
  // Função para atualizar um item - Edição
  const handleEditItem = (item: any) => {
    console.log("Editando item:", item);
    setEditingItem(item);
    setActiveForm(item.category_name?.toLowerCase()?.includes("joia") ? "jewelry" : "default");
    setIsFormOpen(true);
  };

  // Função para excluir um item
  const handleDeleteItem = async (id: string) => {
    try {
      console.log("Excluindo item:", id);
      await inventoryController.deleteItem(id);
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      toast.success("Item excluído com sucesso");
    } catch (error: any) {
      console.error("Erro ao excluir item:", error);
      toast.error(error.message || "Erro ao excluir item");
    }
  };
  
  // Função para arquivar um item
  const handleArchiveItem = async (id: string) => {
    try {
      console.log("Arquivando item:", id);
      await inventoryController.archiveItem(id);
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      toast.success("Item arquivado com sucesso");
    } catch (error) {
      console.error("Erro ao arquivar item:", error);
      toast.error("Erro ao arquivar item");
    }
  };
  
  // Função para restaurar um item
  const handleRestoreItem = async (id: string) => {
    try {
      console.log("Restaurando item:", id);
      await inventoryController.restoreItem(id);
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      toast.success("Item restaurado com sucesso");
    } catch (error) {
      console.error("Erro ao restaurar item:", error);
      toast.error("Erro ao restaurar item");
    }
  };

  // Renderizar o formulário correto
  const renderForm = () => {
    switch (activeForm) {
      case "jewelry":
        return <JewelryForm
          onCancel={() => { setIsFormOpen(false); setEditingItem(null); }}
          onSubmit={onSaveItem}
          editingItem={editingItem}
        />;
      default:
        return <InventoryForm
          onCancel={() => { setIsFormOpen(false); setEditingItem(null); }}
          onSubmit={onSaveItem}
          editingItem={editingItem}
        />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          Inventário
          {isAdmin && (
            <Badge variant="secondary" className="ml-2">
              Admin
            </Badge>
          )}
        </h2>
        <div className="flex space-x-2">
          {isAdmin && (
            <Button onClick={() => setIsCategoryFormOpen(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          )}
          <Button onClick={() => setIsFormOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Novo Item
          </Button>
        </div>
      </div>

      <InventoryFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        showArchived={showArchived}
        setShowArchived={setShowArchived}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        supplierFilter={supplierFilter}
        setSupplierFilter={setSupplierFilter}
        sortField={sortField}
        setSortField={setSortField}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
      />

      {isLoading ? (
        <div className="w-full h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gold"></div>
        </div>
      ) : error ? (
        <div className="text-red-500">Erro ao carregar os dados.</div>
      ) : (
        <InventoryTable
          items={items || []}
          isLoading={isLoading}
          onEdit={handleEditItem}
          onDelete={handleDeleteItem}
          onArchive={handleArchiveItem}
          onRestore={handleRestoreItem}
          showArchivedControls={showArchived}
        />
      )}

      <div className="flex justify-between items-center">
        <Button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          variant="outline"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>
        <span>Página: {page}</span>
        <Button
          onClick={() => setPage(page + 1)}
          disabled={items?.length === 0 || items?.length < pageSize}
          variant="outline"
        >
          Próximo
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Formulário de edição/criação de item */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Editar Item" : "Novo Item"}</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para {editingItem ? "editar" : "criar"} um item no inventário.
            </DialogDescription>
          </DialogHeader>
          {renderForm()}
        </DialogContent>
      </Dialog>

      {/* Formulário de criação de categoria */}
      <Dialog open={isCategoryFormOpen} onOpenChange={setIsCategoryFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para criar uma nova categoria.
            </DialogDescription>
          </DialogHeader>
          <CategoryForm onCancel={() => setIsCategoryFormOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Relatórios e Etiquetas */}
      <Tabs defaultValue="reports" className="w-full">
        <TabsList>
          <TabsTrigger value="reports">
            <FileText className="h-4 w-4 mr-2" />
            Relatórios
          </TabsTrigger>
          <TabsTrigger value="labels">
            <Printer className="h-4 w-4 mr-2" />
            Etiquetas
          </TabsTrigger>
        </TabsList>
        <TabsContent value="reports">
          <InventoryReports />
        </TabsContent>
        <TabsContent value="labels">
          <InventoryLabels />
        </TabsContent>
      </Tabs>
    </div>
  );
}
