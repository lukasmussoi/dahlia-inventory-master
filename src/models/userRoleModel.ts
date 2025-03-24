
import { supabase } from '@/integrations/supabase/client';

export enum UserRole {
  ADMIN = 'admin',
  PROMOTER = 'promoter',
  RESELLER = 'reseller',
  USER = 'user'
}

// Interface for user with roles
export interface UserWithRoles {
  id: string;
  email: string;
  full_name: string;
  status: 'active' | 'inactive' | 'suspended';
  roles: UserRole[];
}

// Interface for creating a new user
export interface CreateUserData {
  email: string;
  password: string;
  fullName: string;
  roles: UserRole[];
}

export class UserRoleModel {
  // Verificar se o usuário é administrador
  static async isUserAdmin(userId: string): Promise<boolean> {
    try {
      console.log("UserRoleModel: Verificando se usuário é admin:", userId);
      if (!userId) return false;
      
      const { data, error } = await supabase.rpc('is_admin', { user_id: userId });
      
      if (error) {
        console.error("UserRoleModel: Erro ao verificar se usuário é admin:", error);
        return false;
      }
      
      return !!data;
    } catch (error) {
      console.error("UserRoleModel: Erro ao verificar se usuário é admin:", error);
      return false;
    }
  }
  
  // Obter todos os papéis de um usuário
  static async getUserRoles(userId: string): Promise<UserRole[]> {
    try {
      console.log("UserRoleModel: Buscando papéis do usuário:", userId);
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_role')
        .eq('user_id', userId);
      
      if (error) {
        console.error("UserRoleModel: Erro ao buscar papéis do usuário:", error);
        throw error;
      }
      
      // Converter os papéis para o enum UserRole
      return (data || []).map(role => role.user_role as UserRole);
    } catch (error) {
      console.error("UserRoleModel: Erro ao buscar papéis do usuário:", error);
      return [];
    }
  }
  
  // Verificar se o usuário tem um papel específico
  static async hasUserRole(userId: string, role: UserRole): Promise<boolean> {
    try {
      console.log(`UserRoleModel: Verificando se usuário ${userId} tem o papel ${role}`);
      if (!userId) return false;
      
      const roles = await this.getUserRoles(userId);
      return roles.includes(role);
    } catch (error) {
      console.error(`UserRoleModel: Erro ao verificar se usuário tem o papel ${role}:`, error);
      return false;
    }
  }

  // Obter todos os usuários com seus papéis
  static async getAllUsersWithRoles(): Promise<UserWithRoles[]> {
    try {
      // Buscar todos os usuários
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, full_name');
      
      if (usersError) throw usersError;
      if (!users || users.length === 0) return [];
      
      // Para cada usuário, buscar os papéis e outras informações
      const usersWithRoles = await Promise.all(
        users.map(async (user) => {
          const roles = await this.getUserRoles(user.id);
          
          // Buscar email e status do usuário
          const { data: auth_user, error: authError } = await supabase
            .from('auth.users')
            .select('email, status')
            .eq('id', user.id)
            .maybeSingle();
          
          return {
            id: user.id,
            full_name: user.full_name,
            email: auth_user?.email || '',
            status: (auth_user?.status || 'inactive') as 'active' | 'inactive' | 'suspended',
            roles
          };
        })
      );
      
      return usersWithRoles;
    } catch (error) {
      console.error("Erro ao buscar todos os usuários com papéis:", error);
      return [];
    }
  }

  // Atualizar o status de um usuário
  static async updateUserStatus(userId: string, status: 'active' | 'inactive' | 'suspended'): Promise<boolean> {
    try {
      // Atualizar o status na tabela de perfis
      const { error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', userId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Erro ao atualizar status do usuário:", error);
      return false;
    }
  }

  // Atualizar os papéis de um usuário
  static async updateUserRoles(userId: string, roles: UserRole[]): Promise<boolean> {
    try {
      // Remover todos os papéis existentes
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      
      if (deleteError) throw deleteError;
      
      // Se não houver novos papéis para adicionar, retornar sucesso
      if (roles.length === 0) return true;
      
      // Adicionar os novos papéis
      const rolesToInsert = roles.map(role => ({
        user_id: userId,
        user_role: role
      }));
      
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert(rolesToInsert);
      
      if (insertError) throw insertError;
      
      return true;
    } catch (error) {
      console.error("Erro ao atualizar papéis do usuário:", error);
      return false;
    }
  }

  // Atualizar o perfil de um usuário
  static async updateUserProfile(userId: string, data: { full_name: string }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', userId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Erro ao atualizar perfil do usuário:", error);
      return false;
    }
  }

  // Criar um novo usuário
  static async createUser(userData: CreateUserData): Promise<boolean> {
    try {
      // Criar o usuário no auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
      });
      
      if (authError) throw authError;
      if (!authData.user) throw new Error("Falha ao criar usuário");
      
      // Criar o perfil do usuário
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: userData.fullName
        });
      
      if (profileError) throw profileError;
      
      // Atribuir papéis ao usuário
      if (userData.roles && userData.roles.length > 0) {
        await this.updateUserRoles(authData.user.id, userData.roles);
      }
      
      return true;
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      return false;
    }
  }

  // Excluir um usuário
  static async deleteUser(userId: string): Promise<boolean> {
    try {
      // Excluir o usuário no auth
      const { error } = await supabase.auth.admin.deleteUser(userId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      return false;
    }
  }

  // Atualizar a senha de um usuário
  static async updateUserPassword(userId: string, password: string): Promise<boolean> {
    try {
      const { error } = await supabase.auth.admin.updateUserById(
        userId,
        { password }
      );
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Erro ao atualizar senha do usuário:", error);
      return false;
    }
  }
}
