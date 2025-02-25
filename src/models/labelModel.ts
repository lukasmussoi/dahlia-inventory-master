
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
    console.log('Buscando histórico de etiquetas...');
    const { data, error } = await supabase
      .from('inventory_label_history')
      .select('*')
      .order('printed_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar histórico:', error);
      throw error;
    }
    console.log('Histórico encontrado:', data);
    return data;
  }

  // Buscar histórico de impressão para um item específico
  static async getItemLabelHistory(inventoryId: string): Promise<LabelHistory[]> {
    console.log('Buscando histórico para o item:', inventoryId);
    const { data, error } = await supabase
      .from('inventory_label_history')
      .select('*')
      .eq('inventory_id', inventoryId)
      .order('printed_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar histórico do item:', error);
      throw error;
    }
    console.log('Histórico do item encontrado:', data);
    return data;
  }

  // Registrar uma nova impressão de etiqueta
  static async registerLabelPrint(inventoryId: string, quantity: number = 1): Promise<void> {
    console.log('Registrando impressão de etiqueta:', { inventoryId, quantity });
    // Obter o usuário atual
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Erro ao obter usuário:', userError);
      throw userError;
    }
    if (!user) {
      console.error('Usuário não autenticado');
      throw new Error('Usuário não autenticado');
    }

    const { error } = await supabase
      .from('inventory_label_history')
      .insert({
        inventory_id: inventoryId,
        user_id: user.id,
        quantity: quantity,
        printed_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Erro ao registrar impressão:', error);
      throw error;
    }
    console.log('Impressão registrada com sucesso');
  }

  // Buscar perfis de usuários para exibir nomes
  static async getAllProfiles(): Promise<UserProfile[]> {
    console.log('Buscando perfis de usuários...');
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name');

    if (error) {
      console.error('Erro ao buscar perfis:', error);
      throw error;
    }
    console.log('Perfis encontrados:', data);
    return data;
  }
}
