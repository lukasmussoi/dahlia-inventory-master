
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "./userModel";

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
      const { data: isAdmin, error: adminError } = await supabase
        .rpc('is_admin', { user_id: user.id });
      
      if (adminError) {
        console.error("Model: Erro ao verificar admin:", adminError);
        throw adminError;
      }

      console.log("Model: Perfil encontrado:", profile?.id, "Is Admin:", isAdmin);

      return {
        profile,
        isAdmin: isAdmin || false
      };
    } catch (error) {
      console.error("Model: Erro ao obter perfil do usuário:", error);
      throw error;
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
      
      const { data: isAdmin, error: adminError } = await supabase
        .rpc('is_admin', { user_id: user.id });
      
      if (adminError) {
        console.error("Model: Erro ao verificar admin:", adminError);
        return false;
      }
      
      console.log("Model: Usuário é admin:", isAdmin);
      return isAdmin || false;
    } catch (error) {
      console.error("Model: Erro ao verificar se usuário é admin:", error);
      return false;
    }
  }
}
