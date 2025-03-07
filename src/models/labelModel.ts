
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

export interface CustomLabel {
  id: string;
  orientacao: string;
  formato_pagina: string;
  tipo: string;
  descricao: string;
  criado_em: string;
  atualizado_em: string;
  criado_por: string;
  campos: any[];
  margem_direita: number;
  margem_esquerda: number;
  margem_inferior: number;
  margem_superior: number;
  altura_pagina: number | null;
  largura_pagina: number | null;
  espacamento_vertical: number;
  espacamento_horizontal: number;
  altura: number;
  largura: number;
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

  // Métodos para etiquetas customizadas
  // Buscar todas as etiquetas customizadas
  static async getAllCustomLabels(): Promise<CustomLabel[]> {
    console.log('Buscando etiquetas customizadas...');
    const { data, error } = await supabase
      .from('etiquetas_custom')
      .select('*')
      .order('criado_em', { ascending: false });

    if (error) {
      console.error('Erro ao buscar etiquetas customizadas:', error);
      throw error;
    }
    console.log('Etiquetas customizadas encontradas:', data);
    return data;
  }

  // Buscar uma etiqueta customizada específica
  static async getCustomLabel(id: string): Promise<CustomLabel> {
    console.log('Buscando etiqueta customizada:', id);
    const { data, error } = await supabase
      .from('etiquetas_custom')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar etiqueta customizada:', error);
      throw error;
    }
    console.log('Etiqueta customizada encontrada:', data);
    return data;
  }

  // Criar uma nova etiqueta customizada
  static async createCustomLabel(labelData: Omit<CustomLabel, 'id' | 'criado_em' | 'atualizado_em'>): Promise<string> {
    console.log('Criando etiqueta customizada:', labelData);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Erro ao obter usuário:', userError);
      throw userError;
    }
    if (!user) {
      console.error('Usuário não autenticado');
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('etiquetas_custom')
      .insert({
        ...labelData,
        criado_por: user.id
      })
      .select('id')
      .single();

    if (error) {
      console.error('Erro ao criar etiqueta customizada:', error);
      throw error;
    }
    console.log('Etiqueta customizada criada com sucesso:', data);
    return data.id;
  }

  // Atualizar uma etiqueta customizada
  static async updateCustomLabel(id: string, labelData: Partial<Omit<CustomLabel, 'id' | 'criado_em' | 'atualizado_em' | 'criado_por'>>): Promise<void> {
    console.log('Atualizando etiqueta customizada:', { id, labelData });
    const { error } = await supabase
      .from('etiquetas_custom')
      .update(labelData)
      .eq('id', id);

    if (error) {
      console.error('Erro ao atualizar etiqueta customizada:', error);
      throw error;
    }
    console.log('Etiqueta customizada atualizada com sucesso');
  }

  // Excluir uma etiqueta customizada
  static async deleteCustomLabel(id: string): Promise<void> {
    console.log('Excluindo etiqueta customizada:', id);
    const { error } = await supabase
      .from('etiquetas_custom')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir etiqueta customizada:', error);
      throw error;
    }
    console.log('Etiqueta customizada excluída com sucesso');
  }
}
