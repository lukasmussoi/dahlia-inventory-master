
/**
 * Tipos utilizados nos utilitários de etiquetas
 */

export interface PreviewPDFOptions {
  modelName: string;
  labels: any[];
  pageFormat: string;
  pageSize: {
    width: number;
    height: number;
  };
  pageMargins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  labelSpacing: {
    horizontal: number;
    vertical: number;
  };
  autoAdjustDimensions?: boolean;
  pageOrientation: string;
  gridSize?: number;
}

export interface EtiquetaPrintOptions {
  copias: number;
  mostrarValores?: boolean;
  mostrarCodigos?: boolean;
  incluirBordas?: boolean;
}

/**
 * Interface para margens do documento
 */
export interface Margins {
  superior: number;
  inferior: number;
  esquerda: number;
  direita: number;
}

/**
 * Interface para espaçamentos entre elementos
 */
export interface Spacing {
  horizontal: number;
  vertical: number;
}
