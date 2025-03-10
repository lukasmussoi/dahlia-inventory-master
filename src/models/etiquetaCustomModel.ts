
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ModeloEtiqueta, EtiquetaCustomDB, CampoEtiqueta } from "@/types/etiqueta";
import { mapDatabaseToModel, mapModelToDatabase } from "@/utils/etiquetaMappers";

// Reexportamos os tipos para que possam ser importados deste arquivo
export type { ModeloEtiqueta, CampoEtiqueta };

export class EtiquetaCustomModel {
  static async getAll(): Promise<ModeloEtiqueta[]> {
    try {
      console.log("Buscando todos os modelos de etiquetas");
      const { data, error } = await supabase
        .from('etiquetas_custom')
        .select('*')
        .order('criado_em', { ascending: false });

      if (error) {
        console.error("Erro ao buscar modelos:", error);
        throw error;
      }

      console.log("Modelos carregados:", data);
      return data.map(item => mapDatabaseToModel(item));
    } catch (error) {
      console.error('Erro ao buscar modelos de etiquetas:', error);
      toast.error('Erro ao carregar modelos de etiquetas');
      return [];
    }
  }

  static async getById(id: string): Promise<ModeloEtiqueta | null> {
    try {
      console.log("Buscando modelo com ID:", id);
      const { data, error } = await supabase
        .from('etiquetas_custom')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error("Erro ao buscar modelo por ID:", error);
        throw error;
      }
      
      console.log("Modelo encontrado:", data);
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

      console.log("Criando modelo de etiqueta:", modelo);

      const modeloDb = {
        ...mapModelToDatabase(modelo),
        criado_por: user.data.user.id
      };

      console.log("Modelo convertido para formato do banco:", modeloDb);

      const { data, error } = await supabase
        .from('etiquetas_custom')
        .insert(modeloDb)
        .select('id')
        .single();

      if (error) {
        console.error("Erro ao inserir modelo no banco:", error);
        throw error;
      }
      
      console.log("Modelo criado com sucesso, ID:", data?.id);
      return data?.id || null;
    } catch (error) {
      console.error('Erro ao criar modelo de etiqueta:', error);
      toast.error('Erro ao salvar modelo de etiqueta');
      return null;
    }
  }

  static async update(id: string, modelo: ModeloEtiqueta): Promise<boolean> {
    try {
      console.log("Atualizando modelo ID:", id);
      console.log("Dados do modelo:", modelo);
      
      const modeloDb = mapModelToDatabase(modelo);
      console.log("Modelo convertido para formato do banco:", modeloDb);

      const { error } = await supabase
        .from('etiquetas_custom')
        .update(modeloDb)
        .eq('id', id);

      if (error) {
        console.error("Erro ao atualizar modelo no banco:", error);
        throw error;
      }
      
      console.log("Modelo atualizado com sucesso");
      return true;
    } catch (error) {
      console.error('Erro ao atualizar modelo de etiqueta:', error);
      toast.error('Erro ao atualizar modelo de etiqueta');
      return false;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      console.log("Excluindo modelo ID:", id);
      
      const { error } = await supabase
        .from('etiquetas_custom')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Erro ao excluir modelo do banco:", error);
        throw error;
      }
      
      console.log("Modelo excluído com sucesso");
      return true;
    } catch (error) {
      console.error('Erro ao excluir modelo de etiqueta:', error);
      toast.error('Erro ao excluir modelo de etiqueta');
      return false;
    }
  }
}
