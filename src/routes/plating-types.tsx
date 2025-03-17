
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom"; 
import { InventoryModel, PlatingType } from "@/models/inventoryModel";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Plus, Trash } from "lucide-react";
import { PlatingTypeForm } from "@/components/plating/PlatingTypeForm";
import { toast } from "sonner";
import { AuthController } from "@/controllers/authController";

const PlatingTypes = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<PlatingType | null>(null);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  // Verificar autenticação ao carregar a página
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await AuthController.checkAuth();
        if (!user) {
          navigate('/');
          return;
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        toast.error("Erro ao verificar autenticação");
        navigate('/');
      }
    };

    checkAuth();
  }, [navigate]);

  // Buscar perfil e permissões do usuário
  const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => AuthController.getUserProfileWithRoles(),
    enabled: !isLoading, // Só executa quando a verificação inicial estiver concluída
  });

  const { data: platingTypes = [], refetch, isLoading: isLoadingTypes } = useQuery({
    queryKey: ['plating-types'],
    queryFn: () => InventoryModel.getAllPlatingTypes(),
    enabled: !isLoadingProfile, // Só executa quando o perfil do usuário for carregado
  });

  const handleEdit = (type: PlatingType) => {
    setSelectedType(type);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este tipo de banho?')) {
      return;
    }

    try {
      await InventoryModel.deletePlatingType(id);
      toast.success('Tipo de banho excluído com sucesso!');
      refetch();
    } catch (error) {
      console.error('Erro ao excluir tipo de banho:', error);
      toast.error('Erro ao excluir tipo de banho');
    }
  };

  const handleAddNew = () => {
    setSelectedType(null);
    setIsFormOpen(true);
  };

  // Se estiver carregando, mostrar loading
  if (isLoading || isLoadingProfile || isLoadingTypes) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  // Verificar se o usuário é admin
  if (!userProfile?.isAdmin) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-destructive/20 p-4 rounded-md">
          <h2 className="text-xl font-bold text-destructive">Acesso Negado</h2>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página. Esta funcionalidade é restrita aos administradores do sistema.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-screen bg-background">
      <main className="flex-1 space-y-4 p-4 pt-20">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tipos de Banho</h1>
            <p className="text-muted-foreground">
              Gerencie os tipos de banho disponíveis para as peças
            </p>
          </div>
          <Button onClick={handleAddNew} className="bg-gold hover:bg-gold/90">
            <Plus className="h-5 w-5 mr-2" />
            Novo Tipo de Banho
          </Button>
        </div>

        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Valor por Grama</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {platingTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell>{type.name}</TableCell>
                  <TableCell>R$ {type.gram_value.toFixed(2)}</TableCell>
                  <TableCell>{type.description || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(type)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(type.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {isFormOpen && (
          <PlatingTypeForm
            platingType={selectedType}
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            onSuccess={refetch}
          />
        )}
      </main>
    </div>
  );
};

export default PlatingTypes;
