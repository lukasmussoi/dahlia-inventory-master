
import { supabase } from "@/integrations/supabase/client";

export interface LabelHistory {
  id: string;
  inventory_id: string;
  user_id: string;
  printed_at: string;
  quantity: number;
  created_at: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
}

export class LabelModel {
  // Buscar todo o histórico de impressão de etiquetas
  static async getAllLabelHistory(): Promise<LabelHistory[]> {
    const { data, error } = await supabase
      .from('inventory_label_history')
      .select('*')
      .order('printed_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Buscar histórico de impressão para um item específico
  static async getItemLabelHistory(inventoryId: string): Promise<LabelHistory[]> {
    const { data, error } = await supabase
      .from('inventory_label_history')
      .select('*')
      .eq('inventory_id', inventoryId)
      .order('printed_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Registrar uma nova impressão de etiqueta
  static async registerLabelPrint(inventoryId: string, quantity: number = 1): Promise<void> {
    const { error } = await supabase
      .from('inventory_label_history')
      .insert({
        inventory_id: inventoryId,
        quantity: quantity,
        printed_at: new Date().toISOString(),
      });

    if (error) throw error;
  }

  // Buscar perfis de usuários para exibir nomes
  static async getAllProfiles(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name');

    if (error) throw error;
    return data;
  }
}
