
import type { ModeloEtiqueta, EtiquetaCustomDB } from "@/types/etiqueta";

/**
 * Mapeia o modelo da interface para o formato do banco de dados
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
    campos: modelo.campos,
    margem_interna_superior: modelo.margemInternaEtiquetaSuperior,
    margem_interna_inferior: modelo.margemInternaEtiquetaInferior,
    margem_interna_esquerda: modelo.margemInternaEtiquetaEsquerda,
    margem_interna_direita: modelo.margemInternaEtiquetaDireita
  };
}

/**
 * Mapeia os dados do banco para o modelo utilizado na interface
 */
export function mapDatabaseToModel(data: EtiquetaCustomDB): ModeloEtiqueta {
  return {
    id: data.id,
    nome: data.descricao,
    descricao: data.descricao,
    largura: data.largura,
    altura: data.altura,
    formatoPagina: data.formato_pagina,
    orientacao: data.orientacao,
    margemSuperior: data.margem_superior,
    margemInferior: data.margem_inferior,
    margemEsquerda: data.margem_esquerda,
    margemDireita: data.margem_direita,
    espacamentoHorizontal: data.espacamento_horizontal,
    espacamentoVertical: data.espacamento_vertical,
    larguraPagina: data.largura_pagina,
    alturaPagina: data.altura_pagina,
    campos: Array.isArray(data.campos) ? data.campos : [],
    usuario_id: data.criado_por,
    criado_em: data.criado_em,
    atualizado_em: data.atualizado_em,
    margemInternaEtiquetaSuperior: data.margem_interna_superior,
    margemInternaEtiquetaInferior: data.margem_interna_inferior,
    margemInternaEtiquetaEsquerda: data.margem_interna_esquerda,
    margemInternaEtiquetaDireita: data.margem_interna_direita
  };
}
