
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "./userModel";

export type UserRole = 'admin' | 'promoter' | 'seller';

export interface UserWithRoles extends UserProfile {
  roles: UserRole[];
}

export class UserRoleModel {
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

  // Verificar se o usuário é admin
  static async isUserAdmin(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('is_admin', { user_id: userId });

    if (error) throw error;
    return data || false;
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
}
