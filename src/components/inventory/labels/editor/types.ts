
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
}
