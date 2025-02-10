
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
      .select('id, full_name, status, created_at, updated_at')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError) throw profileError;

    // Verificar se o usuário é admin usando a função has_role
    const { data: isAdmin, error: roleError } = await supabase
      .rpc('has_role', { role: 'admin' });
    if (roleError) throw roleError;

    return {
      profile,
      isAdmin: isAdmin || false
    };
  }
}

