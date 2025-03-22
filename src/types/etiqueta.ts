
import type { Json } from "@/integrations/supabase/types";

export interface CampoEtiqueta {
  tipo: 'nome' | 'codigo' | 'preco';
  x: number;
  y: number;
  largura: number;
  altura: number;
  tamanhoFonte: number;
  valor?: string;
  align?: 'left' | 'center' | 'right';
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
  campos: CampoEtiqueta[];
  usuario_id?: string;
  criado_em?: string;
  atualizado_em?: string;
  // Margens internas da etiqueta
  margemInternaEtiquetaSuperior: number;
  margemInternaEtiquetaInferior: number;
  margemInternaEtiquetaEsquerda: number;
  margemInternaEtiquetaDireita: number;
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
  campos: Json;
  criado_por: string;
  criado_em: string;
  atualizado_em: string;
  // Margens internas da etiqueta
  margem_interna_superior: number;
  margem_interna_inferior: number;
  margem_interna_esquerda: number;
  margem_interna_direita: number;
}
