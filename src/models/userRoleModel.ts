
import { supabase } from "@/integrations/supabase/client";

export interface UserRole {
  id: string;
  user_id: string;
  user_role: 'admin' | 'promoter' | 'seller';
  created_at: string;
}

export class UserRoleModel {
  // Verificar se um usuário é admin
  static async isUserAdmin(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('check_is_admin', { user_id: userId });
      
      if (error) throw error;
      return !!data; // Converter para boolean
    } catch (error) {
      console.error('Erro ao verificar se o usuário é admin:', error);
      return false;
    }
  }

  // Buscar todos os papéis de um usuário
  static async getUserRoles(userId: string): Promise<UserRole[]> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data || [];
  }

  // Adicionar um papel a um usuário
  static async addUserRole(userId: string, role: 'admin' | 'promoter' | 'seller'): Promise<UserRole> {
    const { data, error } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, user_role: role })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Remover um papel de um usuário
  static async removeUserRole(roleId: string): Promise<void> {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('id', roleId);
    
    if (error) throw error;
  }
}
