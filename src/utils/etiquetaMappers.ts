
import type { ModeloEtiqueta, EtiquetaCustomDB, CampoEtiqueta } from "@/types/etiqueta";
import type { Json } from "@/integrations/supabase/types";

/**
 * Converte um registro do banco de dados para o formato usado no frontend
 */
export function mapDatabaseToModel(item: EtiquetaCustomDB): ModeloEtiqueta {
  let campos: CampoEtiqueta[] = [];
  
  console.log("Mapeando item do banco para modelo:", JSON.stringify(item, null, 2));
  
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

  // Para formato de página, verificar se é "Custom" e converter para "Personalizado" no front
  let formatoPagina = item.formato_pagina || "A4";
  if (formatoPagina === "Custom") {
    formatoPagina = "Personalizado";
  }

  // Garantir que a orientação tenha um valor válido
  const orientacao = item.orientacao || "retrato";
  
  // Registro completo da conversão do banco para o modelo
  console.log(`Valores mapeados do BD para o frontend:
    - formato_pagina: "${item.formato_pagina}" -> formatoPagina: "${formatoPagina}"
    - orientacao: "${orientacao}"
    - margens: superior=${item.margem_superior || 10}, inferior=${item.margem_inferior || 10}, esquerda=${item.margem_esquerda || 10}, direita=${item.margem_direita || 10}
    - espacamento: horizontal=${item.espacamento_horizontal || 0}, vertical=${item.espacamento_vertical || 0}
    - dimensões da página: ${item.largura_pagina || 'null'}x${item.altura_pagina || 'null'}
  `);

  // Construir o modelo usando valores do banco com fallbacks para valores padrão
  return {
    id: item.id,
    nome: item.descricao,
    descricao: item.descricao,
    largura: Number(item.largura) || 80,
    altura: Number(item.altura) || 40,
    formatoPagina: formatoPagina,
    orientacao: orientacao,
    margemSuperior: Number(item.margem_superior) || 10,
    margemInferior: Number(item.margem_inferior) || 10,
    margemEsquerda: Number(item.margem_esquerda) || 10,
    margemDireita: Number(item.margem_direita) || 10,
    espacamentoHorizontal: Number(item.espacamento_horizontal) || 0,
    espacamentoVertical: Number(item.espacamento_vertical) || 0,
    larguraPagina: Number(item.largura_pagina) || 210,
    alturaPagina: Number(item.altura_pagina) || 297,
    campos
  };
}

/**
 * Converte um modelo do frontend para o formato usado no banco de dados
 */
export function mapModelToDatabase(modelo: ModeloEtiqueta): Partial<EtiquetaCustomDB> {
  // Convertendo 'Personalizado' para 'Custom' para o banco
  let formatoPagina = modelo.formatoPagina;
  if (formatoPagina === "Personalizado") {
    formatoPagina = "Custom";
  }
  
  // Garantir que todos os campos numéricos sejam números
  const dbModel: Partial<EtiquetaCustomDB> = {
    descricao: modelo.nome,
    tipo: 'custom',
    largura: Number(modelo.largura) || 80,
    altura: Number(modelo.altura) || 40,
    formato_pagina: formatoPagina,
    orientacao: modelo.orientacao || 'retrato',
    margem_superior: Number(modelo.margemSuperior) || 10,
    margem_inferior: Number(modelo.margemInferior) || 10,
    margem_esquerda: Number(modelo.margemEsquerda) || 10,
    margem_direita: Number(modelo.margemDireita) || 10,
    espacamento_horizontal: Number(modelo.espacamentoHorizontal) || 0,
    espacamento_vertical: Number(modelo.espacamentoVertical) || 0
  };
  
  // Adicionar dimensões da página apenas se for formato personalizado
  if (formatoPagina === "Custom" || formatoPagina === "Personalizado") {
    dbModel.largura_pagina = Number(modelo.larguraPagina) || 210;
    dbModel.altura_pagina = Number(modelo.alturaPagina) || 297;
  }
  
  // Garantir que os campos estejam no formato correto
  if (modelo.campos && Array.isArray(modelo.campos)) {
    // Certificar que cada campo tenha as propriedades necessárias
    const camposFormatados = modelo.campos.map(campo => ({
      tipo: campo.tipo,
      x: Number(campo.x) || 0,
      y: Number(campo.y) || 0,
      largura: Number(campo.largura) || 10,
      altura: Number(campo.altura) || 10,
      tamanhoFonte: Number(campo.tamanhoFonte) || 10,
      alinhamento: campo.alinhamento || 'left'
    }));
    
    dbModel.campos = camposFormatados as Json;
  } else {
    // Campos padrão se não houver nenhum
    dbModel.campos = [
      { tipo: 'nome', x: 2, y: 4, largura: 40, altura: 10, tamanhoFonte: 7, alinhamento: 'left' },
      { tipo: 'codigo', x: 20, y: 1, largura: 40, altura: 6, tamanhoFonte: 8, alinhamento: 'left' },
      { tipo: 'preco', x: 70, y: 4, largura: 20, altura: 10, tamanhoFonte: 10, alinhamento: 'left' }
    ] as Json;
  }
  
  console.log("Modelo mapeado para o banco:", JSON.stringify(dbModel, null, 2));
  
  return dbModel;
}
