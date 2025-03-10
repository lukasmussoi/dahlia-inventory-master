
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ModeloEtiqueta, CampoEtiqueta } from "@/types/etiqueta";

export class EtiquetaCustomModel {
  static async getAll(): Promise<ModeloEtiqueta[]> {
    try {
      const { data, error } = await supabase
        .from('etiquetas_custom')
        .select('*')
        .order('criado_em', { ascending: false });

      if (error) throw error;

      return data.map(item => ({
        id: item.id,
        nome: item.descricao,
        descricao: item.descricao,
        largura: item.largura,
        altura: item.altura,
        formatoPagina: item.formato_pagina,
        orientacao: item.orientacao,
        margemSuperior: item.margem_superior,
        margemInferior: item.margem_inferior,
        margemEsquerda: item.margem_esquerda,
        margemDireita: item.margem_direita,
        espacamentoHorizontal: item.espacamento_horizontal,
        espacamentoVertical: item.espacamento_vertical,
        larguraPagina: item.largura_pagina,
        alturaPagina: item.altura_pagina,
        campos: item.campos as CampoEtiqueta[],
        usuario_id: item.criado_por,
        criado_em: item.criado_em,
        atualizado_em: item.atualizado_em
      }));
    } catch (error) {
      console.error('Erro ao buscar modelos de etiquetas:', error);
      toast.error('Erro ao carregar modelos de etiquetas');
      return [];
    }
  }

  static async create(modelo: ModeloEtiqueta): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('etiquetas_custom')
        .insert({
          descricao: modelo.nome,
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
          campos: modelo.campos as unknown as Json,
          criado_por: (await supabase.auth.getUser()).data.user?.id
        })
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
      const { error } = await supabase
        .from('etiquetas_custom')
        .update({
          descricao: modelo.nome,
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
          campos: modelo.campos as unknown as Json
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
}
