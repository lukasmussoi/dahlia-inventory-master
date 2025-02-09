
import { supabase } from "@/integrations/supabase/client";

// Interface para maleta
export interface Suitcase {
  id: string;
  seller_id: string;
  status: 'in_use' | 'returned' | 'lost';
  created_at?: string;
  updated_at?: string;
}

export class SuitcaseModel {
  // Buscar total de maletas ativas
  static async getActiveSuitcases(): Promise<number> {
    const { data, error } = await supabase
      .from('suitcases')
      .select('id')
      .eq('status', 'in_use');
    
    if (error) throw error;
    return data.length;
  }

  // Buscar todas as maletas
  static async getAllSuitcases(): Promise<Suitcase[]> {
    const { data, error } = await supabase
      .from('suitcases')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
}
