
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "./userModel";
import { UserRoleModel } from "./userRoleModel";

export class AuthModel {
  // Função para verificar se o usuário está autenticado
  static async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Erro ao obter usuário atual:", error);
        throw error;
      }
      return user;
    } catch (error) {
      console.error("Exceção ao obter usuário atual:", error);
      throw error;
    }
  }

  // Função para buscar o perfil e papel do usuário atual
  static async getCurrentUserProfile(): Promise<{profile: UserProfile | null, isAdmin: boolean}> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error("Erro ao obter usuário autenticado:", authError);
        throw authError;
      }
      if (!user) {
        console.log("Nenhum usuário autenticado encontrado");
        return { profile: null, isAdmin: false };
      }

      console.log("Usuário autenticado encontrado:", user.id);

      // Buscar perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, status, created_at, updated_at')
        .eq('id', user.id)
        .maybeSingle();
      
      if (profileError) {
        console.error("Erro ao buscar perfil:", profileError);
        throw profileError;
      }

      console.log("Perfil encontrado:", profile);

      // Verificar se o usuário é admin usando a nova função RPC
      const isAdmin = await UserRoleModel.isUserAdmin(user.id);
      console.log("Usuário é admin:", isAdmin);

      return {
        profile,
        isAdmin
      };
    } catch (error) {
      console.error("Exceção ao buscar perfil e papel do usuário:", error);
      throw error;
    }
  }
  
  // Função para verificar se o usuário logado é administrador
  static async checkIsUserAdmin(): Promise<boolean> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        console.log("Usuário não autenticado ou erro ao obter usuário");
        return false;
      }
      
      // Verificar se o usuário é administrador
      const isAdmin = await UserRoleModel.isUserAdmin(user.id);
      console.log("Verificação de admin para", user.id, ":", isAdmin);
      return isAdmin;
    } catch (error) {
      console.error("Exceção ao verificar se usuário é admin:", error);
      return false;
    }
  }

  // Função para obter o perfil e papéis do usuário atual
  static async getUserProfileWithRoles() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error("Erro ao obter usuário autenticado:", authError);
        throw authError;
      }
      if (!user) {
        console.log("Nenhum usuário autenticado encontrado");
        return { profile: null, isAdmin: false };
      }

      console.log("Buscando perfil e papéis para usuário:", user.id);

      // Buscar perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, status, created_at, updated_at')
        .eq('id', user.id)
        .maybeSingle();
      
      if (profileError) {
        console.error("Erro ao buscar perfil:", profileError);
        throw profileError;
      }

      // Verificar se o usuário é admin
      const isAdmin = await UserRoleModel.isUserAdmin(user.id);
      console.log("Perfil e papéis encontrados:", { profile, isAdmin });

      return {
        profile,
        isAdmin
      };
    } catch (error) {
      console.error('Erro ao buscar perfil e papéis do usuário:', error);
      throw error;
    }
  }
}
