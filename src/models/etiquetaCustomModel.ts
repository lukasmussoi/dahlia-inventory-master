
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
      
      const modeloMapeado = mapDatabaseToModel(data);
      console.log(`Modelo ${id} carregado do banco:`, JSON.stringify(data, null, 2));
      console.log(`Modelo ${id} mapeado para o frontend:`, JSON.stringify(modeloMapeado, null, 2));
      
      return modeloMapeado;
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

      console.log("Criando modelo de etiqueta:", JSON.stringify(modelo, null, 2));

      // Garantir que todos os campos obrigatórios estejam presentes
      const modeloDb = mapModelToDatabase(modelo);
      const modeloCompleto = {
        ...modeloDb,
        criado_por: user.data.user.id,
        altura: Number(modelo.altura) || 30,  // Valor padrão caso não esteja definido
        largura: Number(modelo.largura) || 80, // Valor padrão caso não esteja definido
        descricao: modelo.nome || modelo.descricao || "Modelo sem nome",
        tipo: "custom" // Garantir que o tipo seja definido
      };

      console.log("Dados preparados para o banco:", JSON.stringify(modeloCompleto, null, 2));

      const { data, error } = await supabase
        .from('etiquetas_custom')
        .insert(modeloCompleto)
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
      // Obter dados atuais do modelo para comparação
      console.log(`Buscando dados atuais do modelo ${id} antes da atualização...`);
      const { data: modeloAtual, error: errorBusca } = await supabase
        .from('etiquetas_custom')
        .select('*')
        .eq('id', id)
        .single();
        
      if (errorBusca) {
        console.error('Erro ao buscar modelo atual:', errorBusca);
        throw new Error(`Erro ao buscar modelo atual: ${errorBusca.message}`);
      } else {
        console.log('Modelo atual recuperado com sucesso:', JSON.stringify(modeloAtual, null, 2));
      }
      
      // Preparar modelo para atualização, garantindo campos obrigatórios
      const modeloDbBase = mapModelToDatabase(modelo);
      
      // Garantir que NÃO enviemos campos que possam conflitar com triggers do banco
      const camposParaExcluir = [
        'atualizado_em', 
        'updated_at', 
        'criado_em', 
        'created_at', 
        'criado_por'
      ];
      
      const modeloDb: any = { ...modeloDbBase };
      
      camposParaExcluir.forEach(campo => {
        if (modeloDb[campo] !== undefined) {
          delete modeloDb[campo];
          console.log(`Campo removido antes da atualização: ${campo}`);
        }
      });
      
      // Garantir que campos obrigatórios estejam presentes
      modeloDb.altura = Number(modelo.altura) || 30;
      modeloDb.largura = Number(modelo.largura) || 80;
      modeloDb.descricao = modelo.nome || modelo.descricao || "Modelo sem nome";
      modeloDb.tipo = "custom";
      
      console.log("Preparando dados para atualização do modelo:", id);
      console.log("Dados formatados para envio:", JSON.stringify(modeloDb, null, 2));

      // Executar a atualização com tratamento de erro detalhado
      const { data, error } = await supabase
        .from('etiquetas_custom')
        .update(modeloDb)
        .eq('id', id)
        .select();

      if (error) {
        console.error('Erro detalhado do Supabase ao atualizar modelo:', {
          código: error.code,
          mensagem: error.message,
          detalhes: error.details,
          dica: error.hint
        });
        throw error;
      }
      
      console.log("Modelo atualizado com sucesso:", JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error('Erro ao atualizar modelo de etiqueta:', error);
      
      if (error instanceof Error) {
        // Mensagem de erro mais detalhada para o usuário
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
