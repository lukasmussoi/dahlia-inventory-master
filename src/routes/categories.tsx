
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { InventoryCategory, InventoryModel } from "@/models/inventoryModel";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CategoryForm } from "@/components/inventory/CategoryForm";
import { AuthController } from "@/controllers/authController";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const Categories = () => {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<InventoryCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isAdmin, setIsAdmin] = useState(false);

  // Verificar autenticação ao carregar a página
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await AuthController.checkAuth();
        if (!user) {
          toast.error("Sessão expirada. Por favor, faça login novamente.");
          navigate('/');
          return;
        }
        
        // Verificar se o usuário tem perfil e se é admin
        const userProfile = await AuthController.getUserProfileWithRoles();
        if (!userProfile?.isAdmin) {
          toast.error("Você não tem permissão para acessar esta página.");
          navigate('/dashboard');
          return;
        }
        
        setIsAdmin(userProfile.isAdmin);
        setIsLoading(false);
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        toast.error("Erro ao verificar autenticação");
        navigate('/');
      }
    };

    checkAuth();
  }, [navigate]);

  // Buscar categorias somente se o usuário for admin
  const { data: categoriesList = [], isLoading: isLoadingCategories, refetch } = useQuery({
    queryKey: ['categories'],
    queryFn: InventoryModel.getAllCategories,
    enabled: !isLoading && isAdmin, // Só executa quando o perfil do usuário for carregado e for admin
  });

  // Paginação
  const totalPages = Math.ceil(categoriesList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const categories = categoriesList.slice(startIndex, endIndex);

  // Função para abrir o modal de edição
  const handleEdit = (category: InventoryCategory) => {
    setSelectedCategory(category);
    setIsFormOpen(true);
  };

  // Função para deletar categoria
  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta categoria?")) {
      return;
    }
    
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
  if (isLoading || isLoadingCategories) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
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
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4">
                    Nenhuma categoria encontrada
                  </TableCell>
                </TableRow>
              ) : (
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
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <Pagination className="my-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                
                {[...Array(totalPages)].map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink 
                      onClick={() => setCurrentPage(i + 1)}
                      isActive={currentPage === i + 1}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
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
