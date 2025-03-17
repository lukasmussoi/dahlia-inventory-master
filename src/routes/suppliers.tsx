
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { SupplierModel } from "@/models/supplierModel";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Edit, Trash } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { AuthController } from "@/controllers/authController";

export default function Suppliers() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

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
        
        setIsLoading(false);
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        toast.error("Erro ao verificar autenticação");
        navigate('/');
      }
    };

    checkAuth();
  }, [navigate]);

  // Buscar fornecedores somente se o usuário estiver autenticado e com permissões
  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => SupplierModel.getSuppliers(),
    enabled: !isLoading, // Só executa quando a verificação inicial estiver concluída
  });

  const createMutation = useMutation({
    mutationFn: ({ name, contactInfo }: { name: string; contactInfo?: string }) =>
      SupplierModel.createSupplier(name, contactInfo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success("Fornecedor criado com sucesso!");
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao criar fornecedor: " + (error instanceof Error ? error.message : "Erro desconhecido"));
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name, contactInfo }: { id: string; name: string; contactInfo?: string }) =>
      SupplierModel.updateSupplier(id, name, contactInfo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success("Fornecedor atualizado com sucesso!");
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar fornecedor: " + (error instanceof Error ? error.message : "Erro desconhecido"));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => SupplierModel.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success("Fornecedor removido com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao remover fornecedor: " + (error instanceof Error ? error.message : "Erro desconhecido"));
    }
  });

  const resetForm = () => {
    setName("");
    setContactInfo("");
    setEditingId(null);
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("O nome do fornecedor é obrigatório");
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, name, contactInfo });
    } else {
      createMutation.mutate({ name, contactInfo });
    }
  };

  const handleEdit = (id: string, name: string, contactInfo?: string) => {
    setEditingId(id);
    setName(name);
    setContactInfo(contactInfo || "");
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este fornecedor?")) {
      deleteMutation.mutate(id);
    }
  };

  // Se estiver carregando, mostrar loading
  if (isLoading || isLoadingSuppliers) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Fornecedores</h1>
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-gold hover:bg-gold/90"
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Fornecedor
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Informações de Contato</TableHead>
              <TableHead className="w-[120px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  Nenhum fornecedor encontrado
                </TableCell>
              </TableRow>
            ) : (
              suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.contact_info || "-"}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleEdit(supplier.id, supplier.name, supplier.contact_info)
                        }
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(supplier.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Fornecedor" : "Novo Fornecedor"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Atualize as informações do fornecedor abaixo."
                : "Preencha as informações do novo fornecedor."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do fornecedor"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contactInfo">Informações de Contato</Label>
                <Textarea
                  id="contactInfo"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="Telefone, email, endereço, etc."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingId ? "Atualizar" : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
