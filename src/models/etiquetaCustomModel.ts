
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ModeloEtiqueta } from "@/types/etiqueta";
import { mapDatabaseToModel, mapModelToDatabase } from "@/utils/etiquetaMappers";

export class EtiquetaCustomModel {
  static async getAll(): Promise<ModeloEtiqueta[]> {
    try {
      const { data, error } = await supabase
        .from('etiquetas_custom')
        .select('*')
        .order('criado_em', { ascending: false });

      if (error) throw error;

      return data.map(item => mapDatabaseToModel(item));
    } catch (error) {
      console.error('Erro ao buscar modelos de etiquetas:', error);
      toast.error('Erro ao carregar modelos de etiquetas');
      return [];
    }
  }

  static async getById(id: string): Promise<ModeloEtiqueta | null> {
    try {
      const { data, error } = await supabase
        .from('etiquetas_custom')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      return mapDatabaseToModel(data);
    } catch (error) {
      console.error(`Erro ao buscar modelo de etiqueta ID ${id}:`, error);
      toast.error('Erro ao carregar modelo de etiqueta');
      return null;
    }
  }

  static async create(modelo: ModeloEtiqueta): Promise<string | null> {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        throw new Error('Usuário não autenticado');
      }

      const modeloDb = {
        ...mapModelToDatabase(modelo),
        criado_por: user.data.user.id
      };

      const { data, error } = await supabase
        .from('etiquetas_custom')
        .insert(modeloDb)
        .select('id')
        .single();

      if (error) throw error;
      return data?.id || null;
    } catch (error) {
      console.error('Erro ao criar modelo de etiqueta:', error);
      toast.error('Erro ao salvar modelo de etiqueta');
      return null;
    }
  }

  static async update(id: string, modelo: ModeloEtiqueta): Promise<boolean> {
    try {
      const modeloDb = mapModelToDatabase(modelo);

      const { error } = await supabase
        .from('etiquetas_custom')
        .update(modeloDb)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao atualizar modelo de etiqueta:', error);
      toast.error('Erro ao atualizar modelo de etiqueta');
      return false;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('etiquetas_custom')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao excluir modelo de etiqueta:', error);
      toast.error('Erro ao excluir modelo de etiqueta');
      return false;
    }
  }
}
