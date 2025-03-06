
import { supabase } from "@/integrations/supabase/client";

export type UserRole = string;

export interface UserWithRoles {
  id: string;
  email: string;
  fullName: string;
  status: string;
  roles: string[];
}

export interface CreateUserData {
  email: string;
  password: string;
  fullName: string;
  roles: string[];
}

export class UserRoleModel {
  // Buscar todos os usuários com suas funções
  static async getAllUsersWithRoles(): Promise<UserWithRoles[]> {
    try {
      // Primeiro, busca todos os usuários
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, status');

      if (profilesError) {
        console.error('Erro ao buscar perfis:', profilesError);
        throw profilesError;
      }

      if (!profiles || profiles.length === 0) {
        return [];
      }

      // Buscar dados de email para cada perfil
      // Este exemplo assume que você tem uma função que pode buscar emails de usuários
      // Normalmente isso seria feito via API administrativa do Supabase
      // Aqui estamos simulando isso

      // Para cada perfil, buscar as funções
      const usersWithRoles = await Promise.all(
        profiles.map(async (profile) => {
          // Buscar funções do usuário
          const { data: roles, error: rolesError } = await supabase
            .from('user_roles')
            .select('user_role')
            .eq('user_id', profile.id);

          if (rolesError) {
            console.error(`Erro ao buscar funções para o usuário ${profile.id}:`, rolesError);
            return {
              id: profile.id,
              email: 'Email não disponível', // Placeholder
              fullName: profile.full_name,
              status: profile.status || 'inactive',
              roles: []
            };
          }

          // Obter email do usuário (simulado)
          const email = `${profile.full_name.toLowerCase().replace(/\s+/g, '.')}@example.com`;

          return {
            id: profile.id,
            email: email,
            fullName: profile.full_name,
            status: profile.status || 'inactive',
            roles: roles?.map(r => r.user_role) || []
          };
        })
      );

      return usersWithRoles;
    } catch (error) {
      console.error('Erro ao buscar usuários com funções:', error);
      throw error;
    }
  }

  // Atualizar status do usuário
  static async updateUserStatus(userId: string, status: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', userId);

      if (error) {
        console.error('Erro ao atualizar status do usuário:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erro ao atualizar status do usuário:', error);
      throw error;
    }
  }

  // Atualizar funções do usuário
  static async updateUserRoles(userId: string, roles: string[]): Promise<void> {
    try {
      // Primeiro, remove todas as funções atuais
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Erro ao remover funções do usuário:', deleteError);
        throw deleteError;
      }

      // Em seguida, insere as novas funções
      if (roles.length > 0) {
        const rolesToInsert = roles.map(role => ({
          user_id: userId,
          user_role: role
        }));

        const { error: insertError } = await supabase
          .from('user_roles')
          .insert(rolesToInsert);

        if (insertError) {
          console.error('Erro ao inserir novas funções do usuário:', insertError);
          throw insertError;
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar funções do usuário:', error);
      throw error;
    }
  }

  // Atualizar perfil do usuário
  static async updateUserProfile(userId: string, fullName: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', userId);

      if (error) {
        console.error('Erro ao atualizar perfil do usuário:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil do usuário:', error);
      throw error;
    }
  }

  // Criar novo usuário
  static async createUser(userData: CreateUserData): Promise<string> {
    try {
      // Este exemplo assume que você tem uma função que pode criar usuários
      // Normalmente isso seria feito via API administrativa do Supabase
      // Aqui estamos simulando o processo

      // Simulando criação de usuário
      const newUserId = crypto.randomUUID();

      // Criar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: newUserId,
          full_name: userData.fullName,
          status: 'active'
        });

      if (profileError) {
        console.error('Erro ao criar perfil do usuário:', profileError);
        throw profileError;
      }

      // Adicionar funções
      if (userData.roles.length > 0) {
        const rolesToInsert = userData.roles.map(role => ({
          user_id: newUserId,
          user_role: role
        }));

        const { error: rolesError } = await supabase
          .from('user_roles')
          .insert(rolesToInsert);

        if (rolesError) {
          console.error('Erro ao adicionar funções do usuário:', rolesError);
          throw rolesError;
        }
      }

      return newUserId;
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  }

  // Excluir usuário
  static async deleteUser(userId: string): Promise<void> {
    try {
      // Primeiro, remove todas as funções
      const { error: rolesError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (rolesError) {
        console.error('Erro ao remover funções do usuário:', rolesError);
        throw rolesError;
      }

      // Em seguida, remove o perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        console.error('Erro ao remover perfil do usuário:', profileError);
        throw profileError;
      }

      // Normalmente você também removeria o usuário da tabela auth.users
      // mas isso requer privilégios administrativos
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      throw error;
    }
  }

  // Atualizar senha do usuário
  static async updateUserPassword(userId: string, newPassword: string): Promise<void> {
    try {
      // Este exemplo assume que você tem acesso à função admin_update_user_password
      const { error } = await supabase.rpc('admin_update_user_password', {
        user_id: userId,
        new_password: newPassword
      });

      if (error) {
        console.error('Erro ao atualizar senha do usuário:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erro ao atualizar senha do usuário:', error);
      throw error;
    }
  }

  // Verificar se o usuário atual é administrador
  static async checkIsUserAdmin(): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('is_admin');

      if (error) {
        console.error('Erro ao verificar se o usuário é administrador:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Erro ao verificar se o usuário é administrador:', error);
      return false;
    }
  }
}
