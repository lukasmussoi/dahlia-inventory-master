
import type { ModeloEtiqueta, EtiquetaCustomDB, CampoEtiqueta } from "@/types/etiqueta";
import type { Json } from "@/integrations/supabase/types";

/**
 * Transforma um objeto ModeloEtiqueta em um formato adequado para o banco de dados
 */
export function mapModelToDatabase(modelo: ModeloEtiqueta): Omit<EtiquetaCustomDB, 'id' | 'criado_por' | 'criado_em' | 'atualizado_em'> {
  return {
    descricao: modelo.descricao || '',
    tipo: 'custom',
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
    // Garantir que todos os campos tenham as propriedades obrigatórias
    campos: modelo.campos.map(campo => ({
      tipo: campo.tipo,
      x: campo.x,
      y: campo.y,
      largura: campo.largura,
      altura: campo.altura,
      tamanhoFonte: campo.tamanhoFonte,
      align: campo.align || 'left',
      valor: campo.valor
    })) as unknown as Json,
    margem_interna_superior: modelo.margemInternaEtiquetaSuperior,
    margem_interna_inferior: modelo.margemInternaEtiquetaInferior,
    margem_interna_esquerda: modelo.margemInternaEtiquetaEsquerda,
    margem_interna_direita: modelo.margemInternaEtiquetaDireita
  };
}

/**
 * Transforma um objeto do banco de dados em um ModeloEtiqueta
 */
export function mapDatabaseToModel(item: EtiquetaCustomDB): ModeloEtiqueta {
  // Garantir que campos seja um array, mesmo que venha como null do banco
  const camposFromDB = item.campos ? 
    (Array.isArray(item.campos) ? item.campos : []) : 
    [];

  // Garantir que todos os campos tenham as propriedades obrigatórias
  const camposValidados = camposFromDB.map((campo: any) => ({
    tipo: campo.tipo || 'nome', // Valor padrão para garantir que o tipo seja definido
    x: campo.x || 0,
    y: campo.y || 0,
    largura: campo.largura || 100,
    altura: campo.altura || 20,
    tamanhoFonte: campo.tamanhoFonte || 12,
    align: campo.align || 'left',
    valor: campo.valor
  })) as CampoEtiqueta[];

  return {
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
    campos: camposValidados,
    usuario_id: item.criado_por,
    criado_em: item.criado_em,
    atualizado_em: item.atualizado_em,
    margemInternaEtiquetaSuperior: item.margem_interna_superior,
    margemInternaEtiquetaInferior: item.margem_interna_inferior,
    margemInternaEtiquetaEsquerda: item.margem_interna_esquerda,
    margemInternaEtiquetaDireita: item.margem_interna_direita
  };
}
