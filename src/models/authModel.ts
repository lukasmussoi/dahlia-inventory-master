
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "./userModel";
import { UserRoleModel, UserRole } from "./userRoleModel";

export class AuthModel {
  // Expor o cliente supabase para ser usado em outros métodos
  static supabase = supabase;
  
  // Função para verificar se o usuário está autenticado
  static async getCurrentUser() {
    try {
      console.log("Model: Verificando usuário atual...");
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Model: Erro ao obter usuário:", error);
        return null;
      }
      console.log("Model: Usuário encontrado:", user?.id);
      return user;
    } catch (error) {
      console.error("Model: Erro ao obter usuário:", error);
      return null;
    }
  }

  // Função para buscar o perfil e papel do usuário atual
  static async getCurrentUserProfile(): Promise<{profile: UserProfile | null, isAdmin: boolean}> {
    try {
      console.log("Model: Buscando perfil do usuário...");
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error("Model: Erro de autenticação ou usuário não encontrado:", authError);
        return { profile: null, isAdmin: false };
      }

      // Buscar perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, status, created_at, updated_at')
        .eq('id', user.id)
        .maybeSingle();
      
      if (profileError) {
        console.error("Model: Erro ao buscar perfil:", profileError);
        throw profileError;
      }

      // Verificar se o usuário é admin usando a função RPC
      const isAdmin = await UserRoleModel.isUserAdmin(user.id);
      console.log("Model: Perfil encontrado:", profile?.id, "Is Admin:", isAdmin);

      return {
        profile,
        isAdmin
      };
    } catch (error) {
      console.error("Model: Erro ao obter perfil do usuário:", error);
      throw error;
    }
  }

  // Função para buscar os papéis do usuário
  static async getUserRoles(userId: string): Promise<UserRole[]> {
    try {
      console.log("Model: Buscando papéis do usuário...");
      if (!userId) {
        console.error("Model: ID do usuário não fornecido");
        return [];
      }
      
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('user_role')
        .eq('user_id', userId);
      
      if (error) {
        console.error("Model: Erro ao buscar papéis do usuário:", error);
        throw error;
      }
      
      return roles.map(r => r.user_role as UserRole) || [];
    } catch (error) {
      console.error("Model: Erro ao buscar papéis do usuário:", error);
      return [];
    }
  }

  // Função para verificar se o usuário atual é admin
  static async checkIsUserAdmin(): Promise<boolean> {
    try {
      console.log("Model: Verificando se usuário é admin...");
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        console.error("Model: Erro ao verificar usuário:", error);
        return false;
      }
      
      const isAdmin = await UserRoleModel.isUserAdmin(user.id);
      console.log("Model: Usuário é admin:", isAdmin);
      return isAdmin;
    } catch (error) {
      console.error("Model: Erro ao verificar se usuário é admin:", error);
      return false;
    }
  }
}
