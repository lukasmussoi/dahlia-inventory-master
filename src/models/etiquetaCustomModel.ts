
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ModeloEtiqueta, EtiquetaCustomDB, CampoEtiqueta } from "@/types/etiqueta";
import { mapDatabaseToModel, mapModelToDatabase } from "@/utils/etiquetaMappers";

// Reexportamos os tipos para que possam ser importados deste arquivo
export type { ModeloEtiqueta, CampoEtiqueta };

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
        console.error('Erro: Usuário não autenticado');
        toast.error('Erro ao salvar: usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }

      console.log("Criando modelo de etiqueta:", modelo);

      const modeloDb = {
        ...mapModelToDatabase(modelo),
        criado_por: user.data.user.id
      };

      console.log("Dados preparados para o banco:", modeloDb);

      const { data, error } = await supabase
        .from('etiquetas_custom')
        .insert(modeloDb)
        .select('id')
        .single();

      if (error) {
        console.error('Erro do Supabase ao criar modelo:', error);
        throw error;
      }
      
      console.log("Modelo criado com sucesso:", data);
      return data?.id || null;
    } catch (error) {
      console.error('Erro ao criar modelo de etiqueta:', error);
      
      if (error instanceof Error) {
        toast.error(`Erro ao salvar modelo: ${error.message}`);
      } else {
        toast.error('Erro ao salvar modelo de etiqueta');
      }
      
      return null;
    }
  }

  static async update(id: string, modelo: ModeloEtiqueta): Promise<boolean> {
    try {
      const modeloDb = mapModelToDatabase(modelo);
      
      // Remover campos que podem causar conflitos com triggers do banco
      delete (modeloDb as any).atualizado_em;
      delete (modeloDb as any).updated_at;
      
      console.log("Atualizando modelo:", id, modeloDb);

      const { error } = await supabase
        .from('etiquetas_custom')
        .update(modeloDb)
        .eq('id', id);

      if (error) {
        console.error('Erro do Supabase ao atualizar modelo:', error);
        throw error;
      }
      
      console.log("Modelo atualizado com sucesso");
      return true;
    } catch (error) {
      console.error('Erro ao atualizar modelo de etiqueta:', error);
      
      if (error instanceof Error) {
        toast.error(`Erro ao atualizar modelo: ${error.message}`);
      } else {
        toast.error('Erro ao atualizar modelo de etiqueta');
      }
      
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
