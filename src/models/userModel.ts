
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

// Interface para perfil de usuário com status atualizado
export interface UserProfile {
  id: string;
  full_name: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at?: string;
  updated_at?: string;
}

export class UserModel {
  // Buscar perfil do usuário
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }

  // Buscar todos os usuários ativos
  static async getActiveUsers(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('status', 'active');
    
    if (error) throw error;
    return data || [];
  }

  // Atualizar perfil do usuário
  static async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}
