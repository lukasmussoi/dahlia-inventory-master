
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

      console.log(`${data.length} modelos encontrados`);
      return data.map(item => mapDatabaseToModel(item));
    } catch (error) {
      console.error('Erro ao buscar modelos de etiquetas:', error);
      toast.error('Erro ao carregar modelos de etiquetas');
      return [];
    }
  }

  static async getById(id: string): Promise<ModeloEtiqueta | null> {
    try {
      console.log(`Buscando modelo de etiqueta com ID: ${id}`);
      const { data, error } = await supabase
        .from('etiquetas_custom')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error(`Erro ao buscar modelo ${id}:`, error);
        throw error;
      }
      
      if (!data) {
        console.error(`Modelo ${id} não encontrado`);
        return null;
      }
      
      console.log(`Modelo ${id} encontrado, mapeando para o frontend`);
      const modeloMapeado = mapDatabaseToModel(data);
      
      console.log("Modelo mapeado:", {
        id: modeloMapeado.id,
        nome: modeloMapeado.nome,
        formatoPagina: modeloMapeado.formatoPagina,
        orientacao: modeloMapeado.orientacao,
        margens: `${modeloMapeado.margemSuperior}/${modeloMapeado.margemInferior}/${modeloMapeado.margemEsquerda}/${modeloMapeado.margemDireita}`,
        tamanhoGrade: modeloMapeado.tamanhoGrade,
        posicao: modeloMapeado.x !== undefined && modeloMapeado.y !== undefined 
          ? `(${modeloMapeado.x}, ${modeloMapeado.y})` 
          : 'posição não definida'
      });
      
      return modeloMapeado;
    } catch (error) {
      console.error(`Erro ao buscar modelo de etiqueta ID ${id}:`, error);
      toast.error('Erro ao carregar modelo de etiqueta');
      return null;
    }
  }

  static async create(modelo: ModeloEtiqueta): Promise<string | null> {
    try {
      console.log("Iniciando criação de novo modelo");
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        console.error('Erro: Usuário não autenticado');
        toast.error('Erro ao salvar: usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }

      console.log("Dados do modelo a ser criado:", {
        nome: modelo.nome,
        formatoPagina: modelo.formatoPagina,
        orientacao: modelo.orientacao,
        largura: modelo.largura,
        altura: modelo.altura,
        tamanhoGrade: modelo.tamanhoGrade,
        posicao: modelo.x !== undefined && modelo.y !== undefined 
          ? `(${modelo.x}, ${modelo.y})` 
          : 'posição não definida'
      });

      // Mapear o modelo para o formato do banco
      const modeloDb = mapModelToDatabase(modelo);
      
      // Garantir que todos os campos obrigatórios estejam presentes
      const modeloCompleto = {
        altura: Number(modelo.altura) || 30,
        largura: Number(modelo.largura) || 80,
        descricao: modelo.nome || modelo.descricao || "Modelo sem nome",
        tipo: "custom",
        formato_pagina: modeloDb.formato_pagina || "A4",
        orientacao: modeloDb.orientacao || "retrato",
        margem_superior: Number(modelo.margemSuperior) || 10,
        margem_inferior: Number(modelo.margemInferior) || 10,
        margem_esquerda: Number(modelo.margemEsquerda) || 10,
        margem_direita: Number(modelo.margemDireita) || 10,
        espacamento_horizontal: Number(modelo.espacamentoHorizontal) || 0,
        espacamento_vertical: Number(modelo.espacamentoVertical) || 0,
        altura_pagina: modelo.alturaPagina ? Number(modelo.alturaPagina) : 297,
        largura_pagina: modelo.larguraPagina ? Number(modelo.larguraPagina) : 210,
        campos: modeloDb.campos,
        criado_por: user.data.user.id,
        // Adicionar posições
        x: modelo.x,
        y: modelo.y
      };

      console.log("Modelo completo para inserção no banco:", {
        descricao: modeloCompleto.descricao,
        formato_pagina: modeloCompleto.formato_pagina,
        orientacao: modeloCompleto.orientacao,
        campos_count: modeloCompleto.campos ? (modeloCompleto.campos as any).length : 'N/A',
        posicao: `(${modeloCompleto.x}, ${modeloCompleto.y})`
      });

      const { data, error } = await supabase
        .from('etiquetas_custom')
        .insert(modeloCompleto)
        .select('id')
        .single();

      if (error) {
        console.error('Erro do Supabase ao criar modelo:', error);
        throw error;
      }
      
      console.log(`Modelo criado com sucesso, ID: ${data?.id}`);
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
      console.log(`Iniciando atualização do modelo ${id}`);
      
      // Verificar se o ID está definido no modelo
      if (!id) {
        console.error("ID não fornecido para atualização");
        throw new Error("ID do modelo não fornecido");
      }
      
      // Obter dados atuais do modelo para verificação
      console.log(`Buscando dados atuais do modelo ${id} antes da atualização...`);
      const { data: modeloAtual, error: errorBusca } = await supabase
        .from('etiquetas_custom')
        .select('*')
        .eq('id', id)
        .single();
        
      if (errorBusca) {
        console.error('Erro ao buscar modelo atual:', errorBusca);
        throw new Error(`Erro ao buscar modelo atual: ${errorBusca.message}`);
      } else if (!modeloAtual) {
        console.error(`Modelo ${id} não encontrado para atualização`);
        throw new Error(`Modelo não encontrado para atualização`);
      } else {
        console.log('Modelo atual recuperado:', {
          id: modeloAtual.id,
          descricao: modeloAtual.descricao,
          formato_pagina: modeloAtual.formato_pagina,
          orientacao: modeloAtual.orientacao,
          posicao: modeloAtual.x !== undefined && modeloAtual.y !== undefined 
            ? `(${modeloAtual.x}, ${modeloAtual.y})` 
            : 'posição não definida'
        });
      }
      
      // Mapear o modelo para o formato do banco
      const modeloDb = mapModelToDatabase(modelo);
      
      // Remover a propriedade tamanho_grade do objeto modeloDb, já que ela não existe no banco
      if ('tamanho_grade' in modeloDb) {
        delete modeloDb.tamanho_grade;
      }
      
      // Dados para atualização
      console.log("Dados do modelo a serem atualizados:", {
        nome: modelo.nome,
        formatoPagina: modelo.formatoPagina, 
        orientacao: modelo.orientacao,
        largura: modelo.largura,
        altura: modelo.altura,
        margens: `${modelo.margemSuperior}/${modelo.margemInferior}/${modelo.margemEsquerda}/${modelo.margemDireita}`,
        campos_count: modelo.campos ? modelo.campos.length : 'N/A',
        posicao: modelo.x !== undefined && modelo.y !== undefined 
          ? `(${modelo.x}, ${modelo.y})` 
          : 'posição não definida'
      });
      
      // Dados mapeados para o banco
      console.log("Dados mapeados para o banco:", {
        descricao: modeloDb.descricao,
        formato_pagina: modeloDb.formato_pagina,
        orientacao: modeloDb.orientacao,
        campos_count: modeloDb.campos ? (modeloDb.campos as any).length : 'N/A',
        posicao: modeloDb.x !== undefined && modeloDb.y !== undefined 
          ? `(${modeloDb.x}, ${modeloDb.y})` 
          : 'posição não definida'
      });
      
      // Remover o id do objeto modeloDb para evitar erro na atualização
      if ('id' in modeloDb) {
        delete modeloDb.id;
      }
      
      // Executar a atualização
      const { data, error } = await supabase
        .from('etiquetas_custom')
        .update(modeloDb)
        .eq('id', id)
        .select();

      if (error) {
        console.error('Erro ao atualizar modelo:', error);
        throw error;
      }
      
      console.log(`Modelo ${id} atualizado com sucesso:`, data);
      return true;
    } catch (error) {
      console.error(`Erro ao atualizar modelo ${id}:`, error);
      
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
      console.log(`Excluindo modelo ${id}`);
      const { error } = await supabase
        .from('etiquetas_custom')
        .delete()
        .eq('id', id);

      if (error) {
        console.error(`Erro ao excluir modelo ${id}:`, error);
        throw error;
      }
      
      console.log(`Modelo ${id} excluído com sucesso`);
      return true;
    } catch (error) {
      console.error('Erro ao excluir modelo de etiqueta:', error);
      toast.error('Erro ao excluir modelo de etiqueta');
      return false;
    }
  }
}
