
import type { ModeloEtiqueta, EtiquetaCustomDB, CampoEtiqueta } from "@/types/etiqueta";
import type { Json } from "@/integrations/supabase/types";

/**
 * Converte um registro do banco de dados para o formato usado no frontend
 */
export function mapDatabaseToModel(item: EtiquetaCustomDB): ModeloEtiqueta {
  let campos: CampoEtiqueta[] = [];
  
  console.log("Mapeando item do banco para modelo:", item);
  
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
        { tipo: 'nome' as const, x: 2, y: 4, largura: 40, altura: 10, tamanhoFonte: 7 },
        { tipo: 'codigo' as const, x: 20, y: 1, largura: 40, altura: 6, tamanhoFonte: 8 },
        { tipo: 'preco' as const, x: 70, y: 4, largura: 20, altura: 10, tamanhoFonte: 10 }
      ];
    }
  }

  // Se não houver campos, usar os valores padrão
  if (campos.length === 0) {
    campos = [
      { tipo: 'nome' as const, x: 2, y: 4, largura: 40, altura: 10, tamanhoFonte: 7 },
      { tipo: 'codigo' as const, x: 20, y: 1, largura: 40, altura: 6, tamanhoFonte: 8 },
      { tipo: 'preco' as const, x: 70, y: 4, largura: 20, altura: 10, tamanhoFonte: 10 }
    ];
  }

  // Garantir que cada campo tenha todos os atributos necessários
  campos = campos.map(campo => ({
    tipo: campo.tipo as 'nome' | 'codigo' | 'preco',
    x: Number(campo.x) || 0,
    y: Number(campo.y) || 0,
    largura: Number(campo.largura) || 10,
    altura: Number(campo.altura) || 10,
    tamanhoFonte: Number(campo.tamanhoFonte) || 10,
    valor: campo.valor
  }));

  console.log("Campos mapeados:", campos);

  // Garantir que a orientação seja um valor válido
  const orientacao: 'retrato' | 'paisagem' = 
    item.orientacao === 'retrato' || item.orientacao === 'paisagem' 
      ? item.orientacao 
      : 'retrato';

  return {
    id: item.id,
    nome: item.descricao,
    descricao: item.descricao,
    largura: Number(item.largura) || 80,
    altura: Number(item.altura) || 40,
    formatoPagina: item.formato_pagina || "A4",
    orientacao: orientacao,
    margemSuperior: Number(item.margem_superior) || 10,
    margemInferior: Number(item.margem_inferior) || 10,
    margemEsquerda: Number(item.margem_esquerda) || 10,
    margemDireita: Number(item.margem_direita) || 10,
    espacamentoHorizontal: Number(item.espacamento_horizontal) || 0,
    espacamentoVertical: Number(item.espacamento_vertical) || 0,
    larguraPagina: Number(item.largura_pagina) || undefined,
    alturaPagina: Number(item.altura_pagina) || undefined,
    campos: campos,
    usuario_id: item.criado_por,
    criado_em: item.criado_em,
    atualizado_em: item.atualizado_em
  };
}

/**
 * Prepara um modelo para inclusão no banco de dados
 */
export function mapModelToDatabase(modelo: ModeloEtiqueta): Omit<EtiquetaCustomDB, 'id' | 'criado_por' | 'criado_em' | 'atualizado_em'> {
  console.log("Mapeando modelo para banco de dados:", modelo);
  
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

  console.log("Campos validados para salvar:", camposValidados);

  // Garantir que a orientação seja válida
  const orientacao: 'retrato' | 'paisagem' = 
    modelo.orientacao === 'retrato' || modelo.orientacao === 'paisagem' 
      ? modelo.orientacao 
      : 'retrato';

  return {
    descricao: modelo.nome,
    tipo: 'padrao',
    largura: Number(modelo.largura) || 80,
    altura: Number(modelo.altura) || 40,
    formato_pagina: modelo.formatoPagina || "A4",
    orientacao: orientacao,
    margem_superior: Number(modelo.margemSuperior) || 10,
    margem_inferior: Number(modelo.margemInferior) || 10,
    margem_esquerda: Number(modelo.margemEsquerda) || 10,
    margem_direita: Number(modelo.margemDireita) || 10,
    espacamento_horizontal: Number(modelo.espacamentoHorizontal) || 0,
    espacamento_vertical: Number(modelo.espacamentoVertical) || 0,
    largura_pagina: modelo.larguraPagina ? Number(modelo.larguraPagina) : null,
    altura_pagina: modelo.alturaPagina ? Number(modelo.alturaPagina) : null,
    campos: camposValidados as unknown as Json
  };
}
