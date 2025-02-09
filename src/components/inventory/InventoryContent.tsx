
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { InventoryItem, InventoryModel, InventoryFilters } from "@/models/inventoryModel";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { InventoryTable } from "./InventoryTable";
import { InventoryForm } from "./InventoryForm";
import { InventoryFilters as Filters } from "./InventoryFilters";
import { toast } from "sonner";

interface InventoryContentProps {
  isAdmin?: boolean;
}

export function InventoryContent({ isAdmin }: InventoryContentProps) {
  // Estados para controle do modal e filtros
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState<InventoryFilters>({});
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Buscar dados do inventário e categorias
  const { data: items = [], isLoading: isLoadingItems, refetch: refetchItems } = useQuery({
    queryKey: ['inventory-items', filters],
    queryFn: () => InventoryModel.getAllItems(filters),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['inventory-categories'],
    queryFn: InventoryModel.getUniqueCategories,
  });

  // Função para abrir o modal de edição
  const handleEdit = async (item: InventoryItem) => {
    try {
      // Verificar se o item está em uma maleta antes de permitir edição
      const isInSuitcase = await InventoryModel.checkItemInSuitcase(item.id);
      if (isInSuitcase) {
        toast.error("Este item está vinculado a uma maleta ativa e não pode ser editado.");
        return;
      }
      setSelectedItem(item);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Erro ao verificar item:', error);
      toast.error("Erro ao verificar disponibilidade do item");
    }
  };

  // Função para fechar o modal
  const handleCloseModal = () => {
    setSelectedItem(null);
    setIsModalOpen(false);
    refetchItems();
  };

  // Função para deletar um item
  const handleDelete = async (id: string) => {
    try {
      // Verificar se o item está em uma maleta antes de permitir exclusão
      const isInSuitcase = await InventoryModel.checkItemInSuitcase(id);
      if (isInSuitcase) {
        toast.error("Este item está vinculado a uma maleta ativa e não pode ser removido.");
        return;
      }

      // Confirmação antes de deletar
      if (window.confirm("Tem certeza que deseja excluir este item?")) {
        await InventoryModel.deleteItem(id);
        toast.success("Item removido com sucesso!");
        refetchItems();
      }
    } catch (error) {
      console.error('Erro ao deletar item:', error);
      toast.error("Erro ao remover item");
    }
  };

  // Função para atualizar filtros
  const handleFilter = (newFilters: InventoryFilters) => {
    setFilters(newFilters);
  };

  return (
    <main className="flex-1 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold text-gray-900">Gestão de Estoque</h1>
          {isAdmin && (
            <Button onClick={() => setIsModalOpen(true)} className="bg-gold hover:bg-gold/90">
              <Plus className="h-5 w-5 mr-2" />
              Novo Item
            </Button>
          )}
        </div>

        {/* Componente de Filtros */}
        <Filters
          categories={categories}
          onFilter={handleFilter}
        />

        {/* Tabela de Itens */}
        <InventoryTable
          items={items}
          isLoading={isLoadingItems}
          onEdit={isAdmin ? handleEdit : undefined}
          onDelete={isAdmin ? handleDelete : undefined}
        />

        {/* Modal de Formulário */}
        {isModalOpen && (
          <InventoryForm
            item={selectedItem}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
          />
        )}
      </div>
    </main>
  );
}
