
import type { LabelElement, LabelType } from '@/components/inventory/labels/editor/types';
import type { ModeloEtiqueta } from '@/types/etiqueta';

export interface PreviewPDFOptions {
  modelName: string;
  labels: LabelType[];
  pageFormat: string;
  pageSize: { width: number, height: number };
  pageMargins: { top: number, bottom: number, left: number, right: number };
  labelSpacing: { horizontal: number, vertical: number };
  autoAdjustDimensions?: boolean;
  pageOrientation?: string;
}

export interface EtiquetaPrintOptions {
  startRow: number;
  startColumn: number;
  copias: number;
}
