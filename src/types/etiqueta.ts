
import type { Json } from "@/integrations/supabase/types";

export interface CampoEtiqueta {
  tipo: 'nome' | 'codigo' | 'preco';
  x: number;
  y: number;
  largura: number;
  altura: number;
  tamanhoFonte: number;
  valor?: string;
}

export interface ModeloEtiqueta {
  id?: string;
  nome: string;
  descricao?: string;
  largura: number;
  altura: number;
  formatoPagina: string;
  orientacao: 'retrato' | 'paisagem';
  margemSuperior: number;
  margemInferior: number;
  margemEsquerda: number;
  margemDireita: number;
  espacamentoHorizontal: number;
  espacamentoVertical: number;
  larguraPagina?: number;
  alturaPagina?: number;
  campos: CampoEtiqueta[];
  usuario_id?: string;
  criado_em?: string;
  atualizado_em?: string;
}

export interface EtiquetaCustomDB {
  id: string;
  descricao: string;
  tipo: string;
  largura: number;
  altura: number;
  formato_pagina: string;
  orientacao: 'retrato' | 'paisagem';
  margem_superior: number;
  margem_inferior: number;
  margem_esquerda: number;
  margem_direita: number;
  espacamento_horizontal: number;
  espacamento_vertical: number;
  largura_pagina?: number;
  altura_pagina?: number;
  campos: Json;
  criado_por: string;
  criado_em: string;
  atualizado_em: string;
}
