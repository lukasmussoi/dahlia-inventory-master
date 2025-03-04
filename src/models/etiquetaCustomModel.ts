
import { supabase } from "@/integrations/supabase/client";

export interface CampoEtiqueta {
  id: string;
  tipo: 'texto' | 'preco' | 'codigo' | 'codigoBarras' | 'data' | 'imagem' | 'textoGenerico';
  valor: string;
  rotulo?: string;
  x: number;
  y: number;
  largura: number;
  altura: number;
  fonte?: string;
  tamanhoFonte?: number;
  negrito?: boolean;
  italico?: boolean;
  formatoCodigoBarras?: string;
  mostrarCodigo?: boolean;
  moeda?: string;
}

export interface ModeloEtiqueta {
  id: string;
  descricao: string;
  tipo: 'produto' | 'contato' | 'notaFiscal' | 'ordemServico' | 'venda';
  largura: number;
  altura: number;
  espacamentoHorizontal: number;
  espacamentoVertical: number;
  formatoPagina: 'A4' | 'A5' | 'A3' | 'A2' | 'personalizado';
  orientacao: 'retrato' | 'paisagem';
  larguraPagina?: number;
  alturaPagina?: number;
  margemSuperior: number;
  margemInferior: number;
  margemEsquerda: number;
  margemDireita: number;
  campos: CampoEtiqueta[];
  criado_por: string;
  criado_em: string;
  atualizado_em: string;
}

export class EtiquetaCustomModel {
  // Buscar todos os modelos de etiquetas
  static async getAllModelos(): Promise<ModeloEtiqueta[]> {
    console.log('Buscando modelos de etiquetas...');
    const { data, error } = await supabase
      .from('etiquetas_custom')
      .select('*')
      .order('descricao');

    if (error) {
      console.error('Erro ao buscar modelos de etiquetas:', error);
      throw error;
    }
    
    // Transformar os dados para o formato esperado no frontend
    const modelosFormatados = data.map(item => this.formatarModelo(item));
    return modelosFormatados || [];
  }

  // Buscar um modelo específico
  static async getModeloById(id: string): Promise<ModeloEtiqueta | null> {
    console.log('Buscando modelo de etiqueta por ID:', id);
    const { data, error } = await supabase
      .from('etiquetas_custom')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar modelo de etiqueta:', error);
      throw error;
    }
    
