
import type { ModeloEtiqueta, EtiquetaCustomDB, CampoEtiqueta } from "@/types/etiqueta";
import type { Json } from "@/integrations/supabase/types";

/**
 * Converte um registro do banco de dados para o formato usado no frontend
 */
export function mapDatabaseToModel(item: EtiquetaCustomDB): ModeloEtiqueta {
  console.log("Mapeando item do banco para modelo:", {
    id: item.id,
    descricao: item.descricao,
    formato_pagina: item.formato_pagina,
    orientacao: item.orientacao,
    largura: item.largura,
    altura: item.altura
  });
  
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
            
        campos = camposArray.map((campo: any, index: number) => ({
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
      
      // Log detalhado para debug dos campos
      console.log("Campos carregados do banco:", campos);
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

  // Garantir que a orientação tenha um valor válido (e faça o log)
  const orientacao = item.orientacao || "retrato";
  console.log(`Orientação carregada do banco: "${orientacao}"`);
  
  // Verificar valores do tamanho da grade
  const tamanhoGrade = 5; // Valor padrão para o frontend, já que não existe na tabela
  console.log(`Usando tamanho de grade padrão: ${tamanhoGrade}`);
  
  // Construir o modelo usando valores do banco com fallbacks para valores padrão
  const modeloMapeado: ModeloEtiqueta = {
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
    tamanhoGrade: tamanhoGrade, // Valor padrão
    campos: campos
  };
  
  console.log("Modelo mapeado do banco para o frontend:", {
    id: modeloMapeado.id,
    nome: modeloMapeado.nome,
    formatoPagina: modeloMapeado.formatoPagina,
    orientacao: modeloMapeado.orientacao,
    tamanhoGrade: modeloMapeado.tamanhoGrade,
    campos: modeloMapeado.campos.length
  });
  
  return modeloMapeado;
}

/**
 * Converte um modelo do frontend para o formato usado no banco de dados
 */
export function mapModelToDatabase(modelo: ModeloEtiqueta): Partial<EtiquetaCustomDB> {
  console.log("Mapeando modelo para o banco:", {
    nome: modelo.nome,
    formatoPagina: modelo.formatoPagina,
    orientacao: modelo.orientacao,
    tamanhoGrade: modelo.tamanhoGrade
  });
  
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
    espacamento_vertical: Number(modelo.espacamentoVertical) || 0,
    // Removendo o campo tamanho_grade que não existe na tabela
  };
  
  // Adicionar dimensões da página sempre, mas especialmente se for formato personalizado
  if (formatoPagina === "Custom" || formatoPagina === "Personalizado") {
    dbModel.largura_pagina = Number(modelo.larguraPagina) || 210;
    dbModel.altura_pagina = Number(modelo.alturaPagina) || 297;
  } else {
    // Mesmo para formatos padrão, salvamos as dimensões para manter consistência
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
    console.log("Campos formatados para o banco:", camposFormatados);
  } else {
    // Campos padrão se não houver nenhum
    dbModel.campos = [
      { tipo: 'nome', x: 2, y: 4, largura: 40, altura: 10, tamanhoFonte: 7, alinhamento: 'left' },
      { tipo: 'codigo', x: 20, y: 1, largura: 40, altura: 6, tamanhoFonte: 8, alinhamento: 'left' },
      { tipo: 'preco', x: 70, y: 4, largura: 20, altura: 10, tamanhoFonte: 10, alinhamento: 'left' }
    ] as Json;
  }
  
  console.log("Modelo DB pronto para salvar:", {
    descricao: dbModel.descricao,
    formato_pagina: dbModel.formato_pagina,
    orientacao: dbModel.orientacao,
    campCount: Array.isArray(dbModel.campos) ? dbModel.campos.length : 'N/A'
  });
  
  return dbModel;
}
