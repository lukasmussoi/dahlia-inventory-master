
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { InventoryItem, InventoryCategory, InventoryFilters, InventoryModel } from "@/models/inventory";
import { Button } from "@/components/ui/button";
import { Plus, FolderPlus, Archive, RotateCcw } from "lucide-react";
import { InventoryTable } from "./InventoryTable";
import { JewelryForm } from "./JewelryForm";
import { CategoryForm } from "./CategoryForm";
import { InventoryFilters as Filters } from "./InventoryFilters";
import { toast } from "sonner";

interface InventoryContentProps {
  isAdmin?: boolean;
}

export function InventoryContent({ isAdmin }: InventoryContentProps) {
  // Estados para controle dos modais e filtros
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [filters, setFilters] = useState<InventoryFilters>({
    showArchived: false
  });
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<InventoryCategory | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);

  // Buscar dados do inventário e categorias
  const { data: items = [], isLoading: isLoadingItems, refetch: refetchItems } = useQuery({
    queryKey: ['inventory-items', filters],
    queryFn: () => {
      console.log("Buscando itens com filtros:", filters);
      return InventoryModel.getAllItems(filters);
    },
  });

  const { data: categories = [], refetch: refetchCategories } = useQuery({
    queryKey: ['inventory-categories'],
    queryFn: () => InventoryModel.getAllCategories(),
  });

  console.log("Itens carregados:", items.length);

  // Função para abrir o modal de edição de item
  const handleEditItem = async (item: InventoryItem) => {
    try {
      // Verificar se o item está em uma maleta ativa (não devolvida)
      const suitcaseInfo = await InventoryModel.checkItemInSuitcase(item.id);
      
      if (suitcaseInfo) {
        // Verifica se a maleta está em uso (não foi devolvida)
        const isActiveCase = suitcaseInfo.status === 'in_use' || 
                             suitcaseInfo.status === 'in_replenishment';
        
        if (isActiveCase) {
          toast.error("Este item está vinculado a uma maleta ativa e não pode ser editado. Devolva a maleta primeiro.");
          return;
        }
      }
      
      setSelectedItem(item);
      setIsItemModalOpen(true);
    } catch (error) {
      console.error('Erro ao verificar item:', error);
      toast.error("Erro ao verificar disponibilidade do item");
    }
  };

  // Função para abrir o modal de edição de categoria
  const handleEditCategory = (category: InventoryCategory) => {
    setSelectedCategory(category);
    setIsCategoryModalOpen(true);
  };

  // Função para fechar os modais
  const handleCloseModals = () => {
    setSelectedItem(null);
    setSelectedCategory(null);
    setIsItemModalOpen(false);
    setIsCategoryModalOpen(false);
    refetchItems();
    refetchCategories();
  };

  // Função para deletar um item
  const handleDeleteItem = async (id: string) => {
    try {
      if (isDeletingItem) return; // Evitar múltiplas exclusões simultâneas
      
      const suitcaseInfo = await InventoryModel.checkItemInSuitcase(id);
      
      if (suitcaseInfo) {
        // Verifica se a maleta está em uso (não foi devolvida)
        const isActiveCase = suitcaseInfo.status === 'in_use' || 
                            suitcaseInfo.status === 'in_replenishment';
        
        if (isActiveCase) {
          toast.error("Este item está vinculado a uma maleta ativa e não pode ser removido. Devolva a maleta primeiro.");
          return;
        }
      }

      if (window.confirm("Tem certeza que deseja excluir este item?")) {
        try {
          setIsDeletingItem(true);
          toast.loading("Excluindo item e suas dependências...");
          
          await InventoryModel.deleteItem(id);
          
          toast.dismiss();
          toast.success("Item removido com sucesso!");
          
          // Garantir que a lista seja atualizada após a exclusão
          await refetchItems();
        } catch (error: any) {
          toast.dismiss();
          console.error('Erro ao deletar item:', error);
          // Tratamento específico para mensagens de erro vindas do controller
          if (error.message) {
            toast.error(error.message);
          } else {
            toast.error("Erro ao remover item. Verifique se não há dependências não tratadas.");
          }
        } finally {
          setIsDeletingItem(false);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar item:', error);
      toast.error("Erro ao verificar disponibilidade do item");
    }
  };

  // Função para arquivar um item
  const handleArchiveItem = async (id: string) => {
    try {
      const suitcaseInfo = await InventoryModel.checkItemInSuitcase(id);
      
      if (suitcaseInfo) {
        // Verifica se a maleta está em uso (não foi devolvida)
        const isActiveCase = suitcaseInfo.status === 'in_use' || 
                            suitcaseInfo.status === 'in_replenishment';
        
        if (isActiveCase) {
          toast.error("Este item está vinculado a uma maleta ativa e não pode ser arquivado. Devolva a maleta primeiro.");
          return;
        }
      }

      if (window.confirm("Tem certeza que deseja arquivar este item? Ele não aparecerá na listagem normal.")) {
        try {
          await InventoryModel.archiveItem(id);
          toast.success("Item arquivado com sucesso!");
          refetchItems();
        } catch (error) {
          console.error('Erro ao arquivar item:', error);
          toast.error("Erro ao arquivar item");
        }
      }
    } catch (error) {
      console.error('Erro ao verificar item:', error);
      toast.error("Erro ao verificar disponibilidade do item");
    }
  };

  // Função para restaurar um item arquivado
  const handleRestoreItem = async (id: string) => {
    try {
      if (window.confirm("Tem certeza que deseja restaurar este item?")) {
        await InventoryModel.restoreItem(id);
        toast.success("Item restaurado com sucesso!");
        refetchItems();
      }
    } catch (error) {
      console.error('Erro ao restaurar item:', error);
      toast.error("Erro ao restaurar item");
    }
  };

  // Função para deletar uma categoria
  const handleDeleteCategory = async (id: string) => {
    try {
      if (window.confirm("Tem certeza que deseja excluir esta categoria?")) {
        await InventoryModel.deleteCategory(id);
        toast.success("Categoria removida com sucesso!");
        refetchCategories();
      }
    } catch (error) {
      console.error('Erro ao deletar categoria:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Erro ao remover categoria");
      }
    }
  };

  // Função para atualizar filtros
  const handleFilter = (newFilters: InventoryFilters) => {
    console.log("Aplicando novos filtros:", newFilters);
    setFilters(newFilters);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Estoque</h1>
          <p className="text-muted-foreground">
            Gerencie todos os itens do seu estoque de forma eficiente
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsCategoryModalOpen(true)} 
              className="bg-gold/80 hover:bg-gold/70"
            >
              <FolderPlus className="h-5 w-5 mr-2" />
              Nova Categoria
            </Button>
            <Button onClick={() => setIsItemModalOpen(true)} className="bg-gold hover:bg-gold/90">
              <Plus className="h-5 w-5 mr-2" />
              Nova Peça
            </Button>
          </div>
        )}
      </div>

      {/* Componente de Filtros */}
      <Filters
        categories={categories}
        onFilter={handleFilter}
      />

      {/* Tabela de Itens */}
      <div className="bg-white rounded-lg border">
        <InventoryTable
          items={items}
          isLoading={isLoadingItems}
          onEdit={isAdmin ? handleEditItem : undefined}
          onDelete={isAdmin ? handleDeleteItem : undefined}
          onArchive={isAdmin ? handleArchiveItem : undefined}
          onRestore={isAdmin ? handleRestoreItem : undefined}
          showArchivedControls={filters.status === 'archived'}
        />
      </div>

      {/* Modal de Item */}
      {isItemModalOpen && (
        <JewelryForm
          item={selectedItem}
          isOpen={isItemModalOpen}
          onClose={handleCloseModals}
          onSuccess={refetchItems}
        />
      )}

      {/* Modal de Categoria */}
      {isCategoryModalOpen && (
        <CategoryForm
          category={selectedCategory}
          isOpen={isCategoryModalOpen}
          onClose={handleCloseModals}
          onSuccess={refetchCategories}
        />
      )}
    </div>
  );
}
