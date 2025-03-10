
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
    
    return data || [];
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
    
    return data;
  }

  // Criar novo modelo de etiqueta
  static async createModelo(modelo: Omit<ModeloEtiqueta, 'id' | 'criado_em' | 'atualizado_em'>): Promise<ModeloEtiqueta> {
    console.log('Criando novo modelo de etiqueta:', modelo);
    const { data, error } = await supabase
      .from('etiquetas_custom')
      .insert({
        ...modelo,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar modelo de etiqueta:', error);
      throw error;
    }
    
    return data;
  }

  // Atualizar modelo de etiqueta existente
  static async updateModelo(id: string, modelo: Partial<ModeloEtiqueta>): Promise<ModeloEtiqueta> {
    console.log('Atualizando modelo de etiqueta:', id, modelo);
    const { data, error } = await supabase
      .from('etiquetas_custom')
      .update({
        ...modelo,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar modelo de etiqueta:', error);
      throw error;
    }
    
    return data;
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
}
