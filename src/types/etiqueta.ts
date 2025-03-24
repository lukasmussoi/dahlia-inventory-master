
// Tipos para as etiquetas customizadas

export interface CampoEtiqueta {
  tipo: 'nome' | 'codigo' | 'preco';
  x: number;
  y: number;
  largura: number;
  altura: number;
  tamanhoFonte: number;
  alinhamento?: 'left' | 'center' | 'right';
  valor?: string;
}

export interface ModeloEtiqueta {
  id?: string;
  nome: string;
  descricao?: string;
  largura: number;
  altura: number;
  formatoPagina: string;
  orientacao: string;
  margemSuperior: number;
  margemInferior: number;
  margemEsquerda: number;
  margemDireita: number;
  espacamentoHorizontal: number;
  espacamentoVertical: number;
  larguraPagina?: number;
  alturaPagina?: number;
  tamanhoGrade?: number;
  campos: CampoEtiqueta[];
  x?: number; // Posição X da etiqueta na página
  y?: number; // Posição Y da etiqueta na página
}

export interface EtiquetaCustomDB {
  id: string;
  descricao: string;
  tipo: string;
  largura: number;
  altura: number;
  formato_pagina: string;
  orientacao: string;
  margem_superior: number;
  margem_inferior: number;
  margem_esquerda: number;
  margem_direita: number;
  espacamento_horizontal: number;
  espacamento_vertical: number;
  largura_pagina?: number;
  altura_pagina?: number;
  campos: any; // Será do tipo Json no banco
  criado_por: string;
  criado_em: string;
  atualizado_em: string;
  x?: number; // Campo para armazenar a posição X na página
  y?: number; // Campo para armazenar a posição Y na página
}
