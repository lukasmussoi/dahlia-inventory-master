import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserRoleModel, UserWithRoles, UserRole } from "@/models/userRoleModel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, UserPlus, Key } from "lucide-react";

const Users = () => {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [editingUser, setEditingUser] = useState<UserWithRoles | null>(null);
  const [editName, setEditName] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithRoles | null>(null);
  const [newUserData, setNewUserData] = useState<{
    email: string;
    password: string;
    fullName: string;
    roles: UserRole[];
  }>({
    email: "",
    password: "",
    fullName: "",
    roles: []
  });
  const [newPassword, setNewPassword] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: UserRoleModel.getAllUsersWithRoles,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string, status: 'active' | 'inactive' | 'suspended' }) => {
      await UserRoleModel.updateUserStatus(userId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Status do usuário atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status do usuário');
    },
  });

  const updateRolesMutation = useMutation({
    mutationFn: async ({ userId, roles }: { userId: string, roles: UserRole[] }) => {
      await UserRoleModel.updateUserRoles(userId, roles);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Funções do usuário atualizadas com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar funções:', error);
      toast.error('Erro ao atualizar funções do usuário');
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async ({ userId, fullName }: { userId: string, fullName: string }) => {
      await UserRoleModel.updateUserProfile(userId, fullName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
      toast.success('Perfil do usuário atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil do usuário');
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (userData: {
      email: string;
      password: string;
      fullName: string;
      roles: UserRole[];
    }) => UserRoleModel.createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowCreateDialog(false);
      setNewUserData({ email: "", password: "", fullName: "", roles: [] });
      toast.success('Usuário criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar usuário:', error);
      toast.error('Erro ao criar usuário');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => UserRoleModel.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setUserToDelete(null);
      toast.success('Usuário excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir usuário:', error);
      toast.error('Erro ao excluir usuário');
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) => 
      UserRoleModel.updateUserPassword(userId, password),
    onSuccess: () => {
      setShowPasswordDialog(false);
      setNewPassword("");
      toast.success('Senha atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar senha:', error);
      toast.error('Erro ao atualizar senha');
    },
  });

  const handleStatusChange = async (userId: string, newStatus: 'active' | 'inactive' | 'suspended') => {
    updateStatusMutation.mutate({ userId, status: newStatus });
  };

  const handleRoleToggle = async (user: UserWithRoles, role: UserRole) => {
    const newRoles = user.roles.includes(role)
      ? user.roles.filter(r => r !== role)
      : [...user.roles, role];
    
    updateRolesMutation.mutate({ userId: user.id, roles: newRoles });
  };

  const handleEditUser = (user: UserWithRoles) => {
    setEditingUser(user);
    setEditName(user.fullName);
  };

  const handleSaveEdit = () => {
    if (editingUser && editName.trim()) {
      updateProfileMutation.mutate({
        userId: editingUser.id,
        fullName: editName.trim()
      });
    }
  };

  const handleCreateUser = () => {
    if (!newUserData.email || !newUserData.password || !newUserData.fullName) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    createUserMutation.mutate(newUserData);
  };

  const handleUpdatePassword = () => {
    if (!editingUser || !newPassword) return;
    updatePasswordMutation.mutate({ userId: editingUser.id, password: newPassword });
  };

  const filteredUsers = selectedStatus === "all"
    ? users
    : users?.filter(user => user.status === selectedStatus);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gerenciar Usuários</h1>
        <div className="flex gap-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Preencha os dados do novo usuário
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUserData.email || ''}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUserData.password || ''}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    value={newUserData.fullName || ''}
                    onChange={(e) => setNewUserData({ ...newUserData, fullName: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Funções</Label>
                  <div className="flex gap-2">
                    {(['admin', 'promoter', 'seller'] as Array<UserRole>).map((role) => (
                      <Badge
                        key={role}
                        variant={newUserData.roles.includes(role) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          const currentRoles = newUserData.roles || [];
                          const newRoles = currentRoles.includes(role)
                            ? currentRoles.filter(r => r !== role)
                            : [...currentRoles, role];
                          setNewUserData({ ...newUserData, roles: newRoles });
                        }}
                      >
                        {role === 'admin' ? 'Admin' :
                         role === 'promoter' ? 'Promotor' :
                         'Vendedor'}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => {
                  if (!newUserData.email || !newUserData.password || !newUserData.fullName) {
                    toast.error('Preencha todos os campos obrigatórios');
                    return;
                  }
                  toast.success('Usuário criado com sucesso (simulado)');
                  setShowCreateDialog(false);
                }}>
                  Criar Usuário
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Select
            value={selectedStatus}
            onValueChange={setSelectedStatus}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
              <SelectItem value="suspended">Suspensos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Funções</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers?.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="flex items-center gap-2">
                  {user.fullName}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditUser(user)}
                  >
                    Editar
                  </Button>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      user.status === 'active' ? 'default' :
                      user.status === 'inactive' ? 'secondary' :
                      'destructive'
                    }
                  >
                    {user.status === 'active' ? 'Ativo' :
                     user.status === 'inactive' ? 'Inativo' :
                     'Suspenso'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {(['admin', 'promoter', 'seller'] as Array<UserRole>).map((role) => (
                      <Badge
                        key={role}
                        variant={user.roles.includes(role) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => handleRoleToggle(user, role)}
                      >
                        {role === 'admin' ? 'Admin' :
                         role === 'promoter' ? 'Promotor' :
                         'Vendedor'}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Select
                      value={user.status}
                      onValueChange={(value: 'active' | 'inactive' | 'suspended') => 
                        handleStatusChange(user.id, value)
                      }
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativar</SelectItem>
                        <SelectItem value="inactive">Inativar</SelectItem>
                        <SelectItem value="suspended">Suspender</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setEditingUser(user);
                        setShowPasswordDialog(true);
                      }}
                    >
                      <Key className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => setUserToDelete(user)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário aqui.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Digite o nome completo"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingUser(null)}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>
              Salvar alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              Digite a nova senha para o usuário.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite a nova senha"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordDialog(false);
                setNewPassword("");
              }}
            >
              Cancelar
            </Button>
            <Button onClick={() => {
              toast.success('Senha atualizada com sucesso (simulado)');
              setShowPasswordDialog(false);
              setNewPassword("");
            }}>
              Atualizar Senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário {userToDelete?.fullName}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                toast.success('Usuário excluído com sucesso (simulado)');
                setUserToDelete(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Users;