    return data ? this.formatarModelo(data) : null;
  }

  // Criar novo modelo de etiqueta
  static async createModelo(modelo: Omit<ModeloEtiqueta, 'id' | 'criado_em' | 'atualizado_em'>): Promise<ModeloEtiqueta> {
    console.log('Criando novo modelo de etiqueta:', modelo);

    // Transformar o modelo para o formato do banco de dados
    const modeloBD = this.formatarModeloBD(modelo);

    const { data, error } = await supabase
      .from('etiquetas_custom')
      .insert(modeloBD)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar modelo de etiqueta:', error);
      throw error;
    }
    
    return this.formatarModelo(data);
  }

  // Atualizar modelo de etiqueta existente
  static async updateModelo(id: string, modelo: Partial<ModeloEtiqueta>): Promise<ModeloEtiqueta> {
    console.log('Atualizando modelo de etiqueta:', id, modelo);

    // Transformar o modelo para o formato do banco de dados
    const modeloBD = this.formatarModeloBD(modelo);

    const { data, error } = await supabase
      .from('etiquetas_custom')
      .update(modeloBD)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar modelo de etiqueta:', error);
      throw error;
    }
    
    return this.formatarModelo(data);
  }

  // Excluir modelo de etiqueta
  static async deleteModelo(id: string): Promise<void> {
    console.log('Excluindo modelo de etiqueta:', id);
    const { error } = await supabase
      .from('etiquetas_custom')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir modelo de etiqueta:', error);
      throw error;
    }
  }

  // Clonar um modelo existente
  static async clonarModelo(id: string, novaDescricao: string): Promise<ModeloEtiqueta> {
    console.log('Clonando modelo de etiqueta:', id);
    const modelo = await this.getModeloById(id);
    
    if (!modelo) {
      throw new Error('Modelo não encontrado');
    }
    
    const { id: modeloId, criado_em, atualizado_em, ...modeloParaClonar } = modelo;
    
    return this.createModelo({
      ...modeloParaClonar,
      descricao: novaDescricao || `Cópia de ${modelo.descricao}`
    });
  }

  // Obter campos disponíveis para um tipo de etiqueta
  static getCamposDisponiveis(tipo: string): string[] {
    switch (tipo) {
      case 'produto':
        return [
          'nome', 'codigo', 'codigoBarras', 'preco', 'precoCusto', 
          'unidade', 'fornecedor', 'localizacao', 'gtin', 
          'descricao', 'dataValidade', 'textoGenerico'
        ];
      case 'contato':
        return [
          'nome', 'codigo', 'endereco', 'cidade', 'estado',
          'cep', 'telefone', 'email', 'textoGenerico'
        ];
      case 'notaFiscal':
        return [
          'numero', 'data', 'cliente', 'valorTotal',
          'chaveAcesso', 'textoGenerico'
        ];
      case 'ordemServico':
        return [
          'numero', 'data', 'cliente', 'status',
          'valorTotal', 'descricao', 'textoGenerico'
        ];
      case 'venda':
        return [
          'numero', 'data', 'cliente', 'valorTotal',
          'formaPagamento', 'status', 'textoGenerico'
        ];
      default:
        return [];
    }
  }

  // Função auxiliar para transformar o modelo vindo do banco para o formato do frontend
  private static formatarModelo(modeloBD: any): ModeloEtiqueta {
    return {
      id: modeloBD.id,
      descricao: modeloBD.descricao,
      tipo: modeloBD.tipo,
      largura: Number(modeloBD.largura),
      altura: Number(modeloBD.altura),
      espacamentoHorizontal: Number(modeloBD.espacamento_horizontal),
      espacamentoVertical: Number(modeloBD.espacamento_vertical),
      formatoPagina: modeloBD.formato_pagina,
      orientacao: modeloBD.orientacao,
      larguraPagina: modeloBD.largura_pagina ? Number(modeloBD.largura_pagina) : undefined,
      alturaPagina: modeloBD.altura_pagina ? Number(modeloBD.altura_pagina) : undefined,
      margemSuperior: Number(modeloBD.margem_superior),
      margemInferior: Number(modeloBD.margem_inferior),
      margemEsquerda: Number(modeloBD.margem_esquerda),
      margemDireita: Number(modeloBD.margem_direita),
      campos: Array.isArray(modeloBD.campos) ? modeloBD.campos : [],
      criado_por: modeloBD.criado_por,
      criado_em: modeloBD.criado_em,
      atualizado_em: modeloBD.atualizado_em
    };
  }

  // Função auxiliar para transformar o modelo do frontend para o formato do banco
  private static formatarModeloBD(modelo: Partial<ModeloEtiqueta>): any {
    const modeloBD: any = {};

    if (modelo.descricao !== undefined) modeloBD.descricao = modelo.descricao;
    if (modelo.tipo !== undefined) modeloBD.tipo = modelo.tipo;
    if (modelo.largura !== undefined) modeloBD.largura = modelo.largura;
    if (modelo.altura !== undefined) modeloBD.altura = modelo.altura;
    if (modelo.espacamentoHorizontal !== undefined) modeloBD.espacamento_horizontal = modelo.espacamentoHorizontal;
    if (modelo.espacamentoVertical !== undefined) modeloBD.espacamento_vertical = modelo.espacamentoVertical;
    if (modelo.formatoPagina !== undefined) modeloBD.formato_pagina = modelo.formatoPagina;
    if (modelo.orientacao !== undefined) modeloBD.orientacao = modelo.orientacao;
    if (modelo.larguraPagina !== undefined) modeloBD.largura_pagina = modelo.larguraPagina;
    if (modelo.alturaPagina !== undefined) modeloBD.altura_pagina = modelo.alturaPagina;
    if (modelo.margemSuperior !== undefined) modeloBD.margem_superior = modelo.margemSuperior;
    if (modelo.margemInferior !== undefined) modeloBD.margem_inferior = modelo.margemInferior;
    if (modelo.margemEsquerda !== undefined) modeloBD.margem_esquerda = modelo.margemEsquerda;
    if (modelo.margemDireita !== undefined) modeloBD.margem_direita = modelo.margemDireita;
    if (modelo.campos !== undefined) modeloBD.campos = modelo.campos;
    if (modelo.criado_por !== undefined) modeloBD.criado_por = modelo.criado_por;

    return modeloBD;
  }
}
