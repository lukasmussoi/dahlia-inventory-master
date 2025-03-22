
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
          valor: campo.valor,
          alinhamento: campo.alinhamento || 'left'
        }));
      }
    } catch (error) {
      console.error('Erro ao converter campos da etiqueta:', error);
      // Configurar valores padrão para os campos
      campos = [
        { tipo: 'nome' as const, x: 2, y: 4, largura: 40, altura: 10, tamanhoFonte: 7, alinhamento: 'left' },
        { tipo: 'codigo' as const, x: 20, y: 1, largura: 40, altura: 6, tamanhoFonte: 8, alinhamento: 'left' },
        { tipo: 'preco' as const, x: 70, y: 4, largura: 20, altura: 10, tamanhoFonte: 10, alinhamento: 'left' }
      ];
    }
  }

  // Se não houver campos, usar os valores padrão
  if (campos.length === 0) {
    campos = [
      { tipo: 'nome' as const, x: 2, y: 4, largura: 40, altura: 10, tamanhoFonte: 7, alinhamento: 'left' },
      { tipo: 'codigo' as const, x: 20, y: 1, largura: 40, altura: 6, tamanhoFonte: 8, alinhamento: 'left' },
      { tipo: 'preco' as const, x: 70, y: 4, largura: 20, altura: 10, tamanhoFonte: 10, alinhamento: 'left' }
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
    valor: campo.valor,
    alinhamento: campo.alinhamento || 'left'
  }));

  console.log("Campos mapeados:", campos);

  // Para formato de página, verificar se é "Custom" e converter para "Personalizado" no front
  let formatoPagina = item.formato_pagina || "A4";
  if (formatoPagina === "Custom") {
    formatoPagina = "Personalizado";
  }

  // Registro completo da conversão do banco para o modelo
  console.log(`Valores mapeados do BD para o frontend:
    - formato_pagina: "${item.formato_pagina}" -> formatoPagina: "${formatoPagina}"
    - orientacao: "${item.orientacao}"
    - margens: superior=${item.margem_superior}, inferior=${item.margem_inferior}, esquerda=${item.margem_esquerda}, direita=${item.margem_direita}
    - espacamento: horizontal=${item.espacamento_horizontal}, vertical=${item.espacamento_vertical}
    - dimensões da página: ${item.largura_pagina}x${item.altura_pagina}
  `);

  return {
    id: item.id,
    nome: item.descricao,
    descricao: item.descricao,
    largura: Number(item.largura) || 80,
    altura: Number(item.altura) || 40,
    formatoPagina: formatoPagina,
    orientacao: item.orientacao || "retrato",
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
export function mapModelToDatabase(modelo: ModeloEtiqueta) {
  console.log("Mapeando modelo para banco de dados:", modelo);
  
  // Garante que todos os campos tenham os valores obrigatórios
  const camposValidados = modelo.campos.map(campo => {
    // Verificar se x e y são NaN ou undefined e normalizá-los
    const x = isNaN(Number(campo.x)) ? 0 : Number(campo.x);
    const y = isNaN(Number(campo.y)) ? 0 : Number(campo.y);
    
    return {
      tipo: campo.tipo || 'nome',
      x: x,
      y: y,
      largura: Number(campo.largura || 10),
      altura: Number(campo.altura || 10),
      tamanhoFonte: Number(campo.tamanhoFonte || 10),
      valor: campo.valor,
      alinhamento: campo.alinhamento || 'left'
    };
  });

  console.log("Campos validados para salvar:", camposValidados);

  // Garantir que formatoPagina seja enviado corretamente (converter "Personalizado" para "Custom" no BD)
  let formatoPagina = modelo.formatoPagina || "A4";
  if (formatoPagina === "Personalizado") {
    formatoPagina = "Custom";
  }

  // Certifique-se de que as dimensões da página personalizadas sejam salvas corretamente
  const larguraPagina = modelo.formatoPagina === "Personalizado" || modelo.formatoPagina === "Custom" 
    ? Number(modelo.larguraPagina) || 210 
    : null;
  
  const alturaPagina = modelo.formatoPagina === "Personalizado" || modelo.formatoPagina === "Custom" 
    ? Number(modelo.alturaPagina) || 297 
    : null;

  // Logging para depuração
  console.log(`Valores mapeados do frontend para o BD:
    - formatoPagina: "${modelo.formatoPagina}" -> formato_pagina: "${formatoPagina}"
    - orientacao: "${modelo.orientacao}"
    - margens: superior=${modelo.margemSuperior}, inferior=${modelo.margemInferior}, esquerda=${modelo.margemEsquerda}, direita=${modelo.margemDireita}
    - espacamento: horizontal=${modelo.espacamentoHorizontal}, vertical=${modelo.espacamentoVertical}
    - dimensões da página: ${larguraPagina}x${alturaPagina}
  `);

  // Certificando-se de que todos os valores sejam do tipo correto para o banco
  const result = {
    descricao: modelo.nome, // Usamos o nome como descrição no banco (coluna histórica)
    tipo: 'padrao',
    largura: Number(modelo.largura) || 80,
    altura: Number(modelo.altura) || 40,
    formato_pagina: formatoPagina,
    orientacao: modelo.orientacao || "retrato",
    margem_superior: Number(modelo.margemSuperior) || 10,
    margem_inferior: Number(modelo.margemInferior) || 10,
    margem_esquerda: Number(modelo.margemEsquerda) || 10,
    margem_direita: Number(modelo.margemDireita) || 10,
    espacamento_horizontal: Number(modelo.espacamentoHorizontal) || 0,
    espacamento_vertical: Number(modelo.espacamentoVertical) || 0,
    largura_pagina: larguraPagina,
    altura_pagina: alturaPagina,
    campos: camposValidados as unknown as Json
  };
  
  console.log("Dados finais para o banco:", result);
  
  return result;
}
