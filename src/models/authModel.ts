
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "./userModel";
import { UserRoleModel } from "./userRoleModel";

export class AuthModel {
  // Expor o cliente supabase para ser usado em outros métodos
  static supabase = supabase;
  
  // Função para verificar se o usuário está autenticado
  static async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Erro ao obter usuário:", error);
        return null;
      }
      return user;
    } catch (error) {
      console.error("Erro ao obter usuário:", error);
      return null;
    }
  }

  // Função para buscar o perfil e papel do usuário atual
  static async getCurrentUserProfile(): Promise<{profile: UserProfile | null, isAdmin: boolean}> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error("Erro de autenticação ou usuário não encontrado:", authError);
        return { profile: null, isAdmin: false };
      }

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

      // Verificar se o usuário é admin usando a função RPC
      const isAdmin = await UserRoleModel.isUserAdmin(user.id);
      console.log("Is Admin:", isAdmin);

      return {
        profile,
        isAdmin
      };
    } catch (error) {
      console.error("Erro ao obter perfil do usuário:", error);
      throw error;
    }
  }

  // Função para verificar se o usuário atual é admin
  static async checkIsUserAdmin(): Promise<boolean> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        console.error("Erro ao verificar usuário:", error);
        return false;
      }
      
      return await UserRoleModel.isUserAdmin(user.id);
    } catch (error) {
      console.error("Erro ao verificar se usuário é admin:", error);
      return false;
    }
  }
}
