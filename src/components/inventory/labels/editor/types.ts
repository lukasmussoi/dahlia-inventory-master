
export interface ElementType {
  id: string;
  name: string;
  defaultWidth: number;
  defaultHeight: number;
  defaultFontSize: number;
  defaultAlign?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fontSize?: number;
  align?: string;
}

export interface LabelElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  align: string;
}

export interface LabelType {
  id: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  elements: LabelElement[];
}

export interface EtiquetaCreatorProps {
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
  autoAdjustDimensions?: boolean;
  onToggleAutoAdjust?: () => void;
}

export interface EtiquetaEditorProps {
  modelo?: any;
  onSave: (modelo: any) => void;
  onClose: () => void;
  // Propriedades adicionais para o editor legado
  campos?: any[];
  largura?: number;
  altura?: number;
  formatoPagina?: string;
  orientacao?: string;
  margemSuperior?: number;
  margemInferior?: number;
  margemEsquerda?: number;
  margemDireita?: number;
  espacamentoHorizontal?: number;
  espacamentoVertical?: number;
  larguraPagina?: number;
  alturaPagina?: number;
  showPageView?: boolean;
  onCamposChange?: (campos: any[]) => void;
  onDimensoesChange?: (largura: number, altura: number) => void;
  onMargensChange?: (margemSuperior: number, margemInferior: number, margemEsquerda: number, margemDireita: number) => void;
  onEspacamentoChange?: (espacamentoHorizontal: number, espacamentoVertical: number) => void;
  onFormatoChange?: (formatoPagina: string, orientacao: string, larguraPagina?: number, alturaPagina?: number) => void;
}
