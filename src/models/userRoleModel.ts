
import { supabase } from '@/integrations/supabase/client';

export enum UserRole {
  ADMIN = 'admin',
  PROMOTER = 'promoter',
  RESELLER = 'reseller',
  USER = 'user'
}

export class UserRoleModel {
  // Verificar se o usuário é administrador
  static async isUserAdmin(userId: string): Promise<boolean> {
    try {
      console.log("UserRoleModel: Verificando se usuário é admin:", userId);
      if (!userId) return false;
      
      const { data, error } = await supabase.rpc('is_admin', { user_id: userId });
      
      if (error) {
        console.error("UserRoleModel: Erro ao verificar se usuário é admin:", error);
        return false;
      }
      
      return !!data;
    } catch (error) {
      console.error("UserRoleModel: Erro ao verificar se usuário é admin:", error);
      return false;
    }
  }
  
  // Obter todos os papéis de um usuário
  static async getUserRoles(userId: string): Promise<UserRole[]> {
    try {
      console.log("UserRoleModel: Buscando papéis do usuário:", userId);
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_role')
        .eq('user_id', userId);
      
      if (error) {
        console.error("UserRoleModel: Erro ao buscar papéis do usuário:", error);
        throw error;
      }
      
      // Converter os papéis para o enum UserRole
      return (data || []).map(role => role.user_role as UserRole);
    } catch (error) {
      console.error("UserRoleModel: Erro ao buscar papéis do usuário:", error);
      return [];
    }
  }
  
  // Verificar se o usuário tem um papel específico
  static async hasUserRole(userId: string, role: UserRole): Promise<boolean> {
    try {
      console.log(`UserRoleModel: Verificando se usuário ${userId} tem o papel ${role}`);
      if (!userId) return false;
      
      const roles = await this.getUserRoles(userId);
      return roles.includes(role);
    } catch (error) {
      console.error(`UserRoleModel: Erro ao verificar se usuário tem o papel ${role}:`, error);
      return false;
    }
  }
}
