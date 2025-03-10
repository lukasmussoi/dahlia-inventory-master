
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SupplierModel } from "@/models/supplierModel";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PlusIcon, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthModel } from "@/models/authModel";

interface Supplier {
  id: string;
  name: string;
  contact_info: string | null;
  created_at: string;
}

interface SupplierFormData {
  name: string;
  contactInfo: string;
}

const Suppliers = () => {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<SupplierFormData>({
    name: "",
    contactInfo: "",
  });

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
  const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['user-profile-suppliers'],
    queryFn: async () => {
      try {
        const profile = await AuthModel.getCurrentUserProfile();
        console.log("Perfil carregado (fornecedores):", profile);
        return profile;
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        toast.error("Erro ao verificar permissões. Redirecionando...");
        navigate('/dashboard');
        return { profile: null, isAdmin: false };
      }
    },
  });

  const { data: suppliers = [], refetch, isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => SupplierModel.getSuppliers(),
    enabled: userProfile?.isAdmin === true, // Busca somente se for admin
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedSupplier) {
        await SupplierModel.updateSupplier(
          selectedSupplier.id,
          formData.name,
          formData.contactInfo
        );
        toast.success("Fornecedor atualizado com sucesso!");
      } else {
        await SupplierModel.createSupplier(formData.name, formData.contactInfo);
        toast.success("Fornecedor criado com sucesso!");
      }
      setIsDialogOpen(false);
      refetch();
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
      toast.error("Erro ao salvar fornecedor");
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name,
      contactInfo: supplier.contact_info || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este fornecedor?')) {
      try {
        await SupplierModel.deleteSupplier(id);
        toast.success("Fornecedor excluído com sucesso!");
        refetch();
      } catch (error) {
        console.error('Erro ao deletar fornecedor:', error);
        toast.error("Erro ao deletar fornecedor");
      }
    }
  };

  const resetForm = () => {
    setSelectedSupplier(null);
    setFormData({ name: "", contactInfo: "" });
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Verificar se o usuário é administrador
  if (userProfile && !userProfile.isAdmin) {
    toast.error("Você não tem permissão para acessar esta página");
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fornecedores</h1>
          <p className="text-gray-600">Gerencie os fornecedores do sistema</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Novo Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedSupplier ? "Editar Fornecedor" : "Novo Fornecedor"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactInfo">Informações de Contato</Label>
                <Input
                  id="contactInfo"
                  value={formData.contactInfo}
                  onChange={(e) =>
                    setFormData({ ...formData, contactInfo: e.target.value })
                  }
                  placeholder="Telefone, email, etc."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {selectedSupplier ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Data de Cadastro</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingSuppliers ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                </TableCell>
              </TableRow>
            ) : suppliers.length > 0 ? (
              suppliers.map((supplier: Supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell>{supplier.name}</TableCell>
                  <TableCell>{supplier.contact_info || "-"}</TableCell>
                  <TableCell>
                    {new Date(supplier.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(supplier)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(supplier.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">
                  Nenhum fornecedor cadastrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Suppliers;
