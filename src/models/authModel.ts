
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "./userModel";
import { UserRoleModel } from "./userRoleModel";

export class AuthModel {
  // Função para verificar se o usuário está autenticado
  static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  }

  // Função para buscar o perfil e papel do usuário atual
  static async getCurrentUserProfile(): Promise<{profile: UserProfile | null, isAdmin: boolean}> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) return { profile: null, isAdmin: false };

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, status, created_at, updated_at')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError) throw profileError;

    // Verificar se o usuário é admin usando a nova função RPC
    const isAdmin = await UserRoleModel.isUserAdmin(user.id);

    return {
      profile,
      isAdmin
    };
  }
  
  // Função para verificar se o usuário logado é administrador
  static async checkIsUserAdmin(): Promise<boolean> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return false;
    
    // Verificar se o usuário é administrador
    return await UserRoleModel.isUserAdmin(user.id);
  }
}
