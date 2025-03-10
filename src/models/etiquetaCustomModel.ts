
// Este arquivo é uma substituição temporária para o modelo removido
// Definindo interfaces mínimas para manter a compatibilidade com etiquetaGenerator.ts

export interface CampoEtiqueta {
  tipo: string;
  x: number;
  y: number;
  largura: number;
  altura: number;
  valor: string;
  rotulo?: string;
  fonte?: string;
  tamanhoFonte?: number;
  negrito?: boolean;
  italico?: boolean;
  mostrarCodigo?: boolean;
  moeda?: string;
}

export interface ModeloEtiqueta {
  id?: string;
  nome: string;
  descricao?: string;
  largura: number;
  altura: number;
  margemSuperior: number;
  margemInferior: number;
  margemEsquerda: number;
  margemDireita: number;
  espacamentoHorizontal: number;
  espacamentoVertical: number;
  formatoPagina: string;
  orientacao: string;
  larguraPagina?: number;
  alturaPagina?: number;
  campos: CampoEtiqueta[];
  usuario_id?: string;
  criado_em?: string;
  atualizado_em?: string;
}

// Exportando classe vazia para manter compatibilidade, não será utilizada
export class EtiquetaCustomModel {
  static async getAll() {
    return [];
  }
}
