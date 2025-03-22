
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

      // Mapear o modelo para o formato do banco
      const modeloDb = mapModelToDatabase(modelo);
      
      // Garantir que todos os campos obrigatórios estejam presentes
      const modeloCompleto = {
        altura: Number(modelo.altura) || 30,
        largura: Number(modelo.largura) || 80,
        descricao: modelo.nome || modelo.descricao || "Modelo sem nome",
        tipo: "custom",
        formato_pagina: modelo.formatoPagina || "A4",
        orientacao: modelo.orientacao || "retrato",
        margem_superior: Number(modelo.margemSuperior) || 10,
        margem_inferior: Number(modelo.margemInferior) || 10,
        margem_esquerda: Number(modelo.margemEsquerda) || 10,
        margem_direita: Number(modelo.margemDireita) || 10,
        espacamento_horizontal: Number(modelo.espacamentoHorizontal) || 0,
        espacamento_vertical: Number(modelo.espacamentoVertical) || 0,
        altura_pagina: modelo.alturaPagina ? Number(modelo.alturaPagina) : null,
        largura_pagina: modelo.larguraPagina ? Number(modelo.larguraPagina) : null,
        campos: modeloDb.campos,
        criado_por: user.data.user.id
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
      
      // Mapear o modelo para o formato do banco
      const modeloDb = mapModelToDatabase(modelo);
      
      // Garantir que todos os campos obrigatórios estejam presentes
      const modeloCompleto = {
        altura: Number(modelo.altura) || 30,
        largura: Number(modelo.largura) || 80,
        descricao: modelo.nome || modelo.descricao || "Modelo sem nome",
        tipo: "custom",
        formato_pagina: modelo.formatoPagina || "A4",
        orientacao: modelo.orientacao || "retrato",
        margem_superior: Number(modelo.margemSuperior) || 10,
        margem_inferior: Number(modelo.margemInferior) || 10,
        margem_esquerda: Number(modelo.margemEsquerda) || 10,
        margem_direita: Number(modelo.margemDireita) || 10,
        espacamento_horizontal: Number(modelo.espacamentoHorizontal) || 0,
        espacamento_vertical: Number(modelo.espacamentoVertical) || 0,
        campos: modeloDb.campos
      };
      
      // Adicionar dimensões da página apenas se for formato personalizado
      if (modelo.formatoPagina === "Custom" || modelo.formatoPagina === "Personalizado") {
        modeloCompleto['altura_pagina'] = Number(modelo.alturaPagina) || 297;
        modeloCompleto['largura_pagina'] = Number(modelo.larguraPagina) || 210;
      }
      
      // Remover campos que não devem ser atualizados
      const camposParaExcluir = [
        'atualizado_em', 
        'updated_at', 
        'criado_em', 
        'created_at', 
        'criado_por'
      ];
      
      camposParaExcluir.forEach(campo => {
        if (modeloCompleto[campo as keyof typeof modeloCompleto] !== undefined) {
          delete modeloCompleto[campo as keyof typeof modeloCompleto];
        }
      });

      console.log("Preparando dados para atualização do modelo:", id);
      console.log("Dados formatados para envio:", JSON.stringify(modeloCompleto, null, 2));

      // Executar a atualização
      const { data, error } = await supabase
        .from('etiquetas_custom')
        .update(modeloCompleto)
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
