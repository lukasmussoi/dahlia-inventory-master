
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
}
