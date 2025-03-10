
import type { ModeloEtiqueta, EtiquetaCustomDB, CampoEtiqueta } from "@/types/etiqueta";
import type { Json } from "@/integrations/supabase/types";

/**
 * Converte um registro do banco de dados para o formato usado no frontend
 */
export function mapDatabaseToModel(item: EtiquetaCustomDB): ModeloEtiqueta {
  let campos: CampoEtiqueta[] = [];
  
  // Certifica que campos seja tratado como um array de CampoEtiqueta
  if (item.campos) {
    try {
      if (typeof item.campos === 'string') {
        campos = JSON.parse(item.campos as string);
      } else {
        const camposArray = Array.isArray(item.campos) 
          ? item.campos 
          : Array.isArray((item.campos as any).data) 
            ? (item.campos as any).data 
            : [];
            
        campos = camposArray.map((campo: any) => ({
          tipo: campo.tipo || 'nome',
          x: Number(campo.x || 0),
          y: Number(campo.y || 0),
          largura: Number(campo.largura || 10),
          altura: Number(campo.altura || 10),
          tamanhoFonte: Number(campo.tamanhoFonte || 10),
          valor: campo.valor
        }));
      }
    } catch (error) {
      console.error('Erro ao converter campos da etiqueta:', error);
      // Configurar valores padrão para os campos
      campos = [
        { tipo: 'nome', x: 2, y: 4, largura: 40, altura: 10, tamanhoFonte: 7 },
        { tipo: 'codigo', x: 20, y: 1, largura: 40, altura: 6, tamanhoFonte: 8 },
        { tipo: 'preco', x: 70, y: 4, largura: 20, altura: 10, tamanhoFonte: 10 }
      ];
    }
  }

  // Se não houver campos, usar os valores padrão
  if (campos.length === 0) {
    campos = [
      { tipo: 'nome', x: 2, y: 4, largura: 40, altura: 10, tamanhoFonte: 7 },
      { tipo: 'codigo', x: 20, y: 1, largura: 40, altura: 6, tamanhoFonte: 8 },
      { tipo: 'preco', x: 70, y: 4, largura: 20, altura: 10, tamanhoFonte: 10 }
    ];
  }

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
    campos: campos,
    usuario_id: item.criado_por,
    criado_em: item.criado_em,
    atualizado_em: item.atualizado_em
  };
}

/**
 * Prepara um modelo para inclusão no banco de dados
 */
export function mapModelToDatabase(modelo: ModeloEtiqueta) {
  // Garante que todos os campos tenham os valores obrigatórios
  const camposValidados = modelo.campos.map(campo => ({
    tipo: campo.tipo || 'nome',
    x: Number(campo.x || 0),
    y: Number(campo.y || 0),
    largura: Number(campo.largura || 10),
    altura: Number(campo.altura || 10),
    tamanhoFonte: Number(campo.tamanhoFonte || 10),
    valor: campo.valor
  }));

  return {
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
    campos: camposValidados as unknown as Json
  };
}
