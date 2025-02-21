
import { supabase } from "@/integrations/supabase/client";

export interface LabelHistory {
  id: string;
  inventory_id: string;
  user_id: string;
  quantity: number;
  printed_at: string;
  created_at: string;
  updated_at: string;
}

export class LabelModel {
  // Registrar nova impressão de etiqueta
  static async registerLabelPrint(inventoryId: string, quantity: number = 1): Promise<LabelHistory> {
    const { data, error } = await supabase
      .from('inventory_label_history')
      .insert({
        inventory_id: inventoryId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        quantity: quantity
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Buscar histórico de impressão por item
  static async getLabelHistoryByItem(inventoryId: string): Promise<LabelHistory[]> {
    const { data, error } = await supabase
      .from('inventory_label_history')
      .select('*')
      .eq('inventory_id', inventoryId)
      .order('printed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Buscar histórico completo de impressão
  static async getAllLabelHistory(): Promise<LabelHistory[]> {
    const { data, error } = await supabase
      .from('inventory_label_history')
      .select(`
        *,
        inventory:inventory (
          name,
          sku
        )
      `)
      .order('printed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}
