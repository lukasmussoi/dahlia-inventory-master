
import { supabase } from "@/integrations/supabase/client";

export interface UserRole {
  id: string;
  user_id: string;
  user_role: 'admin' | 'promoter' | 'seller';
  created_at: string;
}

export interface UserWithRoles {
  id: string;
  full_name: string;
  status: 'active' | 'inactive' | 'suspended';
  email?: string;
  roles: UserRole[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  fullName: string;
  roles: UserRole[];
}

export class UserRoleModel {
  // Verificar se um usuário é admin
  static async isUserAdmin(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('check_is_admin', { user_id: userId });
      
      if (error) throw error;
      return !!data; // Converter para boolean
    } catch (error) {
      console.error('Erro ao verificar se o usuário é admin:', error);
      return false;
    }
  }

  // Buscar todos os papéis de um usuário
  static async getUserRoles(userId: string): Promise<UserRole[]> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data || [];
  }

  // Adicionar um papel a um usuário
  static async addUserRole(userId: string, role: 'admin' | 'promoter' | 'seller'): Promise<UserRole> {
    const { data, error } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, user_role: role })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Remover um papel de um usuário
  static async removeUserRole(roleId: string): Promise<void> {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('id', roleId);
    
    if (error) throw error;
  }

  // Buscar todos os usuários com seus papéis
  static async getAllUsersWithRoles(): Promise<UserWithRoles[]> {
    // Buscar todos os perfis
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, status, created_at, updated_at');
    
    if (profilesError) throw profilesError;
    
    if (!profiles || profiles.length === 0) return [];
    
    // Buscar papéis para cada usuário
    const usersWithRoles: UserWithRoles[] = await Promise.all(
      profiles.map(async (profile) => {
        const roles = await this.getUserRoles(profile.id);
        return {
          id: profile.id,
          full_name: profile.full_name,
          status: profile.status as 'active' | 'inactive' | 'suspended',
          roles: roles.map(r => r.user_role) as UserRole[],
          created_at: profile.created_at,
          updated_at: profile.updated_at
        };
      })
    );
    
    return usersWithRoles;
  }

  // Atualizar status do usuário
  static async updateUserStatus(userId: string, status: 'active' | 'inactive' | 'suspended'): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', userId);
    
    if (error) throw error;
  }

  // Atualizar papéis de um usuário
  static async updateUserRoles(userId: string, roles: UserRole[]): Promise<void> {
    // Primeiro removemos todos os papéis existentes
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);
    
    if (deleteError) throw deleteError;
    
    // Depois adicionamos os novos papéis
    if (roles.length > 0) {
      const rolesToInsert = roles.map(role => ({
        user_id: userId,
        user_role: role
      }));
      
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert(rolesToInsert);
      
      if (insertError) throw insertError;
    }
  }

  // Atualizar perfil do usuário
  static async updateUserProfile(userId: string, updates: { full_name: string }): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
    
    if (error) throw error;
  }

  // Criar um novo usuário
  static async createUser(userData: CreateUserData): Promise<string> {
    // Criar usuário no Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: { full_name: userData.fullName }
    });
    
    if (authError) throw authError;
    
    const userId = authData.user.id;
    
    // Adicionar papéis ao usuário
    if (userData.roles.length > 0) {
      await this.updateUserRoles(userId, userData.roles);
    }
    
    return userId;
  }

  // Excluir um usuário
  static async deleteUser(userId: string): Promise<void> {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    
    if (error) throw error;
  }

  // Atualizar senha do usuário
  static async updateUserPassword(userId: string, password: string): Promise<void> {
    const { error } = await supabase.rpc('admin_update_user_password', {
      user_id: userId,
      new_password: password
    });
    
    if (error) throw error;
  }

  // Método auxiliar: verificar se o usuário atual tem permissão de admin
  static async checkIsUserAdmin(): Promise<boolean> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return false;
    
    // Verificar se o usuário é administrador
    return await this.isUserAdmin(user.id);
  }
}
