
export interface EtiquetaPrintOptions {
  copias: number;
  multiplicarPorEstoque?: boolean;
}

export interface PreviewPDFOptions {
  modelName: string;
  labels: any[];
  pageFormat: string;
  pageSize: { width: number; height: number };
  pageMargins: { top: number; bottom: number; left: number; right: number };
  labelSpacing: { horizontal: number; vertical: number };
  autoAdjustDimensions: boolean;
  pageOrientation: string;
  gridSize?: number;
}

// Interfaces para definição de margens e espaçamentos
export interface Margins {
  superior: number;
  inferior: number;
  esquerda: number;
  direita: number;
}

export interface Spacing {
  horizontal: number;
  vertical: number;
}
