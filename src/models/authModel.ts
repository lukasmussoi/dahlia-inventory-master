
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "./userModel";

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
      .select('*')
      .eq('id', user.id)
      .single();
    if (profileError) throw profileError;

    // Verificar se o usuário é admin - Note a especificação da tabela user_roles
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_roles.role')
      .eq('user_id', user.id)
      .eq('user_roles.role', 'admin');
    if (rolesError) throw rolesError;

    return {
      profile,
      isAdmin: roles && roles.length > 0
    };
  }
}
