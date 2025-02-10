
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { InventoryCategory, InventoryModel } from "@/models/inventoryModel";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CategoryForm } from "@/components/inventory/CategoryForm";
import { useState } from "react";

const Categories = () => {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<InventoryCategory | null>(null);

  // Verificar autenticação ao carregar a página
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/');
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Buscar categorias
  const { data: categories = [], isLoading, refetch } = useQuery({
    queryKey: ['categories'],
    queryFn: InventoryModel.getAllCategories,
  });

  // Função para abrir o modal de edição
  const handleEdit = (category: InventoryCategory) => {
    setSelectedCategory(category);
    setIsFormOpen(true);
  };

  // Função para deletar categoria
  const handleDelete = async (id: string) => {
    try {
      await InventoryModel.deleteCategory(id);
      toast.success("Categoria removida com sucesso!");
      refetch();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Erro ao remover categoria");
      }
    }
  };

  // Se estiver carregando, mostrar loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-screen bg-background">
      <main className="flex-1 space-y-4 p-4 pt-20">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
            <p className="text-muted-foreground">
              Gerencie as categorias dos produtos do seu estoque
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)} className="bg-gold hover:bg-gold/90">
            <Plus className="h-5 w-5 mr-2" />
            Nova Categoria
          </Button>
        </div>

        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>{category.name}</TableCell>
                  <TableCell>
                    {new Date(category.created_at || '').toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(category)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(category.id)}
                    >
                      Excluir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Modal de Categoria */}
        {isFormOpen && (
          <CategoryForm
            category={selectedCategory}
            isOpen={isFormOpen}
            onClose={() => {
              setIsFormOpen(false);
              setSelectedCategory(null);
            }}
            onSuccess={() => {
              setIsFormOpen(false);
              setSelectedCategory(null);
              refetch();
            }}
          />
        )}
      </main>
    </div>
  );
};

export default Categories;
