
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "./userModel";
import { UserRoleModel } from "./userRoleModel";

export class AuthModel {
  // Função para verificar se o usuário está autenticado
  static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error("Erro ao obter usuário atual:", error);
      throw error;
    }
    return user;
  }

  // Função para buscar o perfil e papel do usuário atual
  static async getCurrentUserProfile(): Promise<{profile: UserProfile | null, isAdmin: boolean}> {
    console.log("Buscando perfil do usuário atual...");
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error("Erro ao obter usuário atual:", authError);
        throw authError;
      }
      
      if (!user) {
        console.log("Nenhum usuário autenticado");
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

      // Verificar se o usuário é admin usando a função RPC
      try {
        const { data: isAdminResult, error: isAdminError } = await supabase
          .rpc('is_admin', { user_id: user.id });
          
        if (isAdminError) {
          console.error("Erro ao verificar se usuário é admin:", isAdminError);
          throw isAdminError;
        }
        
        console.log("Permissões de admin:", isAdminResult);
        
        return {
          profile,
          isAdmin: isAdminResult || false
        };
      } catch (roleError) {
        console.error("Erro ao verificar papel de admin:", roleError);
        // Caso não consiga verificar pela função, tenta manualmente
        const isAdmin = await UserRoleModel.isUserAdmin(user.id);
        console.log("Permissões de admin (alternativo):", isAdmin);
        
        return {
          profile,
          isAdmin
        };
      }
    } catch (error) {
      console.error("Erro completo ao obter perfil do usuário:", error);
      throw error;
    }
  }
}
