
import type { LabelElement, LabelType } from '@/components/inventory/labels/editor/types';
import type { ModeloEtiqueta } from '@/types/etiqueta';

export interface PreviewPDFOptions {
  modelName: string;
  labels: LabelType[];
  pageFormat: string;
  pageSize: { width: number, height: number };
  margins: { top: number, right: number, bottom: number, left: number };
  spacing: { horizontal: number, vertical: number };
  autoAdjustDimensions?: boolean;
  orientation?: string;
}

export interface EtiquetaPrintOptions {
  startRow: number;
  startColumn: number;
  copias: number;
}

