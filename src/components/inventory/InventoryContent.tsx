
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { InventoryItem, InventoryModel } from "@/models/inventoryModel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { InventoryTable } from "./InventoryTable";
import { InventoryForm } from "./InventoryForm";
import { toast } from "sonner";

interface InventoryContentProps {
  isAdmin?: boolean;
}

export function InventoryContent({ isAdmin }: InventoryContentProps) {
  // Estados para controle do modal e filtros
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Buscar dados do inventário
  const { data: items = [], isLoading, refetch } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: InventoryModel.getAllItems,
  });

  // Filtrar itens com base na busca
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para abrir o modal de edição
  const handleEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  // Função para fechar o modal
  const handleCloseModal = () => {
    setSelectedItem(null);
    setIsModalOpen(false);
    refetch();
  };

  // Função para deletar um item
  const handleDelete = async (id: string) => {
    try {
      await InventoryModel.deleteItem(id);
      toast.success("Item removido com sucesso!");
      refetch();
    } catch (error) {
      console.error('Erro ao deletar item:', error);
      toast.error("Erro ao remover item");
    }
  };

  return (
    <main className="flex-1 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">Gestão de Estoque</h1>
          {isAdmin && (
            <Button onClick={() => setIsModalOpen(true)} className="bg-gold hover:bg-gold/90">
              <Plus className="h-5 w-5 mr-2" />
              Novo Item
            </Button>
          )}
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Buscar por nome ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <InventoryTable
          items={filteredItems}
          isLoading={isLoading}
          onEdit={isAdmin ? handleEdit : undefined}
          onDelete={isAdmin ? handleDelete : undefined}
        />

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
