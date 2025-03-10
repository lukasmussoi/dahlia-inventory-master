import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "./userModel";

export type UserRole = 'admin' | 'promoter' | 'seller';

export interface UserWithRoles extends UserProfile {
  roles: UserRole[];
}

export interface CreateUserData {
  email: string;
  password: string;
  fullName: string;
  roles: UserRole[];
}

export class UserRoleModel {
  // Verificar se o usuário é admin
  static async isUserAdmin(userId: string): Promise<boolean> {
    console.log("Verificando se usuário é admin:", userId);
    try {
      // Verificar com RPC
      const { data, error } = await supabase
        .rpc('is_admin', { user_id: userId });

      if (error) {
        console.error("Erro ao verificar se usuário é admin via RPC:", error);
        throw error;
      }
      
      console.log("Resultado da verificação admin via RPC:", data);
      
      if (data !== null) {
        return data;
      }
      
      // Caso a RPC falhe, tenta método alternativo
      console.log("Tentando método alternativo para verificar admin...");
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_role')
        .eq('user_id', userId)
        .eq('user_role', 'admin');

      if (rolesError) {
        console.error("Erro ao buscar papéis do usuário:", rolesError);
        throw rolesError;
      }
      
      console.log("Papéis de admin encontrados:", roles);
      return Array.isArray(roles) && roles.length > 0;
    } catch (error) {
      console.error("Erro completo ao verificar admin:", error);
      return false;
    }
  }

  // Buscar todos os usuários com suas funções
  static async getAllUsersWithRoles(): Promise<UserWithRoles[]> {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('status', 'active');

    if (profilesError) throw profilesError;

    const usersWithRoles: UserWithRoles[] = [];

    for (const profile of profiles) {
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_role')
        .eq('user_id', profile.id);

      if (rolesError) throw rolesError;

      usersWithRoles.push({
        ...profile,
        roles: roles.map(r => r.user_role as UserRole)
      });
    }

    return usersWithRoles;
  }

  // Atualizar funções do usuário
  static async updateUserRoles(userId: string, roles: UserRole[]): Promise<void> {
    // Primeiro, remove todas as funções existentes
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (deleteError) throw deleteError;

    // Depois, insere as novas funções
    if (roles.length > 0) {
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert(roles.map(role => ({
          user_id: userId,
          user_role: role
        })));

      if (insertError) throw insertError;
    }
  }

  // Atualizar status do usuário
  static async updateUserStatus(userId: string, status: 'active' | 'inactive' | 'suspended'): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', userId);

    if (error) throw error;
  }

  // Atualizar perfil do usuário
  static async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;
  }

  // Criar novo usuário
  static async createUser(userData: CreateUserData): Promise<void> {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        full_name: userData.fullName
      }
    });

    if (authError) throw authError;

    // Atualizar roles do usuário
    if (authData.user) {
      await this.updateUserRoles(authData.user.id, userData.roles);
    }
  }

  // Excluir usuário
  static async deleteUser(userId: string): Promise<void> {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) throw error;
  }

  // Atualizar senha do usuário
  static async updateUserPassword(userId: string, newPassword: string): Promise<void> {
    const { error } = await supabase.rpc('admin_update_user_password', {
      user_id: userId,
      new_password: newPassword
    });
    if (error) throw error;
  }
}
