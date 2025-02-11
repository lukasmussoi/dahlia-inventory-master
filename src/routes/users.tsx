
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Users = () => {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

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

  const handleStatusChange = async (userId: string, newStatus: 'active' | 'inactive' | 'suspended') => {
    updateStatusMutation.mutate({ userId, status: newStatus });
  };

  const handleRoleToggle = async (user: UserWithRoles, role: UserRole) => {
    const newRoles = user.roles.includes(role)
      ? user.roles.filter(r => r !== role)
      : [...user.roles, role];
    
    updateRolesMutation.mutate({ userId: user.id, roles: newRoles });
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
                <TableCell>{user.full_name}</TableCell>
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
                    {['admin', 'promoter', 'seller'].map((role) => (
                      <Badge
                        key={role}
                        variant={user.roles.includes(role as UserRole) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => handleRoleToggle(user, role as UserRole)}
                      >
                        {role === 'admin' ? 'Admin' :
                         role === 'promoter' ? 'Promotor' :
                         'Vendedor'}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Users;
