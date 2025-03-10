
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CampoEtiqueta {
  tipo: string;
  x: number;
  y: number;
  largura: number;
  altura: number;
  valor: string;
  rotulo?: string;
  fonte?: string;
  tamanhoFonte?: number;
  negrito?: boolean;
  italico?: boolean;
  mostrarCodigo?: boolean;
  moeda?: string;
}

export interface ModeloEtiqueta {
  id?: string;
  nome: string;
  descricao?: string;
  largura: number;
  altura: number;
  margemSuperior: number;
  margemInferior: number;
  margemEsquerda: number;
  margemDireita: number;
  espacamentoHorizontal: number;
  espacamentoVertical: number;
  formatoPagina: string;
  orientacao: string;
  larguraPagina?: number;
  alturaPagina?: number;
  campos: CampoEtiqueta[];
  usuario_id?: string;
  criado_em?: string;
  atualizado_em?: string;
}

export class EtiquetaCustomModel {
  // Buscar todos os modelos de etiquetas
  static async getAll(): Promise<ModeloEtiqueta[]> {
    try {
      const { data, error } = await supabase
        .from('etiquetas_custom')
        .select('*')
        .order('criado_em', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar modelos de etiquetas:', error);
      toast.error('Erro ao carregar modelos de etiquetas');
      return [];
    }
  }

  // Buscar um modelo específico
  static async getById(id: string): Promise<ModeloEtiqueta | null> {
    try {
      const { data, error } = await supabase
        .from('etiquetas_custom')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar modelo de etiqueta:', error);
      toast.error('Erro ao carregar modelo de etiqueta');
      return null;
    }
  }

  // Criar novo modelo de etiqueta
  static async create(modelo: ModeloEtiqueta): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('etiquetas_custom')
        .insert([{
          descricao: modelo.descricao || '',
          tipo: 'padrao',
          largura: modelo.largura,
          altura: modelo.altura,
          formato_pagina: modelo.formatoPagina,
          orientacao: modelo.orientacao,
          margem_superior: modelo.margemSuperior,
          margem_inferior: modelo.margemInferior,
          margem_esquerda: modelo.margemEsquerda,
          margem_direita: modelo.margemDireita,
          espacamento_horizontal: modelo.espacamentoHorizontal,
          espacamento_vertical: modelo.espacamentoVertical,
          largura_pagina: modelo.larguraPagina,
          altura_pagina: modelo.alturaPagina,
          campos: modelo.campos,
          criado_por: (await supabase.auth.getUser()).data.user?.id
        }])
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

  // Atualizar modelo de etiqueta
  static async update(id: string, modelo: ModeloEtiqueta): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('etiquetas_custom')
        .update({
          descricao: modelo.descricao,
          largura: modelo.largura,
          altura: modelo.altura,
          formato_pagina: modelo.formatoPagina,
          orientacao: modelo.orientacao,
          margem_superior: modelo.margemSuperior,
          margem_inferior: modelo.margemInferior,
          margem_esquerda: modelo.margemEsquerda,
          margem_direita: modelo.margemDireita,
          espacamento_horizontal: modelo.espacamentoHorizontal,
          espacamento_vertical: modelo.espacamentoVertical,
          largura_pagina: modelo.larguraPagina,
          altura_pagina: modelo.alturaPagina,
          campos: modelo.campos
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao atualizar modelo de etiqueta:', error);
      toast.error('Erro ao atualizar modelo de etiqueta');
      return false;
    }
  }

  // Excluir modelo de etiqueta
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
