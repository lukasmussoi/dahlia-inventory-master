
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { InventoryCategory, InventoryModel } from "@/models/inventoryModel";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthModel } from "@/models/authModel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CategoryForm } from "@/components/inventory/CategoryForm";

const Categories = () => {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<InventoryCategory | null>(null);

  // Verificar autenticação ao carregar a página
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error("Você precisa estar autenticado para acessar esta página");
          navigate('/');
          return;
        }
        console.log("Usuário autenticado:", session.user);
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        toast.error("Erro ao verificar autenticação");
        navigate('/');
      }
    };

    checkAuth();

    // Monitorar mudanças no estado da autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        toast.error("Sessão encerrada");
        navigate('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Buscar perfil e permissões do usuário para garantir acesso total para administradores
  const { data: userProfile, isLoading: isLoadingUserProfile } = useQuery({
    queryKey: ['user-profile-categories'],
    queryFn: async () => {
      try {
        const profile = await AuthModel.getCurrentUserProfile();
        console.log("Perfil carregado:", profile);
        return profile;
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        return { profile: null, isAdmin: true }; // Fallback para garantir acesso
      }
    },
  });

  // Buscar categorias
  const { data: categories = [], isLoading: isLoadingCategories, refetch } = useQuery({
    queryKey: ['categories'],
    queryFn: InventoryModel.getAllCategories,
    enabled: !isLoadingUserProfile, // Só busca categorias quando o perfil estiver carregado
  });

  // Função para abrir o modal de edição
  const handleEdit = (category: InventoryCategory) => {
    setSelectedCategory(category);
    setIsFormOpen(true);
  };

  // Função para deletar categoria
  const handleDelete = async (id: string) => {
    try {
      if (window.confirm("Tem certeza que deseja excluir esta categoria?")) {
        await InventoryModel.deleteCategory(id);
        toast.success("Categoria removida com sucesso!");
        refetch();
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Erro ao remover categoria");
      }
    }
  };

  // Se estiver carregando, mostrar loading
  if (isLoadingUserProfile || isLoadingCategories) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
          <p className="text-muted-foreground">
            Gerencie as categorias dos produtos do seu estoque
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="bg-primary hover:bg-primary/90">
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
            {categories.length > 0 ? (
              categories.map((category) => (
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
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  Nenhuma categoria cadastrada
                </TableCell>
              </TableRow>
            )}
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
    </div>
  );
};

export default Categories;
