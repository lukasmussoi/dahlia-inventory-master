
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
  static async getCurrentUserProfile(): Promise<UserProfile | null> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) return null;

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, status, created_at, updated_at')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError) throw profileError;

    return profile;
  }

  // Função para verificar se o usuário atual é administrador
  static async checkIsUserAdmin(): Promise<boolean> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) return false;
    
    return await UserRoleModel.isCurrentUserAdmin();
  }
}
