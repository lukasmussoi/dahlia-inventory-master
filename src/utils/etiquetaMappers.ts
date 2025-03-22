
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
    // Usando uma asserção de tipo para resolver o problema de tipagem
    campos: modelo.campos as unknown as Json,
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
    // Usar asserção de tipo para resolver problemas de compatibilidade
    campos: camposFromDB as unknown as CampoEtiqueta[],
    usuario_id: item.criado_por,
    criado_em: item.criado_em,
    atualizado_em: item.atualizado_em,
    margemInternaEtiquetaSuperior: item.margem_interna_superior,
    margemInternaEtiquetaInferior: item.margem_interna_inferior,
    margemInternaEtiquetaEsquerda: item.margem_interna_esquerda,
    margemInternaEtiquetaDireita: item.margem_interna_direita
  };
}
