
import { supabase } from "@/integrations/supabase/client";

// Tipo para representar perfis de usuário
export interface UserProfile {
  id: string;
  email?: string;
  full_name: string;
  status?: string;
  roles?: string[];
  isAdmin?: boolean;
}

export class AuthModel {
  // Fazer login do usuário
  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  }

  // Fazer logout do usuário
  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  }

  // Verificar se o usuário está autenticado
  static async isAuthenticated() {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  }

  // Obter usuário atual
  static async getCurrentUser() {
    const { data } = await supabase.auth.getSession();
    return data.session?.user;
  }

  // Obter perfil do usuário
  static async getUserProfile(userId?: string) {
    try {
      // Se não for fornecido um ID, usar o usuário atual
      if (!userId) {
        const user = await this.getCurrentUser();
        if (!user) return null;
        userId = user.id;
      }

      // Buscar perfil do usuário
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar perfil do usuário:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao obter perfil do usuário:', error);
      throw error;
    }
  }

  // Obter perfil do usuário com suas funções
  static async getUserProfileWithRoles(): Promise<UserProfile | null> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return null;

      // Buscar perfil
      const profile = await this.getUserProfile(user.id);
      if (!profile) return null;

      // Buscar funções do usuário
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_role')
        .eq('user_id', user.id);

      if (rolesError) {
        console.error('Erro ao buscar funções do usuário:', rolesError);
        throw rolesError;
      }

      console.log('Perfil do usuário:', profile);
      console.log('Funções do usuário:', roles);

      // Verificar se o usuário é administrador
      const isAdmin = await this.isUserAdmin(user.id);

      // Retornar perfil completo
      return {
        id: profile.id,
        email: user.email,
        full_name: profile.full_name,
        status: profile.status,
        roles: roles?.map(r => r.user_role) || [],
        isAdmin
      };
    } catch (error) {
      console.error('Erro ao obter perfil do usuário com funções:', error);
      return null;
    }
  }

  // Verificar se o usuário é administrador
  static async isUserAdmin(userId?: string): Promise<boolean> {
    try {
      // Se não for fornecido um ID, usar o usuário atual
      if (!userId) {
        const user = await this.getCurrentUser();
        if (!user) return false;
        userId = user.id;
      }

      // Verificar se o usuário tem o papel de administrador
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_role')
        .eq('user_id', userId)
        .eq('user_role', 'admin')
        .maybeSingle();

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
