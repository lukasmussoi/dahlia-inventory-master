
import type { Json } from "@/integrations/supabase/types";

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
}
